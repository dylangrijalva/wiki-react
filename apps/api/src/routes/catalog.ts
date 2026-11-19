import { and, asc, eq, gte } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { lessonSchema, lessonSummaryListSchema, trackListSchema } from '@rendered/shared'
import type { Database } from '../db/database'
import { lessonTable, trackTable } from '../db/schema'
import { ApiError, lessonNotFound, parseSlug } from './errors'

const summary = {
  slug: lessonTable.slug,
  trackId: lessonTable.trackId,
  title: lessonTable.title,
  objective: lessonTable.objective,
  stepCount: lessonTable.stepCount,
}

export function catalogRoutes(db: Database) {
  const app = new Hono()
  async function listLessons() {
    const rows = await db
      .select(summary)
      .from(lessonTable)
      .where(gte(lessonTable.position, 0))
      .orderBy(asc(lessonTable.position))
    return lessonSummaryListSchema.parse(rows)
  }

  app.get('/tracks', async (c) => {
    const rows = await db
      .select({ track: trackTable.content })
      .from(trackTable)
      .where(gte(trackTable.position, 0))
      .orderBy(asc(trackTable.position))
    return c.json(trackListSchema.parse(rows.map((row) => row.track)))
  })

  app.get('/lessons', async (c) => c.json(await listLessons()))
  app.get('/lessons/:slug', async (c) => {
    const slug = parseSlug(c.req.param('slug'))
    const row = await db
      .select({ lesson: lessonTable.content })
      .from(lessonTable)
      .where(and(eq(lessonTable.slug, slug), gte(lessonTable.position, 0)))
      .get()
    if (!row) throw lessonNotFound()
    return c.json(lessonSchema.parse(row.lesson))
  })
  app.get('/search', async (c) => {
    const query = z
      .string()
      .trim()
      .max(160)
      .safeParse(c.req.query('q') ?? '')
    if (!query.success)
      throw new ApiError(400, 'invalid_query', 'Search accepts up to 160 characters.')
    const terms = query.data.toLowerCase().split(/\s+/)
    const rows = await listLessons()
    return c.json(
      rows.filter((row) => {
        const searchable = [row.slug, row.trackId, row.title, row.objective].join(' ').toLowerCase()
        return terms.every((term) => searchable.includes(term))
      }),
    )
  })
  return app
}
