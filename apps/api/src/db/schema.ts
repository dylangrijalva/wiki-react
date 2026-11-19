import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Lesson, Track } from '@rendered/shared'

export const trackTable = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  position: integer('position').notNull(),
  content: text('content', { mode: 'json' }).$type<Track>().notNull(),
})

export const lessonTable = sqliteTable('lessons', {
  slug: text('slug').primaryKey(),
  trackId: text('track_id')
    .notNull()
    .references(() => trackTable.id),
  title: text('title').notNull(),
  objective: text('objective').notNull(),
  stepCount: integer('step_count').notNull(),
  position: integer('position').notNull(),
  content: text('content', { mode: 'json' }).$type<Lesson>().notNull(),
})

export const learners = sqliteTable('learners', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['guest', 'account'] })
    .notNull()
    .default('guest'),
})

export const accounts = sqliteTable('accounts', {
  id: text('id')
    .primaryKey()
    .references(() => learners.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
})

export const accountSessions = sqliteTable(
  'account_sessions',
  {
    digest: text('digest').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('account_sessions_expiry').on(table.expiresAt)],
)

export const authAttempts = sqliteTable(
  'auth_attempts',
  {
    bucket: text('bucket').primaryKey(),
    attempts: integer('attempts').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('auth_attempts_expiry').on(table.expiresAt)],
)

export const progress = sqliteTable(
  'progress',
  {
    learnerId: text('learner_id')
      .notNull()
      .references(() => learners.id),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonTable.slug),
    step: integer('step').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull(),
    visitedSteps: text('visited_steps', { mode: 'json' }).$type<number[]>().notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.learnerId, table.lessonId] })],
)

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    learnerId: text('learner_id')
      .notNull()
      .references(() => learners.id),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonTable.slug),
  },
  (table) => [primaryKey({ columns: [table.learnerId, table.lessonId] })],
)
