import { query } from "../db/db.js";
import { createActivity, createQuestion, getActivityById } from "./activityService.js";
import type { Activity } from "./activityService.js";

export interface QuestionFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_by_user_id: number;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  questions_count?: number;
  subfolders_count?: number;
  creator_name?: string;
}

export interface BankQuestion {
  id: number;
  folder_id: number;
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
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  folder_name?: string;
}

async function nextId(table: string): Promise<number> {
  const rows = await query<{ next_id: number }>(
    `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${table}`,
  );
  return rows[0]?.next_id || 1;
}

/**
 * Garantiza de forma idempotente que las tablas del banco de preguntas existan
 * en la base de datos DuckDB activa.
 */
export async function ensureBankTables(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS epivox_question_folders (
      id INTEGER PRIMARY KEY,
      name VARCHAR NOT NULL,
      parent_id INTEGER,
      created_by_user_id INTEGER NOT NULL,
      description VARCHAR,
      color VARCHAR DEFAULT '#FFC72C',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS epivox_bank_questions (
      id INTEGER PRIMARY KEY,
      folder_id INTEGER NOT NULL,
      question_text VARCHAR NOT NULL,
      question_type VARCHAR NOT NULL,
      time_limit INTEGER NOT NULL DEFAULT 30,
      points_base INTEGER NOT NULL DEFAULT 1000,
      media_type VARCHAR DEFAULT 'none',
      media_url VARCHAR,
      reveal_step_count INTEGER NOT NULL DEFAULT 1,
      chart_type VARCHAR NOT NULL DEFAULT 'bar',
      options_json VARCHAR NOT NULL DEFAULT '[]',
      correct_answer_value VARCHAR,
      explanation_text VARCHAR,
      created_by_user_id INTEGER NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Obtiene todas las carpetas con conteos de preguntas y subcarpetas.
 */
export async function getFolders(): Promise<QuestionFolder[]> {
  await ensureBankTables();
  const sql = `
    SELECT f.*,
           u.username AS creator_username,
           u.full_name AS creator_name,
           (SELECT COUNT(*) FROM epivox_bank_questions q WHERE q.folder_id = f.id) AS questions_count,
           (SELECT COUNT(*) FROM epivox_question_folders sf WHERE sf.parent_id = f.id) AS subfolders_count
    FROM epivox_question_folders f
    LEFT JOIN users u ON u.id = f.created_by_user_id
    ORDER BY f.parent_id NULLS FIRST, f.name ASC
  `;
  return query<QuestionFolder>(sql);
}

/**
 * Crear una nueva carpeta o subcarpeta.
 */
export async function createFolder(
  data: { name: string; parent_id?: number | null; description?: string; color?: string },
  userId: number,
): Promise<QuestionFolder> {
  await ensureBankTables();
  const id = await nextId("epivox_question_folders");
  const parentId = data.parent_id ? Number(data.parent_id) : null;
  const color = data.color || (parentId ? "#48A9C5" : "#FFC72C");

  await query(
    `INSERT INTO epivox_question_folders (
       id, name, parent_id, created_by_user_id, description, color, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [id, data.name.trim(), parentId, userId, data.description?.trim() || null, color],
  );

  const rows = await query<QuestionFolder>(
    `SELECT f.*,
            (SELECT COUNT(*) FROM epivox_bank_questions q WHERE q.folder_id = f.id) AS questions_count,
            (SELECT COUNT(*) FROM epivox_question_folders sf WHERE sf.parent_id = f.id) AS subfolders_count
     FROM epivox_question_folders f
     WHERE f.id = ?`,
    [id],
  );
  return rows[0];
}

/**
 * Actualizar nombre, descripción o color de una carpeta.
 */
export async function updateFolder(
  id: number,
  data: { name?: string; description?: string; color?: string; parent_id?: number | null },
): Promise<QuestionFolder> {
  await ensureBankTables();
  const sets: string[] = ["updated_at = CURRENT_TIMESTAMP"];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    sets.push("name = ?");
    values.push(data.name.trim());
  }
  if (data.description !== undefined) {
    sets.push("description = ?");
    values.push(data.description.trim() || null);
  }
  if (data.color !== undefined) {
    sets.push("color = ?");
    values.push(data.color);
  }
  if (data.parent_id !== undefined) {
    sets.push("parent_id = ?");
    values.push(data.parent_id ? Number(data.parent_id) : null);
  }

  values.push(id);
  await query(
    `UPDATE epivox_question_folders SET ${sets.join(", ")} WHERE id = ?`,
    values,
  );

  const rows = await query<QuestionFolder>(
    `SELECT f.*,
            (SELECT COUNT(*) FROM epivox_bank_questions q WHERE q.folder_id = f.id) AS questions_count,
            (SELECT COUNT(*) FROM epivox_question_folders sf WHERE sf.parent_id = f.id) AS subfolders_count
     FROM epivox_question_folders f
     WHERE f.id = ?`,
    [id],
  );
  return rows[0];
}

/**
 * Eliminar una carpeta y sus subcarpetas y preguntas recursivamente.
 */
export async function deleteFolder(id: number): Promise<void> {
  await ensureBankTables();
  // Obtener IDs de subcarpetas directas
  const subfolders = await query<{ id: number }>(
    `SELECT id FROM epivox_question_folders WHERE parent_id = ?`,
    [id],
  );

  for (const sf of subfolders) {
    await deleteFolder(sf.id);
  }

  // Eliminar preguntas de la carpeta
  await query(`DELETE FROM epivox_bank_questions WHERE folder_id = ?`, [id]);
  // Eliminar la carpeta
  await query(`DELETE FROM epivox_question_folders WHERE id = ?`, [id]);
}

/**
 * Listar preguntas de una carpeta (opcionalmente recursivo con subcarpetas).
 */
export async function getBankQuestions(
  folderId?: number,
  recursive = false,
): Promise<BankQuestion[]> {
  await ensureBankTables();
  if (!folderId) {
    const sql = `
      SELECT q.*, f.name AS folder_name, u.username AS creator_username, u.full_name AS creator_name
      FROM epivox_bank_questions q
      LEFT JOIN epivox_question_folders f ON f.id = q.folder_id
      LEFT JOIN users u ON u.id = q.created_by_user_id
      ORDER BY q.created_at DESC, q.id DESC
    `;
    return query<BankQuestion>(sql);
  }

  if (recursive) {
    // Incluir preguntas de la carpeta y de sus subcarpetas inmediatas
    const sql = `
      SELECT q.*, f.name AS folder_name, u.username AS creator_username, u.full_name AS creator_name
      FROM epivox_bank_questions q
      LEFT JOIN epivox_question_folders f ON f.id = q.folder_id
      LEFT JOIN users u ON u.id = q.created_by_user_id
      WHERE q.folder_id = ? OR q.folder_id IN (
        SELECT id FROM epivox_question_folders WHERE parent_id = ?
      )
      ORDER BY q.created_at DESC, q.id DESC
    `;
    return query<BankQuestion>(sql, [folderId, folderId]);
  }

  const sql = `
    SELECT q.*, f.name AS folder_name, u.username AS creator_username, u.full_name AS creator_name
    FROM epivox_bank_questions q
    LEFT JOIN epivox_question_folders f ON f.id = q.folder_id
    LEFT JOIN users u ON u.id = q.created_by_user_id
    WHERE q.folder_id = ?
    ORDER BY q.created_at DESC, q.id DESC
  `;
  return query<BankQuestion>(sql, [folderId]);
}

/**
 * Crear una pregunta individual en el banco.
 */
export async function createBankQuestion(
  data: Partial<BankQuestion>,
  userId: number,
): Promise<BankQuestion> {
  await ensureBankTables();
  const id = await nextId("epivox_bank_questions");
  await query(
    `INSERT INTO epivox_bank_questions (
       id, folder_id, question_text, question_type, time_limit, points_base,
       media_type, media_url, reveal_step_count, chart_type, options_json,
       correct_answer_value, explanation_text, created_by_user_id,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      id,
      Number(data.folder_id),
      data.question_text || "¿Pregunta?",
      data.question_type || "multiple_choice",
      Number(data.time_limit) || 30,
      data.points_base !== undefined ? Number(data.points_base) : 1000,
      data.media_type || "none",
      data.media_url || null,
      Number(data.reveal_step_count) || 1,
      data.chart_type || "bar",
      data.options_json || "[]",
      data.correct_answer_value || null,
      data.explanation_text || null,
      userId,
    ],
  );

  const rows = await query<BankQuestion>(
    `SELECT q.*, f.name AS folder_name
     FROM epivox_bank_questions q
     LEFT JOIN epivox_question_folders f ON f.id = q.folder_id
     WHERE q.id = ?`,
    [id],
  );
  return rows[0];
}

/**
 * Actualizar una pregunta en el banco.
 */
export async function updateBankQuestion(
  id: number,
  data: Partial<BankQuestion>,
): Promise<BankQuestion> {
  await ensureBankTables();
  const sets: string[] = ["updated_at = CURRENT_TIMESTAMP"];
  const values: unknown[] = [];

  const updatable: Array<keyof BankQuestion> = [
    "folder_id",
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
  ];

  for (const col of updatable) {
    if (data[col] === undefined) continue;
    sets.push(`${col} = ?`);
    values.push(data[col]);
  }

  values.push(id);
  await query(`UPDATE epivox_bank_questions SET ${sets.join(", ")} WHERE id = ?`, values);

  const rows = await query<BankQuestion>(
    `SELECT q.*, f.name AS folder_name
     FROM epivox_bank_questions q
     LEFT JOIN epivox_question_folders f ON f.id = q.folder_id
     WHERE q.id = ?`,
    [id],
  );
  return rows[0];
}

/**
 * Eliminar una pregunta del banco.
 */
export async function deleteBankQuestion(id: number): Promise<void> {
  await ensureBankTables();
  await query(`DELETE FROM epivox_bank_questions WHERE id = ?`, [id]);
}

/**
 * Importación masiva desde Excel (.xlsx) a una carpeta específica.
 */
export async function importExcelToFolder(
  folderId: number,
  questions: Array<{
    questionText: string;
    questionType: string;
    options: Array<{ id: string; text: string; is_correct?: boolean }>;
    timeLimit?: number;
    pointsBase?: number;
    explanation?: string;
  }>,
  userId: number,
): Promise<{ count: number }> {
  await ensureBankTables();
  let inserted = 0;

  for (const q of questions) {
    const id = await nextId("epivox_bank_questions");
    const chartType = q.questionType === "word_cloud" ? "word_cloud" : "bar";
    const correctIdx = q.options?.findIndex((o) => o.is_correct);
    const correctVal = correctIdx !== -1 && correctIdx !== undefined ? String(correctIdx + 1) : null;

    await query(
      `INSERT INTO epivox_bank_questions (
         id, folder_id, question_text, question_type, time_limit, points_base,
         media_type, media_url, reveal_step_count, chart_type, options_json,
         correct_answer_value, explanation_text, created_by_user_id,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'none', NULL, 1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        id,
        folderId,
        q.questionText,
        q.questionType,
        q.timeLimit || 30,
        q.pointsBase ?? 1000,
        chartType,
        JSON.stringify(q.options || []),
        correctVal,
        q.explanation || null,
        userId,
      ],
    );
    inserted++;
  }

  return { count: inserted };
}

/**
 * Copiar preguntas desde el banco hacia una presentación (existente o nueva).
 */
export async function copyBankQuestionsToActivity(options: {
  activityId?: number;
  newActivity?: {
    title: string;
    category: string;
    activity_type: string;
  };
  questionIds: number[];
  userId: number;
}): Promise<Activity> {
  await ensureBankTables();
  let targetActivity: Activity | null = null;

  if (options.activityId) {
    targetActivity = await getActivityById(options.activityId);
    if (!targetActivity) {
      throw new Error("La presentación de destino no existe");
    }
  } else if (options.newActivity) {
    targetActivity = await createActivity(
      {
        title: options.newActivity.title.trim() || "Presentación desde Banco de Preguntas",
        category: options.newActivity.category || "Capacitación",
        activity_type: options.newActivity.activity_type || "quiz",
        default_time_limit: 30,
        default_points: options.newActivity.activity_type === "quiz" ? 1000 : 0,
      },
      options.userId,
    );
  } else {
    throw new Error("Debes indicar una presentación existente o datos para una nueva");
  }

  if (!options.questionIds || options.questionIds.length === 0) {
    return targetActivity;
  }

  // Obtener el orden máximo actual en la actividad destino
  const maxOrderRows = await query<{ max_order: number }>(
    `SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM epivox_questions WHERE activity_id = ?`,
    [targetActivity.id],
  );
  let currentSort = Number(maxOrderRows[0]?.max_order || 0);

  // Obtener las preguntas del banco
  const placeholders = options.questionIds.map(() => "?").join(",");
  const bankQuestions = await query<BankQuestion>(
    `SELECT * FROM epivox_bank_questions WHERE id IN (${placeholders})`,
    options.questionIds,
  );

  for (const bq of bankQuestions) {
    currentSort += 1;
    await createQuestion({
      activity_id: targetActivity.id,
      sort_order: currentSort,
      question_text: bq.question_text,
      question_type: bq.question_type,
      time_limit: bq.time_limit,
      points_base: bq.points_base,
      media_type: bq.media_type,
      media_url: bq.media_url,
      reveal_step_count: bq.reveal_step_count,
      chart_type: bq.chart_type,
      options_json: bq.options_json,
      correct_answer_value: bq.correct_answer_value,
      explanation_text: bq.explanation_text,
    });
  }

  const refreshed = await getActivityById(targetActivity.id);
  return refreshed || targetActivity;
}
