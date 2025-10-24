-- Users and auth
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  jwt_id     TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Habits / missions
CREATE TABLE IF NOT EXISTS habits (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS habit_entries (
  id          TEXT PRIMARY KEY,
  habit_id    TEXT NOT NULL,
  date        TEXT NOT NULL, -- ISO date (YYYY-MM-DD)
  completed   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(habit_id) REFERENCES habits(id),
  UNIQUE(habit_id, date)
);

-- Streaks are derived from habit_entries; optional cache table
CREATE TABLE IF NOT EXISTS streaks (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Tribes (groups)
CREATE TABLE IF NOT EXISTS tribes (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS tribe_members (
  tribe_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (tribe_id, user_id),
  FOREIGN KEY(tribe_id) REFERENCES tribes(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Kudos (likes)
CREATE TABLE IF NOT EXISTS kudos (
  id        TEXT PRIMARY KEY,
  to_user   TEXT NOT NULL,
  from_user TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(to_user) REFERENCES users(id),
  FOREIGN KEY(from_user) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_habit ON habit_entries(habit_id);
CREATE INDEX IF NOT EXISTS idx_kudos_to ON kudos(to_user);
