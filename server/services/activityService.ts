import { query, exec } from "../db/db.js";

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

export async function getActivities(userId = 1): Promise<Activity[]> {
  const sql = `
    SELECT a.*, COUNT(q.id) as questions_count
    FROM epivox_activities a
    LEFT JOIN epivox_questions q ON q.activity_id = a.id
    WHERE a.created_by_user_id = ? OR a.is_public = TRUE
    GROUP BY a.id, a.title, a.description, a.category, a.activity_type, a.theme_id, 
             a.created_by_user_id, a.is_template, a.is_public, a.default_time_limit, 
             a.default_points, a.speed_bonus_enabled, a.negative_points_enabled, 
             a.created_at, a.updated_at
    ORDER BY a.updated_at DESC
  `;
  return query<Activity>(sql, [userId]);
}

export async function getTemplates(): Promise<Activity[]> {
  const sql = `
    SELECT a.*, COUNT(q.id) as questions_count
    FROM epivox_activities a
    LEFT JOIN epivox_questions q ON q.activity_id = a.id
    WHERE a.is_template = TRUE OR a.is_public = TRUE
    GROUP BY a.id, a.title, a.description, a.category, a.activity_type, a.theme_id, 
             a.created_by_user_id, a.is_template, a.is_public, a.default_time_limit, 
             a.default_points, a.speed_bonus_enabled, a.negative_points_enabled, 
             a.created_at, a.updated_at
    ORDER BY a.title ASC
  `;
  return query<Activity>(sql);
}

export async function getActivityById(id: number): Promise<Activity | null> {
  const sql = `SELECT * FROM epivox_activities WHERE id = ?`;
  const rows = await query<Activity>(sql, [id]);
  return rows[0] || null;
}

export async function getQuestionsByActivityId(
  activityId: number,
): Promise<Question[]> {
  const sql = `
    SELECT * FROM epivox_questions 
    WHERE activity_id = ? 
    ORDER BY sort_order ASC, id ASC
  `;
  return query<Question>(sql, [activityId]);
}

export async function createActivity(
  data: Partial<Activity>,
): Promise<Activity> {
  const nextIdRows = await query<{ next_id: number }>(`
    SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM epivox_activities
  `);
  const id = nextIdRows[0]?.next_id || 1;

  const title = data.title || "Nueva Actividad";
  const description = data.description || "";
  const category = data.category || "Capacitación";
  const activity_type = data.activity_type || "quiz";
  const theme_id = data.theme_id || 1;
  const created_by = data.created_by_user_id || 1;
  const is_template = data.is_template ? "TRUE" : "FALSE";
  const is_public = data.is_public ? "TRUE" : "FALSE";
  const time_limit = data.default_time_limit || 30;
  const points = data.default_points || 1000;
  const speed_bonus = data.speed_bonus_enabled !== false ? "TRUE" : "FALSE";
  const negative_points = data.negative_points_enabled ? "TRUE" : "FALSE";

  const sql = `
    INSERT INTO epivox_activities (
      id, title, description, category, activity_type, theme_id, created_by_user_id,
      is_template, is_public, default_time_limit, default_points, speed_bonus_enabled, negative_points_enabled,
      created_at, updated_at
    ) VALUES (
      ${id}, '${title.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}', '${category}', 
      '${activity_type}', ${theme_id}, ${created_by}, ${is_template}, ${is_public}, ${time_limit}, 
      ${points}, ${speed_bonus}, ${negative_points}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `;
  await exec(sql);

  const created = await getActivityById(id);
  if (!created) throw new Error("Error al crear actividad");
  return created;
}

