-- Aviva AI Persona — database schema

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  job_title     TEXT,
  business_area TEXT,
  role          TEXT    NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- A completed assessment. answers_json is the raw submission; the scored
-- output is denormalised into columns for fast admin aggregation.
CREATE TABLE IF NOT EXISTS results (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona       TEXT    NOT NULL,
  runner_up     TEXT    NOT NULL,
  rare          INTEGER NOT NULL DEFAULT 0,
  champ_score   INTEGER NOT NULL DEFAULT 0,
  dim_json      TEXT    NOT NULL,   -- {curiosity:.., influence:.., ...}
  answers_json  TEXT    NOT NULL,   -- [{questionId, optionIndex}, ...]
  achievements  TEXT    NOT NULL DEFAULT '[]',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_results_user ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_persona ON results(persona);
