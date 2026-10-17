import { query, exec } from "../db/db.js";

export interface Session {
  id: number;
  pin: string;
  activity_id: number;
  presenter_user_id: number;
  status: string; // 'lobby', 'in_progress', 'question_active', 'question_closed', 'leaderboard', 'finished'
  current_question_index: number;
  current_step: string;
  session_mode: string;
  anonymous_mode: boolean;
  max_participants: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  activity_title?: string;
  participants_count?: number;
}

export interface Participant {
  id: number;
  session_id: number;
  nickname: string;
  avatar_seed: string;
  email: string | null;
  department: string | null;
  team_name: string | null;
  score: number;
  correct_count: number;
  current_streak: number;
  best_streak: number;
  socket_id: string | null;
  is_active: boolean;
  joined_at: string;
}

export interface Answer {
  id: number;
  session_id: number;
  question_id: number;
  participant_id: number;
  answer_payload: string;
  is_correct: boolean | null;
  time_taken_ms: number;
  points_awarded: number;
  submitted_at: string;
}

export interface QuestionReport {
  question_id: number;
  question_text: string;
  question_type: string;
  sort_order: number;
  total_answers: number;
  correct_answers: number;
  accuracy_pct: number;
  avg_time_ms: number;
  distribution: Record<string, number>;
}

export interface SessionReport {
  session: Session;
  total_participants: number;
  total_answers: number;
  overall_accuracy_pct: number;
  avg_response_time_ms: number;
  questions: QuestionReport[];
  participants: Participant[];
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createSession(
  activityId: number,
  presenterUserId = 1,
  options?: { mode?: string; anonymous?: boolean; maxParticipants?: number },
): Promise<Session> {
  const pin = generatePin();

  const nextIdRows = await query<{ next_id: number }>(`
    SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM epivox_sessions
  `);
  const id = nextIdRows[0]?.next_id || 1;

  const mode = options?.mode || "live";
  const anonymous = options?.anonymous ? "TRUE" : "FALSE";
  const maxParts = options?.maxParticipants || 500;

  const sql = `
    INSERT INTO epivox_sessions (
      id, pin, activity_id, presenter_user_id, status, current_question_index, 
      current_step, session_mode, anonymous_mode, max_participants
    ) VALUES (
      ${id}, '${pin}', ${activityId}, ${presenterUserId}, 'lobby', 0, 
      'lobby', '${mode}', ${anonymous}, ${maxParts}
    )
  `;
  await exec(sql);

  const rows = await query<Session>(
    `SELECT * FROM epivox_sessions WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function getAllSessions(): Promise<Session[]> {
  const sql = `
    SELECT s.*, a.title as activity_title, COUNT(p.id) as participants_count
    FROM epivox_sessions s
    LEFT JOIN epivox_activities a ON a.id = s.activity_id
    LEFT JOIN epivox_participants p ON p.session_id = s.id
    GROUP BY s.id, s.pin, s.activity_id, s.presenter_user_id, s.status, 
             s.current_question_index, s.current_step, s.session_mode, 
             s.anonymous_mode, s.max_participants, s.started_at, s.finished_at, 
             s.created_at, a.title
    ORDER BY s.created_at DESC
  `;
  return query<Session>(sql);
}

export async function getSessionById(id: number): Promise<Session | null> {
  const rows = await query<Session>(
    `
    SELECT s.*, a.title as activity_title 
    FROM epivox_sessions s
    LEFT JOIN epivox_activities a ON a.id = s.activity_id
    WHERE s.id = ?
  `,
    [id],
  );
  return rows[0] || null;
}

export async function getSessionByPin(pin: string): Promise<Session | null> {
  const rows = await query<Session>(
    `
    SELECT s.*, a.title as activity_title 
    FROM epivox_sessions s
    LEFT JOIN epivox_activities a ON a.id = s.activity_id
    WHERE s.pin = ?
  `,
    [pin],
  );
  return rows[0] || null;
}

export async function addParticipant(
  sessionId: number,
  nickname: string,
  avatarSeed: string,
  department?: string,
): Promise<Participant> {
  const nextIdRows = await query<{ next_id: number }>(`
    SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM epivox_participants
  `);
  const id = nextIdRows[0]?.next_id || 1;

  const deptVal = department ? `'${department.replace(/'/g, "''")}'` : "NULL";

  const sql = `
    INSERT INTO epivox_participants (
      id, session_id, nickname, avatar_seed, department, score, correct_count, current_streak, best_streak, is_active
    ) VALUES (
      ${id}, ${sessionId}, '${nickname.replace(/'/g, "''")}', '${avatarSeed}', ${deptVal}, 0, 0, 0, 0, TRUE
    )
  `;
  await exec(sql);