export async function updateActivity(
  id: number,
  data: Partial<Activity>,
): Promise<Activity> {
  const updates: string[] = [];

  if (data.title !== undefined)
    updates.push(`title = '${data.title.replace(/'/g, "''")}'`);
  if (data.description !== undefined) {
    updates.push(
      data.description
        ? `description = '${data.description.replace(/'/g, "''")}'`
        : "description = NULL",
    );
  }
  if (data.category !== undefined)
    updates.push(`category = '${data.category.replace(/'/g, "''")}'`);
  if (data.activity_type !== undefined)
    updates.push(`activity_type = '${data.activity_type}'`);
  if (data.theme_id !== undefined) updates.push(`theme_id = ${data.theme_id}`);
  if (data.is_template !== undefined)
    updates.push(`is_template = ${data.is_template ? "TRUE" : "FALSE"}`);
  if (data.is_public !== undefined)
    updates.push(`is_public = ${data.is_public ? "TRUE" : "FALSE"}`);
  if (data.default_time_limit !== undefined)
    updates.push(`default_time_limit = ${data.default_time_limit}`);
  if (data.default_points !== undefined)
    updates.push(`default_points = ${data.default_points}`);
  if (data.speed_bonus_enabled !== undefined)
    updates.push(
      `speed_bonus_enabled = ${data.speed_bonus_enabled ? "TRUE" : "FALSE"}`,
    );
  if (data.negative_points_enabled !== undefined)
    updates.push(
      `negative_points_enabled = ${data.negative_points_enabled ? "TRUE" : "FALSE"}`,
    );

  updates.push("updated_at = CURRENT_TIMESTAMP");

  const sql = `UPDATE epivox_activities SET ${updates.join(", ")} WHERE id = ${id}`;
  await exec(sql);

  const updated = await getActivityById(id);
  if (!updated) throw new Error("Actividad no encontrada para actualizar");
  return updated;
}

export async function deleteActivity(id: number): Promise<void> {
  // 1. Eliminar preguntas de la audiencia de las sesiones de esta actividad
  await exec(
    `DELETE FROM epivox_audience_questions WHERE session_id IN (SELECT id FROM epivox_sessions WHERE activity_id = ${id})`,
  );

  // 2. Eliminar respuestas enviadas asociadas a sesiones o preguntas de esta actividad
  await exec(
    `DELETE FROM epivox_answers WHERE session_id IN (SELECT id FROM epivox_sessions WHERE activity_id = ${id}) OR question_id IN (SELECT id FROM epivox_questions WHERE activity_id = ${id})`,
  );

  // 3. Eliminar participantes de las sesiones de esta actividad
  await exec(
    `DELETE FROM epivox_participants WHERE session_id IN (SELECT id FROM epivox_sessions WHERE activity_id = ${id})`,
  );

  // 4. Eliminar sesiones de esta actividad
  await exec(`DELETE FROM epivox_sessions WHERE activity_id = ${id}`);

  // 5. Eliminar preguntas de la actividad
  await exec(`DELETE FROM epivox_questions WHERE activity_id = ${id}`);

  // 6. Eliminar la actividad
  await exec(`DELETE FROM epivox_activities WHERE id = ${id}`);
}

export async function cloneActivity(
  activityId: number,
  targetUserId = 1,
): Promise<Activity> {
  const source = await getActivityById(activityId);
  if (!source) throw new Error("Actividad de origen no encontrada");

  const cloned = await createActivity({
    title: `${source.title} (Copia)`,
    description: source.description || "",
    category: source.category,
    activity_type: source.activity_type,
    theme_id: source.theme_id,
    created_by_user_id: targetUserId,
    is_template: false,
    is_public: false,
    default_time_limit: source.default_time_limit,
    default_points: source.default_points,
    speed_bonus_enabled: source.speed_bonus_enabled,
    negative_points_enabled: source.negative_points_enabled,
  });

  const sourceQuestions = await getQuestionsByActivityId(activityId);
  for (const q of sourceQuestions) {
    await createQuestion({
      activity_id: cloned.id,
      sort_order: q.sort_order,
      question_text: q.question_text,
      question_type: q.question_type,
      time_limit: q.time_limit,
      points_base: q.points_base,
      media_type: q.media_type,
      media_url: q.media_url,
      reveal_step_count: q.reveal_step_count,
      chart_type: q.chart_type,
      options_json: q.options_json,
      correct_answer_value: q.correct_answer_value,
      explanation_text: q.explanation_text,
    });
  }

  return cloned;
}

