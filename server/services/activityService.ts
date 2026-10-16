import { query, exec } from "../db/db.js";
import type { AuthUser } from "./authService.js";

export interface Activity {
  id: number;
  title: string;
  description: string | null;
  category: string;
  activity_type: string;
  theme_id: number | null;
  created_by_user_id: number;
  is_template: boolean;
  is_public: boolean;
  default_time_limit: number;
  default_points: number;
  speed_bonus_enabled: boolean;
  negative_points_enabled: boolean;
  created_at: string;
  updated_at: string;
  questions_count?: number;
  owner_username?: string;
  owner_name?: string | null;
  my_access?: ActivityAccess;
}

export interface Question {
  id: number;
  activity_id: number;
  sort_order: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  points_base: number;
  media_type: string;
  media_url: string | null;
  reveal_step_count: number;
  chart_type: string;
  options_json: string;
  correct_answer_value: string | null;
  explanation_text: string | null;
  created_at: string;
}

export interface Collaborator {
  user_id: number;
  username: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
}

/** Nivel de acceso del usuario sobre una actividad (null = sin acceso). */
export type ActivityAccess = "owner" | "admin" | "editor" | "template";

export const canEditActivity = (access: ActivityAccess | null): boolean =>
  access === "owner" || access === "admin" || access === "editor";

export const canManageActivity = (access: ActivityAccess | null): boolean =>
  access === "owner" || access === "admin";