  const rows = await query<Participant>(
    `SELECT * FROM epivox_participants WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function getParticipants(
  sessionId: number,
): Promise<Participant[]> {
  const sql = `
    SELECT * FROM epivox_participants 
    WHERE session_id = ? AND is_active = TRUE 
    ORDER BY score DESC, nickname ASC
  `;
  return query<Participant>(sql, [sessionId]);
}

export async function updateSessionState(
  sessionId: number,
  status: string,
  questionIndex?: number,
  step?: string,
): Promise<void> {
  const qIdxSql =
    questionIndex !== undefined
      ? `, current_question_index = ${questionIndex}`
      : "";
  const stepSql = step !== undefined ? `, current_step = '${step}'` : "";

  let extraSql = "";
  if (status === "in_progress" || status === "question_active") {
    extraSql = ", started_at = CURRENT_TIMESTAMP";
  } else if (status === "finished" || status === "cancelled") {
    extraSql = ", finished_at = CURRENT_TIMESTAMP";
  }

  const sql = `
    UPDATE epivox_sessions 
    SET status = '${status}' ${qIdxSql} ${stepSql} ${extraSql}
    WHERE id = ${sessionId}
  `;
  await exec(sql);
}

export async function cancelSession(idOrPin: number | string): Promise<boolean> {
  const isNumber = typeof idOrPin === "number" || /^\d+$/.test(String(idOrPin));
  const filter = isNumber ? `id = ${idOrPin}` : `pin = '${idOrPin}'`;
  await exec(`
    UPDATE epivox_sessions 
    SET status = 'cancelled', current_step = 'cancelled', finished_at = CURRENT_TIMESTAMP
    WHERE ${filter}
  `);
  return true;
}

export async function recordAnswer(
  sessionId: number,
  questionId: number,
  participantId: number,
  answerPayload: string,
  isCorrect: boolean,
  timeTakenMs: number,
  pointsAwarded: number,
  newStreak: number,
): Promise<void> {
  const nextIdRows = await query<{ next_id: number }>(`
    SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM epivox_answers
  `);
  const id = nextIdRows[0]?.next_id || 1;

  const isCorrectSql = isCorrect ? "TRUE" : "FALSE";

  const sqlAnswer = `
    INSERT INTO epivox_answers (
      id, session_id, question_id, participant_id, answer_payload, is_correct, time_taken_ms, points_awarded
    ) VALUES (
      ${id}, ${sessionId}, ${questionId}, ${participantId}, '${answerPayload.replace(/'/g, "''")}', 
      ${isCorrectSql}, ${timeTakenMs}, ${pointsAwarded}
    )
  `;
  await exec(sqlAnswer);

  const correctIncrement = isCorrect ? 1 : 0;
  const sqlParticipant = `
    UPDATE epivox_participants 
    SET score = score + ${pointsAwarded},
        correct_count = correct_count + ${correctIncrement},
        current_streak = ${newStreak},
        best_streak = CASE WHEN ${newStreak} > best_streak THEN ${newStreak} ELSE best_streak END
    WHERE id = ${participantId}
  `;
  await exec(sqlParticipant);
}

export async function hasParticipantAnsweredQuestion(
  sessionId: number,
  questionId: number,
  participantId: number,
): Promise<boolean> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(id) as cnt FROM epivox_answers WHERE session_id = ? AND question_id = ? AND participant_id = ?`,
    [sessionId, questionId, participantId],
  );
  return Number(rows[0]?.cnt || 0) > 0;
}

export async function getLiveResults(
  sessionId: number,
  questionId: number,
): Promise<Record<string, number>> {
  const rows = await query<{ answer_payload: string; count: number }>(
    `
    SELECT answer_payload, COUNT(id) as count 
    FROM epivox_answers 
    WHERE session_id = ? AND question_id = ?
    GROUP BY answer_payload
  `,
    [sessionId, questionId],
  );

  const results: Record<string, number> = {};
  for (const r of rows) {
    results[r.answer_payload] = Number(r.count);
  }
  return results;
}

export async function getQuestionAnswers(
  sessionId: number,
  questionId: number,
): Promise<
  Array<{
    id: number;
    participant_id: number;
    nickname: string;
    department: string | null;
    answer_payload: string;
    submitted_at: string;
  }>
> {
  const sql = `
    SELECT a.id, a.participant_id, p.nickname, p.department, a.answer_payload, a.submitted_at
    FROM epivox_answers a
    JOIN epivox_participants p ON p.id = a.participant_id
    WHERE a.session_id = ? AND a.question_id = ?
    ORDER BY a.submitted_at DESC
  `;
  return query(sql, [sessionId, questionId]);
}

