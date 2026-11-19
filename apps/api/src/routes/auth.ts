import { randomUUID } from 'node:crypto'
import type { AuthSession } from '@rendered/shared'
import { and, eq, inArray, lte, or } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { credentialLimits } from '../auth/limits'
import { hashPassword, matchesPassword } from '../auth/passwords'
import { learnerSessions, newToken, sessionLifetime } from '../auth/sessions'
import type { Database } from '../db/database'
import { accounts, accountSessions, bookmarks, learners, progress } from '../db/schema'
import { ApiError } from './errors'

const credentials = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z
    .string()
    .min(1)
    .refine((value) => [...value].length <= 128),
})

async function readCredentials(c: Context, register: boolean) {
  if (c.req.header('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new ApiError(415, 'json_required', 'Send credentials as JSON.')
  const parsed = credentials.safeParse(await c.req.json<unknown>().catch(() => null))
  if (!parsed.success)
    throw new ApiError(
      400,
      'invalid_credentials_format',
      'Enter a valid email address and a password of up to 128 characters.',
    )
  if (register && [...parsed.data.password].length < 15) {
    throw new ApiError(400, 'invalid_password', 'Use a password with 15 to 128 characters.')
  }
  return parsed.data
}

function transferGuestRecords(db: Database, guestId: string | undefined, accountId: string) {
  if (!guestId) return []
  const matchingGuest = and(eq(learners.id, guestId), eq(learners.kind, 'guest'))
  const owner = db.select({ id: learners.id }).from(learners).where(matchingGuest)
  return [
    db.update(progress).set({ learnerId: accountId }).where(inArray(progress.learnerId, owner)),
    db.update(bookmarks).set({ learnerId: accountId }).where(inArray(bookmarks.learnerId, owner)),
    db.delete(learners).where(matchingGuest),
  ]
}

function sessionView(email?: string): AuthSession {
  return { user: email ? { email } : null }
}

export function authRoutes(db: Database, secure: boolean, trustedProxyIp?: string) {
  const app = new Hono()
  const sessions = learnerSessions(db, secure)
  const limits = credentialLimits(db, trustedProxyIp)
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'private, no-store')
    c.header('Vary', 'Cookie')
    await next()
  })
  const limitBody = bodyLimit({
    maxSize: 4096,
    onError: () => {
      throw new ApiError(413, 'body_too_large', 'The request exceeds 4 KB.')
    },
  })

  function issue(c: Context, accountId: string) {
    const { id, token } = newToken()
    const previous = sessions.sessionDigest(c)
    const expired = lte(accountSessions.expiresAt, Date.now())
    return {
      token,
      queries: [
        db
          .delete(accountSessions)
          .where(previous ? or(expired, eq(accountSessions.digest, previous)) : expired),
        db
          .insert(accountSessions)
          .values({ digest: id, accountId, expiresAt: Date.now() + sessionLifetime * 1000 }),
      ] as const,
    }
  }

  app.get('/session', async (c) => {
    const account = await sessions.account(c)
    return c.json(sessionView(account?.email))
  })

  app.post('/register', limitBody, async (c) => {
    if (await sessions.account(c))
      throw new ApiError(409, 'already_signed_in', 'Sign out before creating another account.')
    const { email, password } = await readCredentials(c, true)
    return limits.run(c, 'register', email, async () => {
      const id = randomUUID()
      const passwordHash = await hashPassword(password)
      const session = issue(c, id)
      try {
        await db.batch([
          db.insert(learners).values({ id, kind: 'account' }),
          db.insert(accounts).values({ id, email, passwordHash }),
          ...transferGuestRecords(db, sessions.guestId(c), id),
          ...session.queries,
        ])
      } catch (error) {
        if (
          await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.email, email)).get()
        ) {
          throw new ApiError(409, 'email_in_use', 'An account already uses this email.')
        }
        throw error
      }
      sessions.signIn(c, session.token)
      sessions.clearGuest(c)
      return c.json(sessionView(email), 201)
    })
  })

  app.post('/login', limitBody, async (c) => {
    const { email, password } = await readCredentials(c, false)
    return limits.run(c, 'login', email, async () => {
      const account = await db.select().from(accounts).where(eq(accounts.email, email)).get()
      if (!(await matchesPassword(password, account?.passwordHash)) || !account) {
        throw new ApiError(401, 'invalid_credentials', 'The email or password is incorrect.')
      }
      const session = issue(c, account.id)
      await db.batch([...session.queries, limits.resetLogin(email)])
      sessions.signIn(c, session.token)
      return c.json(sessionView(account.email))
    })
  })

  app.post('/logout', async (c) => {
    const id = sessions.sessionDigest(c)
    if (id) await db.delete(accountSessions).where(eq(accountSessions.digest, id))
    sessions.signOut(c)
    return c.json(sessionView())
  })
  return app
}
