import { Hono } from 'hono'
import type { Database } from '../../db/database'
import { privateResponse } from '../../http/private-response'
import { learnerSessions } from '../auth/sessions'
import { getLessonStepCount } from '../catalog/catalog.service'
import { parseLessonSlug } from '../catalog/lesson-slug'
import { listBookmarks, setBookmark } from './bookmarks.service'

export function bookmarksRouter(db: Database, secure: boolean) {
  const router = new Hono()
  const sessions = learnerSessions(db, secure)
  router.use('*', privateResponse)
  router.get('/', async (c) => {
    const learnerId = await sessions.owner(c, false)
    return c.json(await listBookmarks(db, learnerId))
  })
  router.on(['POST', 'DELETE'], '/:slug', async (c) => {
    const learnerId = await sessions.owner(c, false)
    const slug = parseLessonSlug(c.req.param('slug'))
    await getLessonStepCount(db, slug)
    return c.json(await setBookmark(db, learnerId, slug, c.req.method === 'POST'))
  })
  return router
}
