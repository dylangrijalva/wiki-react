import { serveStatic } from '@hono/node-server/serve-static'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Database } from './db/database'
import { authRouter } from './features/auth/auth.router'
import { bookmarksRouter } from './features/bookmarks/bookmarks.router'
import { catalogRouter } from './features/catalog/catalog.router'
import { progressRouter } from './features/progress/progress.router'
import { apiErrorHandler } from './http/errors'
import { sameOriginWrites } from './http/origin'
import { privateResponse } from './http/private-response'

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
  app.route('/api/auth', authRouter(db, secure, trustedProxyIp))
  app.get('/api/health', async (c) => {
    await db.get(sql`SELECT 1`)
    return c.json({ status: 'ok' })
  })
  app.route('/api', catalogRouter(db))
  app.route('/api/progress', progressRouter(db, secure))
  app.route('/api/bookmarks', bookmarksRouter(db, secure))
  app.all('/api/*', privateResponse, (c) =>
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
  app.onError(apiErrorHandler)
  return app
}
