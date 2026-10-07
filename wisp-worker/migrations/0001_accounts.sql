CREATE TABLE IF NOT EXISTS browser_vaults (
  user_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL CHECK(length(payload) <= 1500000),
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
