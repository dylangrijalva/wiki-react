import { and, asc, eq, gte } from 'drizzle-orm'
import {
  lessonSchema,
  lessonSummaryListSchema,
  trackListSchema,
} from '@rendered/shared/contracts/catalog'
import type { Database } from '../../db/database'
import { lessonTable, trackTable } from '../../db/schema'
import { ApiError } from '../../http/errors'

const summary = {
  slug: lessonTable.slug,
  trackId: lessonTable.trackId,
  title: lessonTable.title,
  objective: lessonTable.objective,
  stepCount: lessonTable.stepCount,
}

function lessonNotFound() {
  return new ApiError(404, 'lesson_not_found', 'This lesson is unavailable.')
}

export async function listTracks(db: Database) {
  const rows = await db
    .select({ track: trackTable.content })
    .from(trackTable)
    .where(gte(trackTable.position, 0))
    .orderBy(asc(trackTable.position))
  return trackListSchema.parse(rows.map((row) => row.track))
}

export async function listLessons(db: Database) {
  const rows = await db
    .select(summary)
    .from(lessonTable)
    .where(gte(lessonTable.position, 0))
    .orderBy(asc(lessonTable.position))
  return lessonSummaryListSchema.parse(rows)
}

export async function getLesson(db: Database, slug: string) {
  const row = await db
    .select({ lesson: lessonTable.content })
    .from(lessonTable)
    .where(and(eq(lessonTable.slug, slug), gte(lessonTable.position, 0)))
    .get()
  if (!row) throw lessonNotFound()
  return lessonSchema.parse(row.lesson)
}

export async function getLessonStepCount(db: Database, slug: string) {
  const row = await db
    .select({ count: lessonTable.stepCount })
    .from(lessonTable)
    .where(and(eq(lessonTable.slug, slug), gte(lessonTable.position, 0)))
    .get()
  if (!row) throw lessonNotFound()
  return row.count
}

export async function searchLessons(db: Database, query: string) {
  const terms = query.toLowerCase().split(/\s+/)
  const lessons = await listLessons(db)
  return lessons.filter((lesson) => {
    const searchable = [lesson.slug, lesson.trackId, lesson.title, lesson.objective]
      .join(' ')
      .toLowerCase()
    return terms.every((term) => searchable.includes(term))
  })
}
