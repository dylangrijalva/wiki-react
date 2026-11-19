import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { progressUpdateSchema } from '@rendered/shared/contracts/progress'
import type { Database } from '../../db/database'
import { ApiError } from '../../http/errors'
import { privateResponse } from '../../http/private-response'
import { learnerSessions } from '../auth/sessions'
import { getLessonStepCount } from '../catalog/catalog.service'
import { parseLessonSlug } from '../catalog/lesson-slug'
import { listProgress, saveProgress } from './progress.service'

export function progressRouter(db: Database, secure: boolean) {
  const router = new Hono()
  const sessions = learnerSessions(db, secure)
  router.use('*', privateResponse)
  router.get('/', async (c) => {
    const learnerId = await sessions.owner(c, true)
    return c.json(await listProgress(db, learnerId))
  })
  router.put(
    '/:slug',
    bodyLimit({
      maxSize: 2048,
      onError: () => {
        throw new ApiError(413, 'body_too_large', 'The progress update exceeds 2 KB.')
      },
    }),
    async (c) => {
      const learnerId = await sessions.owner(c, false)
      const slug = parseLessonSlug(c.req.param('slug'))
      const stepCount = await getLessonStepCount(db, slug)
      const update = progressUpdateSchema.safeParse(await c.req.json<unknown>().catch(() => null))
      if (!update.success || update.data.step >= stepCount) {
        throw new ApiError(
          400,
          'invalid_progress',
          'Choose a step in this lesson and a boolean completion flag.',
        )
      }
      return c.json(await saveProgress(db, learnerId, slug, update.data))
    },
  )
  return router
}
