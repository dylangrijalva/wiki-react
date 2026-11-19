ALTER TABLE guests RENAME TO learners;
--> statement-breakpoint
ALTER TABLE learners ADD COLUMN kind TEXT NOT NULL DEFAULT 'guest' CHECK (kind IN ('guest','account'));
--> statement-breakpoint
ALTER TABLE progress RENAME COLUMN guest_id TO learner_id;
--> statement-breakpoint
ALTER TABLE bookmarks RENAME COLUMN guest_id TO learner_id;
--> statement-breakpoint
CREATE TABLE accounts (
  id TEXT PRIMARY KEY NOT NULL REFERENCES learners(id),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE account_sessions (
  digest TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX account_sessions_expiry ON account_sessions(expires_at);
--> statement-breakpoint
CREATE TABLE auth_attempts (
  bucket TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX auth_attempts_expiry ON auth_attempts(expires_at);
