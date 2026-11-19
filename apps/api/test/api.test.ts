import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sql } from 'drizzle-orm'
import type { Lesson, LessonSummary, Progress } from '@rendered/shared'
import { tracks, lessons } from '@rendered/shared/content'
import { createApp } from '../src/app'
import { openDatabase } from '../src/db/database'

let directory: string
let store: Awaited<ReturnType<typeof openDatabase>>
let app: ReturnType<typeof createApp>
const slug = 'how-react-renders'

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'rendered-api-'))
  store = await openDatabase(join(directory, 'course.sqlite'), tracks, lessons)
  app = createApp(store.db)
})
afterEach(async () => {
  store.close()
  await rm(directory, { recursive: true, force: true })
})

async function startGuest() {
  const response = await app.request('/api/progress')
  expect(response.status).toBe(200)
  const cookie = response.headers.get('set-cookie')
  expect(cookie).toMatch(/HttpOnly/i)
  expect(cookie).toMatch(/SameSite=Lax/i)
  return cookie!.split(';')[0]
}

function update(cookie: string, step: number, completed?: boolean) {
  return app.request('/api/progress/' + slug, {
    method: 'PUT',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, completed }),
  })
}

describe('course catalog', () => {
  it('serves the seeded catalog, full scenes, search and health', async () => {
    expect(await (await app.request('/api/health')).json()).toEqual({ status: 'ok' })
    expect(await (await app.request('/api/tracks')).json()).toEqual(tracks)
    const catalog = (await (await app.request('/api/lessons')).json()) as LessonSummary[]
    expect(catalog).toHaveLength(lessons.length)
    const lesson = (await (await app.request('/api/lessons/' + slug)).json()) as Lesson
    expect(lesson.steps.length).toBeGreaterThanOrEqual(5)
    expect(catalog.find((item) => item.slug === slug)?.stepCount).toBe(lesson.steps.length)
    const results = (await (
      await app.request('/api/search?q=react%20renders')
    ).json()) as LessonSummary[]
    expect(results.map((item) => item.slug)).toContain(slug)
    expect((await app.request('/api/search?q=' + 'r'.repeat(161))).status).toBe(400)
    expect((await app.request('/api/lessons/Missing!')).status).toBe(400)
    expect((await app.request('/api/lessons/unpublished')).status).toBe(404)
  })

  it('returns the API error envelope if SQLite contains an invalid catalog record', async () => {
    await store.db.run(sql`UPDATE tracks SET content = '{}' WHERE id = 'fundamentals'`)
    await store.db.run(sql`UPDATE lessons SET step_count = -1, content = '{}' WHERE slug = ${slug}`)
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const path of [
        '/api/tracks',
        '/api/lessons',
        '/api/search?q=renders',
        '/api/lessons/' + slug,
      ]) {
        const response = await app.request(path)
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
          error: { code: 'internal_error', message: 'The server could not finish this request.' },
        })
      }
    } finally {
      log.mockRestore()
    }
  })

  it('serves browser routes on reload while missing API and asset requests stay 404', async () => {
    const webRoot = join(directory, 'web')
    await mkdir(webRoot)
    await writeFile(join(webRoot, 'index.html'), '<title>React, Rendered</title>')
    app = createApp(store.db, { webRoot })
    const headers = { accept: 'text/html' }
    expect(await (await app.request('/lessons/' + slug, { headers })).text()).toContain(
      'React, Rendered',
    )
    expect((await app.request('/assets/missing.js', { headers })).status).toBe(404)
    expect((await app.request('/api/unknown', { headers })).status).toBe(404)
  })
})

