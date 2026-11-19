import { sql } from 'drizzle-orm'
import { expect, it, vi } from 'vitest'
import type { Progress } from '@rendered/shared/contracts/progress'
import { createApp } from '../src/app'
import { startGuest, testApi } from './test-api'

const slug = 'how-react-renders'

function update(
  app: ReturnType<typeof createApp>,
  cookie: string,
  step: number,
  completed?: boolean,
) {
  return app.request('/api/progress/' + slug, {
    method: 'PUT',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, completed }),
  })
}

it('retains distinct visited steps and completion across concurrent saves and a database restart', async () => {
  const api = await testApi()
  const cookie = await startGuest(api.app)
  const pending = [
    update(api.app, cookie, 1),
    update(api.app, cookie, 3, true),
    update(api.app, cookie, 1),
    update(api.app, cookie, 0, false),
  ]
  const responses = await Promise.all(pending)
  expect(responses.map((res) => res.status)).toEqual([200, 200, 200, 200])
  await update(api.app, cookie, 2)
  await api.restart()
  const response = await api.app.request('/api/progress', { headers: { cookie } })
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
  const { app, db } = await testApi()
  const cookie = await startGuest(app)
  expect((await update(app, cookie, 0)).status).toBe(200)
  await db.run(
    sql`UPDATE progress SET visited_steps = '[0, "broken"]', updated_at = '2020-01-01T00:00:00.000Z' WHERE lesson_id = ${slug}`,
  )
  const storedRecord = () =>
    db.get(
      sql`SELECT step, completed, visited_steps, updated_at FROM progress WHERE lesson_id = ${slug}`,
    )
  const before = await storedRecord()
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const read = await app.request('/api/progress', { headers: { cookie } })
    const save = await update(app, cookie, 1, true)
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
  const { app, db } = await testApi()
  const cookie = await startGuest(app)
  await update(app, cookie, 0)
  await db.run(sql`UPDATE progress SET visited_steps = '[2]' WHERE lesson_id = ${slug}`)
  const response = await update(app, cookie, 0, true)
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ step: 0, completed: true, visitedSteps: [0, 2] })
})

it('rejects stale credentials, invalid steps, malformed bodies and oversized writes', async () => {
  const { app } = await testApi()
  expect((await update(app, 'rr_guest=invalid', 0)).status).toBe(401)
  const cookie = await startGuest(app)
  expect((await update(app, cookie, -1)).status).toBe(400)
  expect((await update(app, cookie, 100)).status).toBe(400)
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
  const { db } = await testApi()
  const app = createApp(db, { secure: true })
  const response = await app.request('https://learn.example/api/progress')
  const cookie = response.headers.get('set-cookie')
  expect(cookie).toMatch(/^__Host-rr_guest=/)
  expect(cookie).toMatch(/; Secure/i)
  expect(cookie).not.toMatch(/Domain=/i)
  expect((await app.request('/api/tracks')).headers.has('set-cookie')).toBe(false)
})
