import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
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

export const guests = sqliteTable('guests', {
  id: text('id').primaryKey(),
})

export const progress = sqliteTable(
  'progress',
  {
    guestId: text('guest_id')
      .notNull()
      .references(() => guests.id),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonTable.slug),
    step: integer('step').notNull(),
    completed: integer('completed', { mode: 'boolean' }).notNull(),
    visitedSteps: text('visited_steps', { mode: 'json' }).$type<number[]>().notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [primaryKey({ columns: [table.guestId, table.lessonId] })],
)

export const bookmarks = sqliteTable(
  'bookmarks',
  {
    guestId: text('guest_id')
      .notNull()
      .references(() => guests.id),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessonTable.slug),
  },
  (table) => [primaryKey({ columns: [table.guestId, table.lessonId] })],
)
