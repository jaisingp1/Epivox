-- ============================================================================
-- schema.sql - DDL Estructural para Epivox (DuckDB Local)
-- Regla 6b: SOLO sentencias DDL (sin sentencias DML/INSERT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS epivox_themes (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  primary_color VARCHAR NOT NULL DEFAULT '#FFC72C',
  secondary_color VARCHAR NOT NULL DEFAULT '#001E32',
  background_color VARCHAR NOT NULL DEFAULT '#001E32',
  card_color VARCHAR NOT NULL DEFAULT '#193750',
  text_color VARCHAR NOT NULL DEFAULT '#FFFFFF',
  accent_color VARCHAR NOT NULL DEFAULT '#48A9C5',
  font_family VARCHAR NOT NULL DEFAULT 'Raleway, sans-serif',
  logo_url VARCHAR,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_activities (
  id INTEGER PRIMARY KEY,
  title VARCHAR NOT NULL,
  description VARCHAR,
  category VARCHAR NOT NULL DEFAULT 'Capacitación',
  activity_type VARCHAR NOT NULL DEFAULT 'quiz',
  theme_id INTEGER REFERENCES epivox_themes(id),
  created_by_user_id INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  default_time_limit INTEGER NOT NULL DEFAULT 30,
  default_points INTEGER NOT NULL DEFAULT 1000,
  speed_bonus_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  negative_points_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_questions (
  id INTEGER PRIMARY KEY,
  activity_id INTEGER NOT NULL REFERENCES epivox_activities(id),
  sort_order INTEGER NOT NULL DEFAULT 1,
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_sessions (
  id INTEGER PRIMARY KEY,
  pin VARCHAR NOT NULL UNIQUE,
  activity_id INTEGER NOT NULL REFERENCES epivox_activities(id),
  presenter_user_id INTEGER NOT NULL DEFAULT 1,
  status VARCHAR NOT NULL DEFAULT 'lobby',
  current_question_index INTEGER NOT NULL DEFAULT 0,
  current_step VARCHAR NOT NULL DEFAULT 'question',
  session_mode VARCHAR NOT NULL DEFAULT 'live',
  anonymous_mode BOOLEAN NOT NULL DEFAULT FALSE,
  max_participants INTEGER NOT NULL DEFAULT 500,
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_participants (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES epivox_sessions(id),
  nickname VARCHAR NOT NULL,
  avatar_seed VARCHAR NOT NULL DEFAULT 'default',
  email VARCHAR,
  department VARCHAR,
  team_name VARCHAR,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  socket_id VARCHAR,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_answers (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES epivox_sessions(id),
  question_id INTEGER NOT NULL REFERENCES epivox_questions(id),
  participant_id INTEGER NOT NULL REFERENCES epivox_participants(id),
  answer_payload VARCHAR NOT NULL,
  is_correct BOOLEAN,
  time_taken_ms INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS epivox_audience_questions (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES epivox_sessions(id),
  participant_id INTEGER NOT NULL REFERENCES epivox_participants(id),
  question_text VARCHAR NOT NULL,
  upvotes_count INTEGER NOT NULL DEFAULT 0,
  is_answered BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_epivox_sessions_pin ON epivox_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_epivox_participants_session ON epivox_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_epivox_answers_session_question ON epivox_answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_epivox_questions_activity ON epivox_questions(activity_id);
