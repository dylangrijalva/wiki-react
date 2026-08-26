CREATE TABLE tracks (
  id TEXT PRIMARY KEY NOT NULL,
  position INTEGER NOT NULL,
  content TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE lessons (
  slug TEXT PRIMARY KEY NOT NULL,
  track_id TEXT NOT NULL REFERENCES tracks(id),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  step_count INTEGER NOT NULL,
  position INTEGER NOT NULL,
  content TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE guests (id TEXT PRIMARY KEY NOT NULL);
--> statement-breakpoint
CREATE TABLE progress (
  guest_id TEXT NOT NULL REFERENCES guests(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(slug),
  step INTEGER NOT NULL CHECK (step >= 0),
  completed INTEGER NOT NULL CHECK (completed IN (0, 1)),
  visited_steps TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (guest_id, lesson_id)
);
--> statement-breakpoint
CREATE TABLE bookmarks (
  guest_id TEXT NOT NULL REFERENCES guests(id),
  lesson_id TEXT NOT NULL REFERENCES lessons(slug),
  PRIMARY KEY (guest_id, lesson_id)
);
