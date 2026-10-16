-- ==============================================================================
-- EPIVOX DATA SEEDS (init_values.sql)
-- Clasificación según Regla 6d: MASTER vs TRANSACCIONAL/PRUEBA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. [MASTER] Temas Corporativos Oficiales Epiroc
-- ------------------------------------------------------------------------------
INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES (
  1,
  'Epiroc Dark Classic',
  '#FFC72C', -- Epiroc Yellow
  '#001E32', -- Epiroc Dark Blue
  '#001E32',
  '#193750',
  '#FFFFFF',
  '#48A9C5', -- Epiroc Light Blue
  'Raleway, sans-serif',
  true
);

INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES (
  2,
  'Epiroc Light Mining',
  '#001E32',
  '#FFC72C',
  '#ECEBE4', -- Epiroc Light Grey
  '#FFFFFF',
  '#001E32',
  '#B7312C', -- Epiroc Red
  'Raleway, sans-serif',
  false
);

-- ------------------------------------------------------------------------------
-- 2. [MASTER] Actividad Maestra de Demostración: "Seguridad y Cultura Minera Epiroc"
-- ------------------------------------------------------------------------------
INSERT INTO epivox_activities (
  id, title, description, category, activity_type, theme_id, created_by_user_id,
  is_template, is_public, default_time_limit, default_points, speed_bonus_enabled
) VALUES (
  1,
  'Seguridad Operacional y Cultura Epiroc',
  'Cuestionario interactivo gamificado para inducción de seguridad, procedimientos LOTO y valores corporativos.',
  'Seguridad',
  'quiz',
  1,
  1,
  true,
  true,
  30,
  1000,
  true
);

-- ------------------------------------------------------------------------------
-- 3. [MASTER] Preguntas de la Actividad 1 (Polimorfismo de Preguntas)
-- ------------------------------------------------------------------------------
-- Pregunta 1: Opción Múltiple (Quiz con puntos y tiempo)
INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, correct_answer_value, explanation_text
) VALUES (
  1,
  1,
  1,
  '¿Cuál es el valor fundamental de Epiroc que rige todas nuestras operaciones en faena?',
  'multiple_choice',
  20,
  1000,
  'bar',
  '[{"id":"A","text":"La Seguridad es Primero","isCorrect":true},{"id":"B","text":"Velocidad antes que revisión","isCorrect":false},{"id":"C","text":"Ahorro de repuestos","isCorrect":false},{"id":"D","text":"Improvisar en terreno","isCorrect":false}]',
  'A',
  'En Epiroc, la seguridad de las personas es innegociable y constituye nuestro primer valor en cada taller y faena.'
);

-- Pregunta 2: Verdadero / Falso
INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, correct_answer_value, explanation_text
) VALUES (
  2,
  1,
  2,
  '¿Es obligatorio aplicar el procedimiento de bloqueo y etiquetado LOTO antes de intervenir un equipo hidráulico?',
  'true_false',
  15,
  1000,
  'bar',
  '[{"id":"true","text":"Verdadero","isCorrect":true},{"id":"false","text":"Falso","isCorrect":false}]',
  'true',
  'El bloqueo LOTO desenergiza las fuentes residuales de energía antes de cualquier intervención mecánica o hidráulica.'
);

-- Pregunta 3: Nube de Palabras (Word Cloud)
INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, explanation_text
) VALUES (
  3,
  1,
  3,
  'En una sola palabra: ¿Qué cualidad define el espíritu de equipo en Epiroc?',
  'word_cloud',
  30,
  0,
  'word_cloud',
  '[]',
  'Las respuestas más frecuentes de los participantes se visualizan en tiempo real con mayor tamaño.'
);

-- Pregunta 4: Escala Likert / Satisfacción
INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, explanation_text
) VALUES (
  4,
  1,
  4,
  '¿Qué tan claras y seguras consideras las herramientas y protocolos de tu jornada diaria?',
  'likert',
  25,
  0,
  'gauge',
  '[{"id":"1","text":"1 - Muy confusas"},{"id":"2","text":"2 - Poco claras"},{"id":"3","text":"3 - Neutro"},{"id":"4","text":"4 - Claras"},{"id":"5","text":"5 - Totalmente claras y seguras"}]',
  'Métrica instantánea para evaluar la percepción de seguridad operativa.'
);

-- Pregunta 5: Opción Múltiple con 5 OPCIONES (Verificación de 5 Opciones completas)
INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, correct_answer_value, explanation_text
) VALUES (
  5,
  1,
  5,
  '¿Cuál es el paso final indispensable antes de dar por liberado un equipo minero tras una mantención?',
  'multiple_choice',
  25,
  1000,
  'bar',
  '[{"id":"A","text":"Retirar candados y tarjetas personales","isCorrect":false},{"id":"B","text":"Inspección visual del área","isCorrect":false},{"id":"C","text":"Prueba funcional y entrega formal al operador","isCorrect":true},{"id":"D","text":"Guardar herramientas en el taller","isCorrect":false},{"id":"E","text":"Avisar al supervisor por radio","isCorrect":false}]',
  'C',
  'La prueba funcional con entrega formal y firma conjunta garantiza que el equipo queda 100% operativo y seguro.'
);

