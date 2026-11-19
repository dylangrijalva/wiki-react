import { createHash, randomBytes } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lessons, tracks } from '@rendered/shared/content'
import { createApp } from '../src/app'
import { openDatabase } from '../src/db/database'
import { authAttempts } from '../src/db/schema'
import { paths } from '../src/paths'

const origin = 'https://learn.example'
const account = { email: 'nami@strawhatpirates.example.com', password: 'A chart for each island' }
const signedIn = { user: { email: account.email } }
const guestSession = { user: null }
const firstLesson = 'how-react-renders'
const secondLesson = 'effect-lifecycle'
let directory: string
let store: Awaited<ReturnType<typeof openDatabase>>
let app: ReturnType<typeof createApp>

async function openApp() {
  store = await openDatabase(join(directory, 'course.sqlite'), tracks, lessons)
  app = createApp(store.db)
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'rendered-auth-'))
  await openApp()
})

afterEach(async () => {
  vi.useRealTimers()
  store.close()
  await rm(directory, { recursive: true, force: true })
})

function request(path: string, method = 'GET', cookie = '', body?: unknown, site = origin) {
  const headers = new Headers({ origin: site })
  if (cookie) headers.set('Cookie', cookie)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  return app.request(origin + '/api' + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function issuedCookie(response: Response, name: string) {
  const header = response.headers.getSetCookie().find((value) => value.startsWith(name + '='))
  if (!header) throw new Error(`Missing Set-Cookie for ${name}`)
  return header.split(';')[0]
}

async function register(cookie = '') {
  const response = await request('/auth/register', 'POST', cookie, {
    ...account,
    email: '  ' + account.email.toUpperCase() + '  ',
  })
  expect(response.status).toBe(201)
  expect(await response.json()).toEqual(signedIn)
  return issuedCookie(response, 'rr_session')
}

async function startGuest() {
  const response = await request('/progress')
  expect(await response.json()).toEqual([])
  return issuedCookie(response, 'rr_guest')
}

async function study(cookie: string, slug: string) {
  const progress = await request('/progress/' + slug, 'PUT', cookie, { step: 2, completed: true })
  expect(progress.status).toBe(200)
  const bookmark = await request('/bookmarks/' + slug, 'POST', cookie)
  expect(bookmark.status).toBe(200)
}

async function expectLibrary(cookie: string, slug: string) {
  const progress = await request('/progress', 'GET', cookie)
  expect(await progress.json()).toEqual([
    expect.objectContaining({ lessonId: slug, step: 2, completed: true, visitedSteps: [2] }),
  ])
  const bookmarks = await request('/bookmarks', 'GET', cookie)
  expect(await bookmarks.json()).toEqual([slug])
}

describe('learner accounts', () => {
  it('transfers the current guest library on registration and retires the guest credential', async () => {
    const guest = await startGuest()
    expect(await (await request('/auth/session', 'GET', guest)).json()).toEqual(guestSession)
    await study(guest, firstLesson)
    const session = await register(guest)
    await expectLibrary(session, firstLesson)

    const previousGuest = await request('/bookmarks', 'GET', guest)
    expect(previousGuest.status).toBe(401)
    expect(await (await request('/progress', 'GET', guest)).json()).toEqual([])
  })

  it('upgrades a course database from the guest-only release without losing its learner history', async () => {
    const legacyMigrations = join(directory, 'guest-migrations')
    await mkdir(join(legacyMigrations, 'meta'), { recursive: true })
    const journalFile = join('meta', '_journal.json')
    const journal = JSON.parse(await readFile(join(paths.migrations, journalFile), 'utf8'))
    journal.entries = journal.entries.filter(
      (entry: { tag: string }) => entry.tag === '0000_course',
    )
    expect(journal.entries).toHaveLength(1)
    await writeFile(join(legacyMigrations, journalFile), JSON.stringify(journal))
    await copyFile(
      join(paths.migrations, '0000_course.sql'),
      join(legacyMigrations, '0000_course.sql'),
    )

    const legacyPath = join(directory, 'guest-course.sqlite')
    const client = createClient({ url: pathToFileURL(legacyPath).href })
    const token = randomBytes(32).toString('base64url')
    const guestId = createHash('sha256').update(token).digest('hex')
    try {
      await migrate(drizzle(client), { migrationsFolder: legacyMigrations })
      await client.execute('PRAGMA foreign_keys = ON')
      await client.batch(
        [
          {
            sql: 'INSERT INTO tracks (id,position,content) VALUES (?,?,?)',
            args: ['fundamentals', 0, '{}'],
          },
          {
            sql: 'INSERT INTO lessons (slug,track_id,title,objective,step_count,position,content) VALUES (?,?,?,?,?,?,?)',
            args: [firstLesson, 'fundamentals', 'How React renders', 'Trace a render.', 5, 0, '{}'],
          },
          { sql: 'INSERT INTO guests (id) VALUES (?)', args: [guestId] },
          {
            sql: 'INSERT INTO progress (guest_id,lesson_id,step,completed,visited_steps,updated_at) VALUES (?,?,?,?,?,?)',
            args: [guestId, firstLesson, 2, 1, '[2]', new Date().toISOString()],
          },
          {
            sql: 'INSERT INTO bookmarks (guest_id,lesson_id) VALUES (?,?)',
            args: [guestId, firstLesson],
          },
        ],
        'write',
      )
    } finally {
      client.close()
    }

    store.close()
    store = await openDatabase(legacyPath, tracks, lessons)
    app = createApp(store.db)
    const cookie = 'rr_guest=' + token
    await expectLibrary(cookie, firstLesson)
    await expectLibrary(await register(cookie), firstLesson)
  })

  it('restores a persisted account on a second browser and returns to its separate guest library on logout', async () => {
    const firstSession = await register()
    await study(firstSession, firstLesson)
    store.close()
    await openApp()

    const persisted = await request('/auth/session', 'GET', firstSession)
    expect(await persisted.json()).toEqual(signedIn)
    expect(persisted.headers.get('cache-control')).toContain('no-store')
    await expectLibrary(firstSession, firstLesson)

    const otherGuest = await startGuest()
    await study(otherGuest, secondLesson)
    const login = await request('/auth/login', 'POST', otherGuest, {
      ...account,
      email: account.email.toUpperCase(),
    })
    expect(login.status).toBe(200)
    expect(await login.json()).toEqual(signedIn)
    const nextSession = issuedCookie(login, 'rr_session')
    expect(nextSession).not.toBe(firstSession)
    expect(login.headers.getSetCookie().some((line) => line.startsWith('rr_guest='))).toBe(false)
    const browserCookies = otherGuest + '; ' + nextSession
    await expectLibrary(browserCookies, firstLesson)

    const logout = await request('/auth/logout', 'POST', browserCookies)
    expect(logout.status).toBe(200)
    expect(logout.headers.getSetCookie().some((line) => line.startsWith('rr_guest='))).toBe(false)
    expect(await (await request('/auth/session', 'GET', otherGuest)).json()).toEqual(guestSession)
    await expectLibrary(otherGuest, secondLesson)
    await expectLibrary(firstSession, firstLesson)
  })

  it('keeps accounts separate and revokes the active session on logout', async () => {
    const nami = await register()
    await study(nami, firstLesson)
    const registration = await request('/auth/register', 'POST', '', {
      ...account,
      email: 'nico.robin@strawhatpirates.example.com',
    })
    expect(registration.status).toBe(201)
    const robin = issuedCookie(registration, 'rr_session')
    expect(await (await request('/bookmarks', 'GET', robin)).json()).toEqual([])
    await study(robin, secondLesson)

    const logout = await request('/auth/logout', 'POST', nami)
    expect(logout.status).toBe(200)
    expect(await logout.json()).toEqual(guestSession)
    const clearedCookie = logout.headers
      .getSetCookie()
      .find((value) => value.startsWith('rr_session='))
    expect(clearedCookie).toMatch(/; Max-Age=0(?:;|$)/i)
    expect(await (await request('/auth/session', 'GET', nami)).json()).toEqual(guestSession)
    expect((await request('/bookmarks', 'GET', nami)).status).toBe(401)
    await expectLibrary(robin, secondLesson)

    const login = await request('/auth/login', 'POST', '', account)
    expect(login.status).toBe(200)
    await expectLibrary(issuedCookie(login, 'rr_session'), firstLesson)
  })

  it('rejects duplicate emails and gives the same response to invalid login credentials', async () => {
    await register()
    const duplicate = await request('/auth/register', 'POST', '', account)
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toMatchObject({ error: { code: 'email_in_use' } })

    const unknown = await request('/auth/login', 'POST', '', {
      ...account,
      email: 'sanji@strawhatpirates.example.com',
    })
    const wrong = await request('/auth/login', 'POST', '', {
      ...account,
      password: 'A different route home',
    })
    expect(unknown.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(await wrong.json()).toEqual(await unknown.json())
    expect(wrong.headers.getSetCookie().some((value) => value.startsWith('rr_session='))).toBe(
      false,
    )
  })

  it('validates email and password length before creating a learner account', async () => {
    const shortPassword = {
      code: 'invalid_password',
      message: 'Use a password with 15 to 128 characters.',
    }
    const malformed = {
      code: 'invalid_credentials_format',
      message: 'Enter a valid email address and a password of up to 128 characters.',
    }
    for (const [input, error] of [
      [{ ...account, email: 'nami' }, malformed],
      [{ ...account, password: 'a'.repeat(14) }, shortPassword],
      [{ ...account, password: '' }, malformed],
      [{ ...account, password: 'a'.repeat(129) }, malformed],
      [{ email: 'nami', password: 'short' }, malformed],
      [{ ...account, password: 'short', extra: true }, malformed],
    ] as const) {
      const response = await request('/auth/register', 'POST', '', input)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error })
    }
    const login = await request('/auth/login', 'POST', '', { ...account, password: 'short' })
    expect(login.status).toBe(401)
    expect(await login.json()).toMatchObject({ error: { code: 'invalid_credentials' } })
    const minimum = await request('/auth/register', 'POST', '', {
      ...account,
      password: 'a'.repeat(15),
    })
    expect(minimum.status).toBe(201)
    const maximum = await request('/auth/register', 'POST', '', {
      email: 'zoro@strawhatpirates.example.com',
      password: '🌊'.repeat(128),
    })
    expect(maximum.status).toBe(201)
  })

  it('uses a host-scoped production cookie and enforces session expiry server-side', async () => {
    app = createApp(store.db, { secure: true })
    const registration = await request('/auth/register', 'POST', '', account)
    expect(registration.status).toBe(201)
    const cookie = issuedCookie(registration, '__Host-rr_session')
    const policy = registration.headers.getSetCookie().find((line) => line.startsWith(cookie + ';'))
    expect(policy).toMatch(/; Secure(?:;|$)/i)
    expect(policy).toMatch(/; HttpOnly(?:;|$)/i)
    expect(policy).toMatch(/; SameSite=Lax(?:;|$)/i)
    expect(policy).toMatch(/; Path=\/(?:;|$)/i)
    expect(policy).toMatch(/; Max-Age=2592000(?:;|$)/i)
    expect(policy).not.toMatch(/; Domain=/i)
    expect(await (await request('/auth/session', 'GET', cookie)).json()).toEqual(signedIn)

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000)
    expect(await (await request('/auth/session', 'GET', cookie)).json()).toEqual(guestSession)
    expect((await request('/bookmarks', 'GET', cookie)).status).toBe(401)
  })

  it('rejects a private save after another tab switches the active account', async () => {
    const cookie = await register()
    const save = (expectedAccount: string) =>
      app.request(origin + '/api/progress/' + firstLesson, {
        method: 'PUT',
        headers: {
          cookie,
          origin,
          'content-type': 'application/json',
          'X-Expected-Account': encodeURIComponent(expectedAccount),
        },
        body: JSON.stringify({ step: 1 }),
      })
    const stale = await save('nico.robin@strawhatpirates.example.com')
    expect(stale.status).toBe(409)
    expect(await stale.json()).toMatchObject({ error: { code: 'session_changed' } })
    expect(await (await request('/progress', 'GET', cookie)).json()).toEqual([])
    expect((await save(account.email)).status).toBe(200)
  })

  it('limits repeated login attempts for an email until its fifteen-minute window expires', async () => {
    await register()
    const typo = { ...account, password: 'A different route home' }
    for (let i = 0; i < 10; i++) {
      expect((await request('/auth/login', 'POST', '', typo)).status).toBe(401)
    }
    expect((await request('/auth/login', 'POST', '', account)).status).toBe(429)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 16 * 60 * 1000)
    const login = await request('/auth/login', 'POST', '', account)
    expect(login.status).toBe(200)
    expect(await login.json()).toEqual(signedIn)
  }, 15_000)

  it.each([
    { trustedProxyIp: '127.0.0.1', otherClientStatus: 201 },
    { trustedProxyIp: undefined, otherClientStatus: 429 },
  ])(
    'partitions the registration budget for proxy setting $trustedProxyIp',
    async ({ trustedProxyIp, otherClientStatus }) => {
      app = createApp(store.db, { trustedProxyIp })
      const registerThroughProxy = (email: string, clientAddress: string) =>
        app.request(
          origin + '/api/auth/register',
          {
            method: 'POST',
            headers: {
              origin,
              'content-type': 'application/json',
              'x-forwarded-for': clientAddress,
            },
            body: JSON.stringify({ ...account, email }),
          },
          { incoming: { socket: { remoteAddress: '::ffff:127.0.0.1' } } },
        )

      expect((await registerThroughProxy(account.email, '192.0.2.1')).status).toBe(201)
      await store.db.update(authAttempts).set({ attempts: 10 })
      expect((await registerThroughProxy(account.email, '192.0.2.1')).status).toBe(429)
      const otherClient = await registerThroughProxy(
        'zoro@strawhatpirates.example.com',
        '192.0.2.2',
      )
      expect(otherClient.status).toBe(otherClientStatus)
    },
  )

  it('accepts same-origin writes and rejects account changes from an unrelated origin', async () => {
    const foreign = 'https://elsewhere.example'
    const refused = await request('/auth/register', 'POST', '', account, foreign)
    expect(refused.status).toBe(403)
    const session = await register()
    expect((await request('/auth/logout', 'POST', session, undefined, foreign)).status).toBe(403)
    expect(await (await request('/auth/session', 'GET', session)).json()).toEqual(signedIn)
  })
})
