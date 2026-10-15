-- ============================================================================
-- init_values_databricks.sql - DML Seeds Maestros para Databricks/PostgreSQL
-- Reglas 6b, 6c y 6d: SOLO datos MASTER (sin datos transaccionales de prueba)
-- ============================================================================

INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES (
  1,
  'Epiroc Dark Classic',
  '#FFC72C',
  '#001E32',
  '#001E32',
  '#193750',
  '#FFFFFF',
  '#48A9C5',
  'Raleway, sans-serif',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO epivox_themes (id, name, primary_color, secondary_color, background_color, card_color, text_color, accent_color, font_family, is_default)
VALUES (
  2,
  'Epiroc Light Mining',
  '#001E32',
  '#FFC72C',
  '#ECEBE4',
  '#FFFFFF',
  '#001E32',
  '#B7312C',
  'Raleway, sans-serif',
  false
) ON CONFLICT (id) DO NOTHING;

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
) ON CONFLICT (id) DO NOTHING;
