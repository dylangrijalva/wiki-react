import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, onTestFinished } from 'vitest'
import { lessons, tracks } from '@rendered/shared/content'
import { createApp } from '../src/app'
import { openDatabase } from '../src/db/database'

export async function testApi() {
  const directory = await mkdtemp(join(tmpdir(), 'rendered-api-'))
  const connect = () => openDatabase(join(directory, 'course.sqlite'), tracks, lessons)
  let store = await connect()
  let app = createApp(store.db)
  onTestFinished(async () => {
    store.close()
    await rm(directory, { recursive: true, force: true })
  })
  return {
    directory,
    get app() {
      return app
    },
    get db() {
      return store.db
    },
    async restart() {
      store.close()
      store = await connect()
      app = createApp(store.db)
    },
  }
}

export async function startGuest(app: ReturnType<typeof createApp>) {
  const response = await app.request('/api/progress')
  expect(response.status).toBe(200)
  const cookie = response.headers.get('set-cookie')
  expect(cookie).toMatch(/HttpOnly/i)
  expect(cookie).toMatch(/SameSite=Lax/i)
  return cookie!.split(';')[0]
}
