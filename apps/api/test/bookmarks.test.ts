import { expect, it } from 'vitest'
import { startGuest, testApi } from './test-api'

const slug = 'how-react-renders'

it('scopes idempotent bookmarks to a guest and rejects unknown lessons', async () => {
  const { app } = await testApi()
  const first = await startGuest(app)
  const second = await startGuest(app)
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
    expect((await app.request(path, { method: 'DELETE', headers: { cookie: first } })).status).toBe(
      200,
    )
  expect(
    await (await app.request('/api/bookmarks', { headers: { cookie: first } })).json(),
  ).toEqual([])
})
