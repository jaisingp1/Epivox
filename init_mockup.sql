-- ==============================================================================
-- EPIVOX MOCKUP / DEMO DATA (init_mockup.sql)
-- Cuestionarios, preguntas de prueba y sesión demo para entorno de desarrollo.
-- Este archivo NO se carga en entornos de producción (SEED_MOCK_DATA=false).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Actividad Demostrativa 1: "Seguridad Operacional y Cultura Epiroc"
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

-- Preguntas de Actividad 1
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
-- 2. Actividad Demostrativa 2: "Procedimientos Críticos LOTO y Bloqueo de Energía"
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
-- 3. Actividad Demostrativa 3: "Sondeo de Clima Laboral y Liderazgo en Faena"
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
-- 4. Sesión Demo de Prueba y Resultados
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
  (1, 1, 1, 1, 'A', true, 3200, 950),
  (2, 1, 1, 2, 'A', true, 4100, 910),
  (3, 1, 1, 3, 'A', true, 5500, 850),
  (4, 1, 1, 4, 'B', false, 8000, 0),
  (5, 1, 2, 1, 'true', true, 2100, 980),
  (6, 1, 2, 2, 'true', true, 3000, 940),
  (7, 1, 2, 3, 'true', true, 3500, 900),
  (8, 1, 2, 4, 'true', true, 4200, 850),
  (9, 1, 3, 1, 'Compromiso', null, 6000, 0),
  (10, 1, 3, 2, 'Colaboración', null, 7200, 0),
  (11, 1, 3, 3, 'Seguridad', null, 5100, 0),
  (12, 1, 3, 4, 'Innovación', null, 8300, 0),
  (13, 1, 4, 1, '5', null, 4200, 0),
  (14, 1, 4, 2, '5', null, 5000, 0),
  (15, 1, 4, 3, '4', null, 3800, 0),
  (16, 1, 4, 4, '4', null, 6100, 0);

-- ------------------------------------------------------------------------------
-- 3. Banco de Preguntas: Carpetas, Subcarpetas y Preguntas de Ejemplo
-- ------------------------------------------------------------------------------
INSERT INTO epivox_question_folders (id, name, parent_id, created_by_user_id, description, color)
VALUES
  (1, 'Seguridad y Salud Ocupacional', NULL, 1, 'Protocolos de seguridad, LOTO, EPP y reglas cardinales de Epiroc', '#FFC72C'),
  (2, 'Operaciones Mineras y Equipos', NULL, 1, 'Perforadoras, camiones bajo perfil, cargadores y mantenimiento', '#48A9C5'),
  (3, 'Cultura Corporativa y Valores', NULL, 1, 'Innovación, compromiso, colaboración y diversidad', '#86C8BC');

INSERT INTO epivox_question_folders (id, name, parent_id, created_by_user_id, description, color)
VALUES
  (10, 'Procedimientos LOTO y Bloqueo', 1, 1, 'Aislamiento de fuentes de energía y candados personales', '#FFC72C'),
  (11, 'Elementos de Protección Personal (EPP)', 1, 1, 'Uso correcto de respirador, casco, auditivos y arnés', '#E6B327'),
  (20, 'Perforación de Superficie e Interior Mina', 2, 1, 'Pit Viper, Boomer y Simba en operaciones críticas', '#48A9C5');

INSERT INTO epivox_bank_questions (
  id, folder_id, question_text, question_type, time_limit, points_base, chart_type, options_json, correct_answer_value, explanation_text, created_by_user_id
) VALUES
  (1, 10, '¿Cuál es el primer paso indispensable antes de intervenir cualquier circuito hidráulico o eléctrico?', 'multiple_choice', 30, 1000, 'bar', '[{"id":"opt-1","text":"Desenergizar y verificar ausencia de energía residual","is_correct":true},{"id":"opt-2","text":"Avisar al supervisor por radio","is_correct":false},{"id":"opt-3","text":"Colocar cinta de peligro sin candado","is_correct":false},{"id":"opt-4","text":"Empezar a desarmar con guantes","is_correct":false}]', '1', 'Verificar ausencia de tensión y energía cero es la regla cardinal para evitar atrapamientos o electrocución.', 1),
  (2, 10, '¿Se permite compartir o prestar el candado personal LOTO a otro técnico del turno?', 'true_false', 20, 1000, 'bar', '[{"id":"opt-1","text":"Verdadero","is_correct":false},{"id":"opt-2","text":"Falso","is_correct":true}]', '2', 'Cada candado LOTO es estrictamente personal e intransferible.', 1),
  (3, 11, '¿Qué equipo de protección es OBLIGATORIO en áreas con presencia de sílice libre cristalizada?', 'multiple_choice', 25, 1000, 'bar', '[{"id":"opt-1","text":"Respirador de medio rostro con filtros P100 aprobados","is_correct":true},{"id":"opt-2","text":"Mascarilla quirúrgica desechable","is_correct":false},{"id":"opt-3","text":"Pañuelo de tela húmedo","is_correct":false},{"id":"opt-4","text":"Tapón auditivo tipo copa","is_correct":false}]', '1', 'La protección respiratoria contra sílice requiere filtros de alta eficiencia P100 para proteger los pulmones.', 1),
  (4, 11, '¿Cómo calificarías la disponibilidad y estado de tu equipo de protección en tu faena?', 'rating', 30, 0, 'bar', '[{"id":"1","text":"1 Estrella","is_correct":false},{"id":"2","text":"2 Estrellas","is_correct":false},{"id":"3","text":"3 Estrellas","is_correct":false},{"id":"4","text":"4 Estrellas","is_correct":false},{"id":"5","text":"5 Estrellas","is_correct":false}]', null, 'Evaluación rápida de disponibilidad y confort del EPP.', 1),
  (5, 20, '¿Cuál es el equipo de perforación frontal automatizado de Epiroc para túneles y galerías?', 'multiple_choice', 30, 1000, 'bar', '[{"id":"opt-1","text":"Boomer E2 C / S2","is_correct":true},{"id":"opt-2","text":"Pit Viper 351","is_correct":false},{"id":"opt-3","text":"Scooptram ST18","is_correct":false},{"id":"opt-4","text":"Minetruck MT65","is_correct":false}]', '1', 'La línea Boomer es el referente mundial en jumbos de perforación frontal para minería subterránea.', 1),
  (6, 3, '¿Cuál de los siguientes es uno de los valores centrales de Epiroc?', 'multiple_choice', 20, 1000, 'bar', '[{"id":"opt-1","text":"Innovación, Compromiso y Colaboración","is_correct":true},{"id":"opt-2","text":"Velocidad sin protocolo","is_correct":false},{"id":"opt-3","text":"Competencia interna entre áreas","is_correct":false},{"id":"opt-4","text":"Reducción de personal","is_correct":false}]', '1', 'Innovación, Compromiso y Colaboración son los tres pilares de identidad y cultura de Epiroc.', 1),
  (7, 3, 'En una sola palabra: ¿Qué sentimiento te inspira trabajar con el equipo de Epiroc?', 'word_cloud', 45, 0, 'word_cloud', '[]', null, 'Lluvia de palabras colectiva proyectada en tiempo real.', 1);

