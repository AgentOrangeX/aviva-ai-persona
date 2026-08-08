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

-- Anonymous usage events for the analytics dashboard (PER-003). No PII is
-- stored: visitor_id is a random id generated client-side and held in
-- localStorage, not tied to a real identity even when user_id is present.
-- attempt_id scopes one run through the quiz, letting us tell "started but
-- never came back" apart from "started a fresh attempt later".
CREATE TABLE IF NOT EXISTS quiz_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id     TEXT    NOT NULL,
  attempt_id     TEXT    NOT NULL,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  business_area  TEXT,                     -- snapshot at event time; NULL for anonymous users
  event_type     TEXT    NOT NULL,          -- 'start' | 'step' | 'complete'
  question_index INTEGER,                  -- for 'step': 0-based index of the question just answered
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quiz_events_attempt ON quiz_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_visitor ON quiz_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_quiz_events_type ON quiz_events(event_type);

-- Audit trail for admin actions (PER-004: "access is role controlled and
-- auditable"). Names are snapshotted at the time of the action so the log
-- stays readable even if an account is later renamed or removed.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  admin_name     TEXT    NOT NULL,
  action         TEXT    NOT NULL,   -- 'role_change' | 'delete_first_result'
  target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_name    TEXT,
  details_json   TEXT    NOT NULL DEFAULT '{}',
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_user_id);

-- Admin-managed learning content (PER-034). This is deliberately separate
-- from the hand-curated `journey` steps baked into lib/personas.js — those
-- stay as-is; resources here are additional, timely content the Learning
-- Team can push live without a code deploy, surfaced alongside the
-- existing journey once published.
CREATE TABLE IF NOT EXISTS learning_resources (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  description  TEXT,
  type         TEXT    NOT NULL,             -- 'document' | 'video' | 'link' | 'platform_url'
  url          TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Many-to-many: a resource can target more than one persona.
CREATE TABLE IF NOT EXISTS resource_personas (
  resource_id  INTEGER NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  persona_key  TEXT    NOT NULL,
  PRIMARY KEY (resource_id, persona_key)
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_status ON learning_resources(status);
CREATE INDEX IF NOT EXISTS idx_resource_personas_persona ON resource_personas(persona_key);