describe('anonymous learning records', () => {
  it('retains distinct visited steps and completion across concurrent saves and a database restart', async () => {
    const cookie = await startGuest()
    const pending = [
      update(cookie, 1),
      update(cookie, 3, true),
      update(cookie, 1),
      update(cookie, 0, false),
    ]
    const responses = await Promise.all(pending)
    expect(responses.map((res) => res.status)).toEqual([200, 200, 200, 200])
    await update(cookie, 2)
    store.close()
    store = await openDatabase(join(directory, 'course.sqlite'), tracks, lessons)
    app = createApp(store.db)
    const response = await app.request('/api/progress', { headers: { cookie } })
    expect(response.headers.get('cache-control')).toContain('no-store')
    const records = (await response.json()) as Progress[]
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      lessonId: slug,
      step: 2,
      completed: true,
      visitedSteps: [0, 1, 2, 3],
    })
    expect(Number.isFinite(Date.parse(records[0].updatedAt))).toBe(true)
  })

  it('rejects invalid stored step history on a read and on a save', async () => {
    const cookie = await startGuest()
    expect((await update(cookie, 0)).status).toBe(200)
    await store.db.run(
      sql`UPDATE progress SET visited_steps = '[0, "broken"]', updated_at = '2020-01-01T00:00:00.000Z' WHERE lesson_id = ${slug}`,
    )
    const storedRecord = () =>
      store.db.get(
        sql`SELECT step, completed, visited_steps, updated_at FROM progress WHERE lesson_id = ${slug}`,
      )
    const before = await storedRecord()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const read = await app.request('/api/progress', { headers: { cookie } })
      const save = await update(cookie, 1, true)
      for (const response of [read, save]) {
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
          error: { code: 'internal_error', message: 'The server could not finish this request.' },
        })
      }
      expect(await storedRecord()).toEqual(before)
    } finally {
      log.mockRestore()
    }
  })

  it('can restore a missing resume step when the previous visit array is valid', async () => {
    const cookie = await startGuest()
    await update(cookie, 0)
    await store.db.run(sql`UPDATE progress SET visited_steps = '[2]' WHERE lesson_id = ${slug}`)
    const response = await update(cookie, 0, true)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ step: 0, completed: true, visitedSteps: [0, 2] })
  })

  it('scopes idempotent bookmarks to a guest and rejects unknown lessons', async () => {
    const first = await startGuest()
    const second = await startGuest()
    const path = '/api/bookmarks/' + slug
    for (let i = 0; i < 2; i++)
      expect((await app.request(path, { method: 'POST', headers: { cookie: first } })).status).toBe(
        200,
      )
    expect(
      await (await app.request('/api/bookmarks', { headers: { cookie: first } })).json(),
    ).toEqual([slug])
    expect(
      await (await app.request('/api/bookmarks', { headers: { cookie: second } })).json(),
    ).toEqual([])
    expect(
      (await app.request('/api/bookmarks/missing', { method: 'POST', headers: { cookie: first } }))
        .status,
    ).toBe(404)
    for (let i = 0; i < 2; i++)
      expect(
        (await app.request(path, { method: 'DELETE', headers: { cookie: first } })).status,
      ).toBe(200)
    expect(
      await (await app.request('/api/bookmarks', { headers: { cookie: first } })).json(),
    ).toEqual([])
  })

  it('rejects stale credentials, invalid steps, malformed bodies and oversized writes', async () => {
    expect((await update('rr_guest=invalid', 0)).status).toBe(401)
    const cookie = await startGuest()
    expect((await update(cookie, -1)).status).toBe(400)
    expect((await update(cookie, 100)).status).toBe(400)
    for (const [body, status] of [
      ['{', 400],
      ['A'.repeat(2049), 413],
    ] as const) {
      const response = await app.request('/api/progress/' + slug, {
        method: 'PUT',
        headers: { cookie },
        body,
      })
      expect(response.status).toBe(status)
      expect(await response.json()).toMatchObject({
        error: { code: expect.any(String), message: expect.any(String) },
      })
    }
    expect(await (await app.request('/api/progress', { headers: { cookie } })).json()).toEqual([])
  })

  it('issues only host-scoped secure cookies in production', async () => {
    app = createApp(store.db, { secure: true })
    const response = await app.request('https://learn.example/api/progress')
    const cookie = response.headers.get('set-cookie')
    expect(cookie).toMatch(/^__Host-rr_guest=/)
    expect(cookie).toMatch(/; Secure/i)
    expect(cookie).not.toMatch(/Domain=/i)
    expect((await app.request('/api/tracks')).headers.has('set-cookie')).toBe(false)
  })
})