async function nextId(table: string): Promise<number> {
  const rows = await query<{ next_id: number }>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${table}`,
  );
  return rows[0]?.next_id || 1;
}

export async function getActivityAccess(
  user: AuthUser,
  activityId: number,
): Promise<ActivityAccess | null> {
  const rows = await query<{
    created_by_user_id: number;
    is_template: boolean;
    is_public: boolean;
    collab_role: string | null;
  }>(
    `SELECT a.created_by_user_id, a.is_template, a.is_public, c.role AS collab_role
     FROM epivox_activities a
     LEFT JOIN epivox_collaborators c ON c.activity_id = a.id AND c.user_id = ?
     WHERE a.id = ?`,
    [user.id, activityId],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.created_by_user_id === user.id) return "owner";
  if (user.role === "admin") return "admin";
  if (row.collab_role) return "editor";
  if (row.is_template || row.is_public) return "template";
  return null;
}

/** Presentaciones propias + compartidas conmigo (admin: todas). */
export async function getActivities(user: AuthUser): Promise<Activity[]> {
  const isAdmin = user.role === "admin";
  const sql = `
    SELECT a.*, COUNT(q.id) AS questions_count,
           u.username AS owner_username, u.full_name AS owner_name,
           CASE WHEN a.created_by_user_id = ? THEN 'owner'
                WHEN ? THEN 'admin'
                ELSE 'editor' END AS my_access
    FROM epivox_activities a
    JOIN users u ON u.id = a.created_by_user_id
    LEFT JOIN epivox_questions q ON q.activity_id = a.id
    WHERE ? OR a.created_by_user_id = ?
       OR EXISTS (SELECT 1 FROM epivox_collaborators c
                  WHERE c.activity_id = a.id AND c.user_id = ?)
    GROUP BY ALL
    ORDER BY a.updated_at DESC
  `;
  return query<Activity>(sql, [user.id, isAdmin, isAdmin, user.id, user.id]);
}

export async function getTemplates(): Promise<Activity[]> {
  const sql = `
    SELECT a.*, COUNT(q.id) AS questions_count
    FROM epivox_activities a
    LEFT JOIN epivox_questions q ON q.activity_id = a.id
    WHERE a.is_template = TRUE OR a.is_public = TRUE
    GROUP BY ALL
    ORDER BY a.title ASC
  `;
  return query<Activity>(sql);
}

export async function getActivityById(id: number): Promise<Activity | null> {
  const rows = await query<Activity>(
    `SELECT a.*, u.username AS owner_username, u.full_name AS owner_name
     FROM epivox_activities a
     JOIN users u ON u.id = a.created_by_user_id
     WHERE a.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function getQuestionsByActivityId(
  activityId: number,
): Promise<Question[]> {
  return query<Question>(
    `SELECT * FROM epivox_questions
     WHERE activity_id = ?
     ORDER BY sort_order ASC, id ASC`,
    [activityId],
  );
}

export async function createActivity(
  data: Partial<Activity>,
  ownerUserId: number,
): Promise<Activity> {
  const id = await nextId("epivox_activities");
  await query(
    `INSERT INTO epivox_activities (
       id, title, description, category, activity_type, theme_id, created_by_user_id,
       is_template, is_public, default_time_limit, default_points,
       speed_bonus_enabled, negative_points_enabled, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      data.title || "Nueva Actividad",
      data.description || "",
      data.category || "Capacitación",
      data.activity_type || "quiz",
      data.theme_id || 1,
      ownerUserId,
      Boolean(data.is_template),
      Boolean(data.is_public),
      Number(data.default_time_limit) || 30,
      Number(data.default_points) || 1000,
      data.speed_bonus_enabled !== false,
      Boolean(data.negative_points_enabled),
    ],
  );
  const created = await getActivityById(id);
  if (!created) throw new Error("Error al crear actividad");
  return created;
}

const ACTIVITY_UPDATABLE: Array<keyof Activity> = [
  "title",
  "description",
  "category",
  "activity_type",
  "theme_id",
  "is_template",
  "is_public",
  "default_time_limit",
  "default_points",
  "speed_bonus_enabled",
  "negative_points_enabled",
];

export async function updateActivity(
  id: number,
  data: Partial<Activity>,
): Promise<Activity> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const col of ACTIVITY_UPDATABLE) {
    if (data[col] === undefined) continue;
    sets.push(`${col} = ?`);
    values.push(data[col] === "" && col === "description" ? null : data[col]);
  }
  sets.push("updated_at = CURRENT_TIMESTAMP");
  await query(
    `UPDATE epivox_activities SET ${sets.join(", ")} WHERE id = ?`,
    [...values, id],
  );
  const updated = await getActivityById(id);
  if (!updated) throw new Error("Actividad no encontrada para actualizar");
  return updated;
}

export async function deleteActivity(id: number): Promise<void> {
  // Orden hijo -> padre por FKs. DuckDB no admite borrar hijo y padre dentro
  // de una misma transacción con FK, por eso se ejecutan en secuencia.
  const sessionsOf = `SELECT id FROM epivox_sessions WHERE activity_id = ?`;
  await query(
    `DELETE FROM epivox_audience_questions WHERE session_id IN (${sessionsOf})`,
    [id],
  );
  await query(
    `DELETE FROM epivox_answers WHERE session_id IN (${sessionsOf})
       OR question_id IN (SELECT id FROM epivox_questions WHERE activity_id = ?)`,
    [id, id],
  );
  await query(
    `DELETE FROM epivox_participants WHERE session_id IN (${sessionsOf})`,
    [id],
  );
  await query(`DELETE FROM epivox_sessions WHERE activity_id = ?`, [id]);
  await query(`DELETE FROM epivox_questions WHERE activity_id = ?`, [id]);
  await query(`DELETE FROM epivox_collaborators WHERE activity_id = ?`, [id]);
  await query(`DELETE FROM epivox_activities WHERE id = ?`, [id]);
}

export async function cloneActivity(
  activityId: number,
  targetUserId: number,
): Promise<Activity> {
  const source = await getActivityById(activityId);
  if (!source) throw new Error("Actividad de origen no encontrada");

  const cloned = await createActivity(
    {
      title: `${source.title} (Copia)`,
      description: source.description || "",
      category: source.category,
      activity_type: source.activity_type,
      theme_id: source.theme_id,
      is_template: false,
      is_public: false,
      default_time_limit: source.default_time_limit,
      default_points: source.default_points,
      speed_bonus_enabled: source.speed_bonus_enabled,
      negative_points_enabled: source.negative_points_enabled,
    },
    targetUserId,
  );

  const sourceQuestions = await getQuestionsByActivityId(activityId);
  for (const q of sourceQuestions) {
    await createQuestion({ ...q, activity_id: cloned.id });
  }
  return cloned;
}

export async function createQuestion(
  data: Partial<Question>,
): Promise<Question> {
  const id = await nextId("epivox_questions");
  await query(
    `INSERT INTO epivox_questions (
       id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
       media_type, media_url, reveal_step_count, chart_type, options_json,
       correct_answer_value, explanation_text
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.activity_id,
      Number(data.sort_order) || 1,
      data.question_text || "¿Pregunta?",
      data.question_type || "multiple_choice",
      Number(data.time_limit) || 30,
      data.points_base ?? 1000,
      data.media_type || "none",
      data.media_url || null,
      Number(data.reveal_step_count) || 1,
      data.chart_type || "bar",
      data.options_json || "[]",
      data.correct_answer_value || null,
      data.explanation_text || null,
    ],
  );
  const rows = await query<Question>(
    `SELECT * FROM epivox_questions WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function getQuestionActivityId(
  questionId: number,
): Promise<number | null> {
  const rows = await query<{ activity_id: number }>(
    `SELECT activity_id FROM epivox_questions WHERE id = ?`,
    [questionId],
  );
  return rows[0]?.activity_id ?? null;
}

const QUESTION_UPDATABLE: Array<keyof Question> = [
  "question_text",
  "question_type",
  "time_limit",
  "points_base",
  "media_type",
  "media_url",
  "reveal_step_count",
  "chart_type",
  "options_json",
  "correct_answer_value",
  "explanation_text",
  "sort_order",
];
const QUESTION_NULLABLE = new Set<keyof Question>([
  "media_url",
  "correct_answer_value",
  "explanation_text",
]);

export async function updateQuestion(
  id: number,
  data: Partial<Question>,
): Promise<Question> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const col of QUESTION_UPDATABLE) {
    if (data[col] === undefined) continue;
    sets.push(`${col} = ?`);
    values.push(QUESTION_NULLABLE.has(col) && !data[col] ? null : data[col]);
  }
  if (sets.length > 0) {
    await query(`UPDATE epivox_questions SET ${sets.join(", ")} WHERE id = ?`, [
      ...values,
      id,
    ]);
  }
  const rows = await query<Question>(
    `SELECT * FROM epivox_questions WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function deleteQuestion(id: number): Promise<void> {
  await query(`DELETE FROM epivox_questions WHERE id = ?`, [id]);
}

export async function reorderQuestions(
  activityId: number,
  questionIds: number[],
): Promise<void> {
  for (let idx = 0; idx < questionIds.length; idx++) {
    await query(
      `UPDATE epivox_questions SET sort_order = ? WHERE id = ? AND activity_id = ?`,
      [idx + 1, Number(questionIds[idx]), activityId],
    );
  }
}

export async function setQuestionChartType(
  questionId: number,
  chartType: string,
): Promise<void> {
  await query(`UPDATE epivox_questions SET chart_type = ? WHERE id = ?`, [
    chartType,
    questionId,
  ]);
}

// ---------------------------------------------------------------------------
// Colaboradores (invitados a editar una presentación)
// ---------------------------------------------------------------------------
export async function listCollaborators(
  activityId: number,
): Promise<Collaborator[]> {
  return query<Collaborator>(
    `SELECT c.user_id, u.username, u.full_name, u.email, c.role, c.created_at
     FROM epivox_collaborators c
     JOIN users u ON u.id = c.user_id
     WHERE c.activity_id = ?
     ORDER BY c.created_at ASC`,
    [activityId],
  );
}

export async function addCollaborator(
  activityId: number,
  userId: number,
): Promise<void> {
  const id = await nextId("epivox_collaborators");
  await query(
    `INSERT INTO epivox_collaborators (id, activity_id, user_id, role)
     VALUES (?, ?, ?, 'editor') ON CONFLICT DO NOTHING`,
    [id, activityId, userId],
  );
}

export async function removeCollaborator(
  activityId: number,
  userId: number,
): Promise<void> {
  await query(
    `DELETE FROM epivox_collaborators WHERE activity_id = ? AND user_id = ?`,
    [activityId, userId],
  );
}

// `exec` se mantiene exportado por compatibilidad con otros módulos.
export { exec };
