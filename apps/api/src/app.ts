import { serveStatic } from '@hono/node-server/serve-static'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Database } from './db/database'
import { catalogRoutes } from './routes/catalog'
import { ApiError } from './routes/errors'
import { authRoutes } from './routes/auth'
import { sameOriginWrites } from './auth/origin'
import { learnerRoutes } from './routes/learner'

export function createApp(
  db: Database,
  {
    secure = false,
    webRoot,
    publicOrigin,
    trustedProxyIp,
  }: { secure?: boolean; webRoot?: string; publicOrigin?: string; trustedProxyIp?: string } = {},
) {
  const app = new Hono()
  app.use('/api/*', sameOriginWrites(secure, publicOrigin))
  app.route('/api/auth', authRoutes(db, secure, trustedProxyIp))
  app.get('/api/health', async (c) => {
    await db.get(sql`SELECT 1`)
    return c.json({ status: 'ok' })
  })
  app.route('/api', catalogRoutes(db))
  app.route('/api', learnerRoutes(db, secure))
  app.all('/api/*', (c) =>
    c.json({ error: { code: 'not_found', message: 'Unknown API endpoint.' } }, 404),
  )

  if (webRoot) {
    app.use('*', serveStatic({ root: webRoot }))
    const shell = serveStatic({ root: webRoot, path: 'index.html' })
    app.get('*', async (c, next) => {
      if (!c.req.header('accept')?.includes('text/html') || c.req.path.startsWith('/assets/'))
        return next()
      return shell(c, next)
    })
  }
  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json({ error: { code: error.code, message: error.message } }, error.status)
    }
    console.error(error)
    return c.json(
      { error: { code: 'internal_error', message: 'The server could not finish this request.' } },
      500,
    )
  })
  return app
}
