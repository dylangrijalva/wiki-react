import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { createApp } from '../src/app'
import { testApi } from './test-api'

it('serves browser routes on reload while missing API and asset requests stay 404', async () => {
  const { directory, db } = await testApi()
  const webRoot = join(directory, 'web')
  await mkdir(webRoot)
  await writeFile(join(webRoot, 'index.html'), '<title>React, Rendered</title>')
  const app = createApp(db, { webRoot })
  const headers = { accept: 'text/html' }
  expect(await (await app.request('/lessons/how-react-renders', { headers })).text()).toContain(
    'React, Rendered',
  )
  expect((await app.request('/assets/missing.js', { headers })).status).toBe(404)
  expect((await app.request('/api/unknown', { headers })).status).toBe(404)
})
