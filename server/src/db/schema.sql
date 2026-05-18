CREATE TABLE IF NOT EXISTS subscriptions (
  id          TEXT PRIMARY KEY,
  url         TEXT NOT NULL,
  secret      TEXT,
  event_types TEXT NOT NULL DEFAULT '["*"]',
  created_at  INTEGER NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL,
  ingested_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_attempts (
  id               TEXT PRIMARY KEY,
  event_id         TEXT NOT NULL REFERENCES events(id),
  subscription_id  TEXT NOT NULL REFERENCES subscriptions(id),
  status           TEXT NOT NULL DEFAULT 'pending',
  attempt_number   INTEGER NOT NULL DEFAULT 0,
  max_attempts     INTEGER NOT NULL DEFAULT 5,
  next_attempt_at  INTEGER NOT NULL,
  claimed_at       INTEGER,
  last_status_code INTEGER,
  last_error       TEXT,
  delivered_at     INTEGER,
  created_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attempts_queue
  ON delivery_attempts(status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_active
  ON subscriptions(active);