-- ------------------------------------------------------------------------------
-- 3b. [MASTER] Actividad 2: "Procedimientos Críticos LOTO y Bloqueo de Energía"
-- ------------------------------------------------------------------------------
INSERT INTO epivox_activities (
  id, title, description, category, activity_type, theme_id, created_by_user_id,
  is_template, is_public, default_time_limit, default_points, speed_bonus_enabled
) VALUES (
  2,
  'Procedimientos Críticos LOTO y Bloqueo de Energía',
  'Evaluación técnica sobre desenergización, disipación de presiones residuales y permisos de trabajo especial.',
  'Seguridad',
  'quiz',
  1,
  1,
  true,
  true,
  30,
  1000,
  true
);

INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, correct_answer_value, explanation_text
) VALUES (
  6,
  2,
  1,
  '¿Quién es la única persona autorizada para retirar un candado de bloqueo LOTO personal?',
  'multiple_choice',
  20,
  1000,
  'bar',
  '[{"id":"A","text":"El supervisor del turno siguiente","isCorrect":false},{"id":"B","text":"El propio dueño del candado","isCorrect":true},{"id":"C","text":"Cualquier compañero con la llave maestra","isCorrect":false},{"id":"D","text":"El jefe de prevención de riesgos","isCorrect":false},{"id":"E","text":"El operador del equipo intervenido","isCorrect":false}]',
  'B',
  'La regla de oro LOTO establece que cada trabajador instala y retira exclusivamente su propio candado y tarjeta.'
);

-- ------------------------------------------------------------------------------
-- 3c. [MASTER] Actividad 3: "Sondeo de Clima Laboral y Liderazgo en Faena" (Mentimeter)
-- ------------------------------------------------------------------------------
INSERT INTO epivox_activities (
  id, title, description, category, activity_type, theme_id, created_by_user_id,
  is_template, is_public, default_time_limit, default_points, speed_bonus_enabled
) VALUES (
  3,
  'Sondeo de Clima Laboral y Liderazgo en Faena',
  'Pregunta abierta y sondeo interactivo en tiempo real sin concurso para recoger opiniones y propuestas de mejora.',
  'Cultura',
  'open_poll',
  1,
  1,
  true,
  true,
  60,
  0,
  false
);

INSERT INTO epivox_questions (
  id, activity_id, sort_order, question_text, question_type, time_limit, points_base,
  chart_type, options_json, explanation_text
) VALUES (
  7,
  3,
  1,
  '¿Qué iniciativa o idea propones para fortalecer la seguridad y bienestar en nuestras faenas?',
  'word_cloud',
  120,
  0,
  'word_cloud',
  '[]',
  'Las respuestas se proyectan en vivo como Nube de Palabras, Barras o Muro de Ideas según la vista del presentador.'
);

-- ------------------------------------------------------------------------------
-- 4. [TRANSACCIONAL/PRUEBA] Sesión de Demostración y Analítica (Solo DuckDB Local)
-- ------------------------------------------------------------------------------
INSERT INTO epivox_sessions (
  id, pin, activity_id, presenter_user_id, status, current_question_index, current_step,
  session_mode, anonymous_mode, max_participants, started_at, finished_at, created_at
) VALUES (
  1,
  '849201',
  1,
  1,
  'finished',
  4,
  'finished',
  'live',
  false,
  50,
  CURRENT_TIMESTAMP - INTERVAL 30 MINUTE,
  CURRENT_TIMESTAMP - INTERVAL 5 MINUTE,
  CURRENT_TIMESTAMP - INTERVAL 30 MINUTE
);

INSERT INTO epivox_participants (
  id, session_id, nickname, avatar_seed, email, department, team_name, score, correct_count, current_streak, best_streak, is_active
) VALUES 
  (1, 1, 'Carlos Perforación', 'avatar_1', 'carlos.m@epiroc.com', 'Operaciones Norte', 'Perforadores Pro', 3780, 3, 3, 3, true),
  (2, 1, 'María Mina', 'avatar_2', 'maria.s@epiroc.com', 'Mantenimiento Faena', 'Brigada Cero Daño', 3420, 3, 2, 2, true),
  (3, 1, 'Pedro Seguridad', 'avatar_3', 'pedro.l@epiroc.com', 'Prevención de Riesgos', 'Comité Paritario', 2850, 2, 1, 2, true),
  (4, 1, 'Ana Hidráulica', 'avatar_4', 'ana.h@epiroc.com', 'Taller Central', 'Torque Seguro', 1900, 2, 0, 1, true);

INSERT INTO epivox_answers (
  id, session_id, question_id, participant_id, answer_payload, is_correct, time_taken_ms, points_awarded
) VALUES
  -- Pregunta 1
  (1, 1, 1, 1, 'A', true, 3200, 950),
  (2, 1, 1, 2, 'A', true, 4100, 910),
  (3, 1, 1, 3, 'A', true, 5500, 850),
  (4, 1, 1, 4, 'B', false, 8000, 0),
  -- Pregunta 2
  (5, 1, 2, 1, 'true', true, 2100, 980),
  (6, 1, 2, 2, 'true', true, 3000, 940),
  (7, 1, 2, 3, 'true', true, 3500, 900),
  (8, 1, 2, 4, 'true', true, 4200, 850),
  -- Pregunta 3 (Word Cloud)
  (9, 1, 3, 1, 'Compromiso', null, 6000, 0),
  (10, 1, 3, 2, 'Colaboración', null, 7200, 0),
  (11, 1, 3, 3, 'Seguridad', null, 5100, 0),
  (12, 1, 3, 4, 'Innovación', null, 8300, 0),
  -- Pregunta 4 (Likert)
  (13, 1, 4, 1, '5', null, 4200, 0),
  (14, 1, 4, 2, '5', null, 5000, 0),
  (15, 1, 4, 3, '4', null, 3800, 0),
  (16, 1, 4, 4, '4', null, 6100, 0);
