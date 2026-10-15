-- ============================================================================
-- drop_tables_databricks.sql - Borrado en orden inverso de dependencias FK
-- Regla 6b: Orden jerárquico estricto (hijas antes que padres)
-- ============================================================================

DROP TABLE IF EXISTS epivox_audience_questions CASCADE;
DROP TABLE IF EXISTS epivox_answers CASCADE;
DROP TABLE IF EXISTS epivox_participants CASCADE;
DROP TABLE IF EXISTS epivox_sessions CASCADE;
DROP TABLE IF EXISTS epivox_questions CASCADE;
DROP TABLE IF EXISTS epivox_activities CASCADE;
DROP TABLE IF EXISTS epivox_themes CASCADE;