export async function getLeaderboard(
  sessionId: number,
  limit = 5,
): Promise<Participant[]> {
  const sql = `
    SELECT id, session_id, nickname, avatar_seed, department, team_name, score, 
           correct_count, current_streak, best_streak, is_active, joined_at, NULL as socket_id
    FROM epivox_participants 
    WHERE session_id = ? AND is_active = TRUE 
    ORDER BY score DESC, correct_count DESC, id ASC 
    LIMIT ${limit}
  `;
  return query<Participant>(sql, [sessionId]);
}

export async function getSessionReport(
  sessionId: number,
): Promise<SessionReport> {
  const session = await getSessionById(sessionId);
  if (!session) throw new Error("Sesión no encontrada");

  const participants = await getParticipants(sessionId);

  // Totales
  const totalAnswersRows = await query<{
    total: number;
    correct: number;
    avg_time: number;
  }>(
    `
    SELECT COUNT(id) as total, 
           COUNT(CASE WHEN is_correct = TRUE THEN 1 END) as correct,
           COALESCE(AVG(time_taken_ms), 0) as avg_time
    FROM epivox_answers 
    WHERE session_id = ?
  `,
    [sessionId],
  );

  const totalAns = Number(totalAnswersRows[0]?.total || 0);
  const correctAns = Number(totalAnswersRows[0]?.correct || 0);
  const avgTime = Math.round(Number(totalAnswersRows[0]?.avg_time || 0));
  const overallAcc =
    totalAns > 0 ? Math.round((correctAns / totalAns) * 100) : 0;

  // Breakdown per question
  const questionsRows = await query<{
    id: number;
    question_text: string;
    question_type: string;
    sort_order: number;
  }>(
    `
    SELECT id, question_text, question_type, sort_order 
    FROM epivox_questions 
    WHERE activity_id = ?
    ORDER BY sort_order ASC, id ASC
  `,
    [session.activity_id],
  );

  const questionsReport: QuestionReport[] = [];

  for (const q of questionsRows) {
    const qAnswers = await query<{
      total: number;
      correct: number;
      avg_time: number;
    }>(
      `
      SELECT COUNT(id) as total,
             COUNT(CASE WHEN is_correct = TRUE THEN 1 END) as correct,
             COALESCE(AVG(time_taken_ms), 0) as avg_time
      FROM epivox_answers 
      WHERE session_id = ? AND question_id = ?
    `,
      [sessionId, q.id],
    );

    const distRows = await query<{ answer_payload: string; count: number }>(
      `
      SELECT answer_payload, COUNT(id) as count
      FROM epivox_answers 
      WHERE session_id = ? AND question_id = ?
      GROUP BY answer_payload
    `,
      [sessionId, q.id],
    );

    const distribution: Record<string, number> = {};
    for (const d of distRows) {
      distribution[d.answer_payload] = Number(d.count);
    }

    const qTotal = Number(qAnswers[0]?.total || 0);
    const qCorrect = Number(qAnswers[0]?.correct || 0);
    const qAvgTime = Math.round(Number(qAnswers[0]?.avg_time || 0));

    questionsReport.push({
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      sort_order: q.sort_order,
      total_answers: qTotal,
      correct_answers: qCorrect,
      accuracy_pct: qTotal > 0 ? Math.round((qCorrect / qTotal) * 100) : 0,
      avg_time_ms: qAvgTime,
      distribution,
    });
  }

  return {
    session,
    total_participants: participants.length,
    total_answers: totalAns,
    overall_accuracy_pct: overallAcc,
    avg_response_time_ms: avgTime,
    questions: questionsReport,
    participants,
  };
}

export interface HubGlobalStats {
  totalParticipants: number;
  accuracyRate: number | null;
  totalSessions: number;
}

export async function getHubGlobalStats(): Promise<HubGlobalStats> {
  const partResult = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM epivox_participants",
  );
  const totalParticipants = Number(partResult[0]?.count || 0);

  const accResult = await query<{ total: number; correct: number }>(
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END) as correct
     FROM epivox_answers
     WHERE is_correct IS NOT NULL`,
  );
  const totalAnswers = Number(accResult[0]?.total || 0);
  const correctAnswers = Number(accResult[0]?.correct || 0);
  const accuracyRate =
    totalAnswers > 0
      ? Math.round((correctAnswers / totalAnswers) * 1000) / 10
      : null;

  const sessResult = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM epivox_sessions",
  );
  const totalSessions = Number(sessResult[0]?.count || 0);

  return {
    totalParticipants,
    accuracyRate,
    totalSessions,
  };
}

