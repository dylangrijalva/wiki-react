import { Hono } from 'hono'
import { validator } from 'hono/validator'
import { searchQuerySchema } from '@rendered/shared/contracts/catalog'
import type { Database } from '../../db/database'
import { ApiError } from '../../http/errors'
import { getLesson, listLessons, listTracks, searchLessons } from './catalog.service'
import { parseLessonSlug } from './lesson-slug'

export function catalogRouter(db: Database) {
  const router = new Hono()
  router.get('/tracks', async (c) => c.json(await listTracks(db)))
  router.get('/lessons', async (c) => c.json(await listLessons(db)))
  router.get(
    '/lessons/:slug',
    validator('param', ({ slug }) => parseLessonSlug(slug)),
    async (c) => c.json(await getLesson(db, c.req.valid('param'))),
  )
  router.get(
    '/search',
    validator('query', ({ q }) => {
      const query = searchQuerySchema.safeParse((Array.isArray(q) ? q[0] : q) ?? '')
      if (!query.success)
        throw new ApiError(400, 'invalid_query', 'Search accepts up to 160 characters.')
      return query.data
    }),
    async (c) => c.json(await searchLessons(db, c.req.valid('query'))),
  )
  return router
}
