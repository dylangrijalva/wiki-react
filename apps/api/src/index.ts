import { existsSync } from 'node:fs'
import { serve } from '@hono/node-server'
import { z } from 'zod'
import { lessons, tracks } from '@rendered/shared/content'
import { createApp } from './app'
import { openDatabase } from './db/database'
import { paths } from './paths'

const port = z.coerce
  .number()
  .int()
  .min(1)
  .max(65535)
  .parse(process.env.PORT ?? 3001)
const production = process.env.NODE_ENV === 'production'
if (production && !existsSync(paths.web + 'index.html')) {
  throw new Error(
    'The frontend build is missing. Run pnpm build before starting the production server.',
  )
}
const store = await openDatabase(process.env.DATABASE_PATH ?? paths.database, tracks, lessons)
const app = createApp(store.db, {
  secure: production,
  webRoot: existsSync(paths.web) ? paths.web : undefined,
})
const server = serve(
  { fetch: app.fetch, port, hostname: process.env.HOST ?? '127.0.0.1' },
  ({ address, port }) => {
    console.info(`React, Rendered listening on ${address}:${port}`)
  },
)
server.on('close', store.close)
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => server.close())
