import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Database } from '../../db/database'
import { accounts, accountSessions, learners } from '../../db/schema'
import { ApiError } from '../../http/errors'

export const sessionLifetime = 30 * 24 * 60 * 60
export const digest = (value: string) => createHash('sha256').update(value).digest('hex')

export function newToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, id: digest(token) }
}

export function learnerSessions(db: Database, secure: boolean) {
  const prefix = secure ? '__Host-' : ''
  const guestName = prefix + 'rr_guest'
  const sessionName = prefix + 'rr_session'
  const options = { httpOnly: true, path: '/', secure, sameSite: 'Lax' as const }

  function cookieDigest(c: Context, name: string) {
    const value = getCookie(c, name)
    return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? digest(value) : undefined
  }

  function sessionDigest(c: Context) {
    return cookieDigest(c, sessionName)
  }

  async function account(c: Context) {
    const id = sessionDigest(c)
    if (!id) return undefined
    return db
      .select({ id: accounts.id, email: accounts.email })
      .from(accountSessions)
      .innerJoin(accounts, eq(accounts.id, accountSessions.accountId))
      .where(and(eq(accountSessions.digest, id), gt(accountSessions.expiresAt, Date.now())))
      .get()
  }

  async function owner(c: Context, createGuest: boolean) {
    const signedIn = await account(c)
    const expected = c.req.header('X-Expected-Account')
    if (expected !== undefined && expected !== encodeURIComponent(signedIn?.email ?? '')) {
      throw new ApiError(409, 'session_changed', 'Your session has changed.')
    }
    if (signedIn) return signedIn.id
    const guestId = cookieDigest(c, guestName)
    if (guestId) {
      const guest = await db
        .select({ id: learners.id })
        .from(learners)
        .where(and(eq(learners.id, guestId), eq(learners.kind, 'guest')))
        .get()
      if (guest) return guest.id
    }
    if (!createGuest)
      throw new ApiError(
        401,
        'guest_required',
        'Open your learning progress to start a guest session.',
      )
    const { token, id } = newToken()
    await db.insert(learners).values({ id, kind: 'guest' })
    setCookie(c, guestName, token, { ...options, maxAge: 31536000 })
    return id
  }

  return {
    owner,
    account,
    sessionDigest,
    guestId: (c: Context) => cookieDigest(c, guestName),
    signIn(c: Context, token: string) {
      setCookie(c, sessionName, token, { ...options, maxAge: sessionLifetime })
    },
    clearGuest(c: Context) {
      deleteCookie(c, guestName, options)
    },
    signOut(c: Context) {
      deleteCookie(c, sessionName, options)
    },
  }
}
