import { sql } from 'drizzle-orm'
import { expect, it, vi } from 'vitest'
import type { Lesson, LessonSummary } from '@rendered/shared/contracts/catalog'
import { lessons, tracks } from '@rendered/shared/content'
import { testApi } from './test-api'

const slug = 'how-react-renders'

it('serves the seeded catalog, full scenes, search and health', async () => {
  const { app } = await testApi()
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
  const { app, db } = await testApi()
  await db.run(sql`UPDATE tracks SET content = '{}' WHERE id = 'fundamentals'`)
  await db.run(sql`UPDATE lessons SET step_count = -1, content = '{}' WHERE slug = ${slug}`)
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
