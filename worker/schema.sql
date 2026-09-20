-- Anemone optional accounts / leaderboards: Cloudflare D1 (SQLite) schema.
-- Nothing personal is ever needed to use Anemone; this database only exists for people who choose an account.
-- Stored: username, a hash of a key derived ON THE DEVICE from username+password (the password never arrives),
-- a hash of a recovery key, optional profile fields (private by default) and summary numbers.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  username_norm TEXT NOT NULL UNIQUE,          -- lower-cased, accent-folded, used for uniqueness
  key_hash TEXT NOT NULL UNIQUE,               -- sha256 of the client-derived key
  recovery_hash TEXT NOT NULL,                 -- sha256 of the client-derived recovery key
  created INTEGER NOT NULL,
  optin INTEGER NOT NULL DEFAULT 0,            -- 1 = appears on public leaderboards and has a public profile
  banned INTEGER NOT NULL DEFAULT 0,
  flags INTEGER NOT NULL DEFAULT 0             -- number of clamped (implausible) syncs
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT, last_name TEXT, job TEXT, education TEXT, age_range TEXT, country TEXT, city TEXT, about TEXT,
  vis TEXT NOT NULL DEFAULT '{}',              -- JSON {field: true|false}; every field defaults to private
  updated INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1,
  answers INTEGER NOT NULL DEFAULT 0, right INTEGER NOT NULL DEFAULT 0,
  study_sec INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0,
  lessons_done INTEGER NOT NULL DEFAULT 0, badges INTEGER NOT NULL DEFAULT 0,
  updated INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_stats (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0, answers INTEGER NOT NULL DEFAULT 0, right INTEGER NOT NULL DEFAULT 0, study_sec INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, course)
);

CREATE TABLE IF NOT EXISTS weekly (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week TEXT NOT NULL,                          -- ISO week, e.g. 2026-W38
  xp INTEGER NOT NULL DEFAULT 0, study_sec INTEGER NOT NULL DEFAULT 0, answers INTEGER NOT NULL DEFAULT 0, right INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, week)
);

CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  blob TEXT NOT NULL,                          -- the user's own save file (opaque to the server), <= 380 KB
  updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER, kind TEXT NOT NULL, target TEXT NOT NULL, reason TEXT, created INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'          -- open | dismissed | actioned
);

CREATE TABLE IF NOT EXISTS throttle (
  bucket TEXT NOT NULL, window INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window)
);

CREATE INDEX IF NOT EXISTS idx_stats_xp ON stats(xp DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_week_xp ON weekly(week, xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_optin ON users(optin, banned);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created);