export async function createQuestion(
  data: Partial<Question>,
): Promise<Question> {
  const nextIdRows = await query<{ next_id: number }>(`
    SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM epivox_questions
  `);
  const id = nextIdRows[0]?.next_id || 1;

  const activity_id = data.activity_id || 1;
  const sort_order = data.sort_order || 1;
  const question_text = data.question_text || "¿Pregunta?";
  const question_type = data.question_type || "multiple_choice";
  const time_limit = data.time_limit || 30;
  const points_base = data.points_base || 1000;
  const media_type = data.media_type || "none";
  const media_url = data.media_url ? `'${data.media_url}'` : "NULL";
  const reveal_step = data.reveal_step_count || 1;
  const chart_type = data.chart_type || "bar";
  const options_json = data.options_json || "[]";
  const correct_answer = data.correct_answer_value
    ? `'${data.correct_answer_value.replace(/'/g, "''")}'`
    : "NULL";
  const explanation = data.explanation_text
    ? `'${data.explanation_text.replace(/'/g, "''")}'`
    : "NULL";

  const sql = `
    INSERT INTO epivox_questions (
      id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
      media_type, media_url, reveal_step_count, chart_type, options_json, correct_answer_value, explanation_text
    ) VALUES (
      ${id}, ${activity_id}, ${sort_order}, '${question_text.replace(/'/g, "''")}',
      '${question_type}', ${time_limit}, ${points_base}, '${media_type}', ${media_url},
      ${reveal_step}, '${chart_type}', '${options_json.replace(/'/g, "''")}', ${correct_answer}, ${explanation}
    )
  `;
  await exec(sql);

  const rows = await query<Question>(
    `SELECT * FROM epivox_questions WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function updateQuestion(
  id: number,
  data: Partial<Question>,
): Promise<Question> {
  const updates: string[] = [];

  if (data.question_text !== undefined)
    updates.push(`question_text = '${data.question_text.replace(/'/g, "''")}'`);
  if (data.question_type !== undefined)
    updates.push(`question_type = '${data.question_type}'`);
  if (data.time_limit !== undefined)
    updates.push(`time_limit = ${data.time_limit}`);
  if (data.points_base !== undefined)
    updates.push(`points_base = ${data.points_base}`);
  if (data.media_type !== undefined)
    updates.push(`media_type = '${data.media_type}'`);
  if (data.media_url !== undefined) {
    updates.push(
      data.media_url ? `media_url = '${data.media_url}'` : "media_url = NULL",
    );
  }
  if (data.reveal_step_count !== undefined)
    updates.push(`reveal_step_count = ${data.reveal_step_count}`);
  if (data.chart_type !== undefined)
    updates.push(`chart_type = '${data.chart_type}'`);
  if (data.options_json !== undefined)
    updates.push(`options_json = '${data.options_json.replace(/'/g, "''")}'`);
  if (data.correct_answer_value !== undefined) {
    updates.push(
      data.correct_answer_value
        ? `correct_answer_value = '${data.correct_answer_value.replace(/'/g, "''")}'`
        : "correct_answer_value = NULL",
    );
  }
  if (data.explanation_text !== undefined) {
    updates.push(
      data.explanation_text
        ? `explanation_text = '${data.explanation_text.replace(/'/g, "''")}'`
        : "explanation_text = NULL",
    );
  }
  if (data.sort_order !== undefined)
    updates.push(`sort_order = ${data.sort_order}`);

  if (updates.length > 0) {
    const sql = `UPDATE epivox_questions SET ${updates.join(", ")} WHERE id = ${id}`;
    await exec(sql);
  }

  const rows = await query<Question>(
    `SELECT * FROM epivox_questions WHERE id = ?`,
    [id],
  );
  return rows[0];
}

export async function deleteQuestion(id: number): Promise<void> {
  await exec(`DELETE FROM epivox_questions WHERE id = ${id}`);
}

export async function reorderQuestions(
  activityId: number,
  questionIds: number[],
): Promise<void> {
  for (let idx = 0; idx < questionIds.length; idx++) {
    const qId = questionIds[idx];
    await exec(
      `UPDATE epivox_questions SET sort_order = ${idx + 1} WHERE id = ${qId} AND activity_id = ${activityId}`,
    );
  }
}
