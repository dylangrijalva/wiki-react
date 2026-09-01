import { and, desc, eq, gte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import type { Progress } from '@rendered/shared'
import type { Database } from '../db/database'
import { bookmarks, lessonTable, progress } from '../db/schema'
import { ApiError, lessonNotFound, parseSlug } from './errors'
import { guestSession } from './guest'

const progressInput = z.strictObject({
  step: z.number().int().nonnegative(),
  completed: z.boolean().optional(),
})
const progressFields = {
  lessonId: progress.lessonId,
  step: progress.step,
  visitedSteps: progress.visitedSteps,
  completed: progress.completed,
  updatedAt: progress.updatedAt,
}

export function learnerRoutes(db: Database, secure: boolean) {
  const app = new Hono()
  const guest = guestSession(db, secure)
  async function stepCount(id: string) {
    const row = await db
      .select({ count: lessonTable.stepCount })
      .from(lessonTable)
      .where(and(eq(lessonTable.slug, id), gte(lessonTable.position, 0)))
      .get()
    if (!row) throw lessonNotFound()
    return row.count
  }
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'private, no-store')
    c.header('Vary', 'Cookie')
    await next()
  })
  app.get('/progress', async (c) => {
    const id = await guest.initialize(c)
    const rows: Progress[] = await db
      .select(progressFields)
      .from(progress)
      .innerJoin(lessonTable, eq(progress.lessonId, lessonTable.slug))
      .where(and(eq(progress.guestId, id), gte(lessonTable.position, 0)))
      .orderBy(desc(progress.updatedAt))
    return c.json(rows)
  })

  app.put(
    '/progress/:slug',
    bodyLimit({
      maxSize: 2048,
      onError: () => {
        throw new ApiError(413, 'body_too_large', 'The progress update exceeds 2 KB.')
      },
    }),
    async (c) => {
      const id = await guest.require(c)
      const slug = parseSlug(c.req.param('slug'))
      const count = await stepCount(slug)
      const parsed = progressInput.safeParse(await c.req.json<unknown>().catch(() => null))
      if (!parsed.success || parsed.data.step >= count) {
        throw new ApiError(
          400,
          'invalid_progress',
          'Choose a step in this lesson and a boolean completion flag.',
        )
      }
      const { step, completed = false } = parsed.data
      const updatedAt = new Date().toISOString()
      // Merge at write time so concurrent requests retain every visit and a completed lesson stays complete.
      const result = await db
        .insert(progress)
        .values({ guestId: id, lessonId: slug, step, completed, visitedSteps: [step], updatedAt })
        .onConflictDoUpdate({
          target: [progress.guestId, progress.lessonId],
          set: {
            step,
            updatedAt,
            completed: sql`${progress.completed} OR excluded.completed`,
            visitedSteps: sql`(SELECT json_group_array(value) FROM (SELECT value FROM json_each(${progress.visitedSteps}) UNION SELECT excluded.step AS value ORDER BY value))`,
          },
        })
        .returning(progressFields)
        .get()
      return c.json(result)
    },
  )

  app.get('/bookmarks', async (c) => {
    const id = await guest.require(c)
    const rows = await db
      .select({ lessonId: bookmarks.lessonId })
      .from(bookmarks)
      .innerJoin(lessonTable, eq(lessonTable.slug, bookmarks.lessonId))
      .where(and(eq(bookmarks.guestId, id), gte(lessonTable.position, 0)))
      .orderBy(lessonTable.position)
    return c.json(rows.map((row) => row.lessonId))
  })
  app.on(['POST', 'DELETE'], '/bookmarks/:slug', async (c) => {
    const id = await guest.require(c)
    const slug = parseSlug(c.req.param('slug'))
    await stepCount(slug)
    const bookmarked = c.req.method === 'POST'
    if (bookmarked) {
      await db.insert(bookmarks).values({ guestId: id, lessonId: slug }).onConflictDoNothing()
    } else {
      await db.delete(bookmarks).where(and(eq(bookmarks.guestId, id), eq(bookmarks.lessonId, slug)))
    }
    return c.json({ lessonId: slug, bookmarked })
  })
  return app
}
