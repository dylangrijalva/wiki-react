import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import type { Database } from '../db/database'
import { guests } from '../db/schema'
import { ApiError } from './errors'

export function guestSession(db: Database, secure: boolean) {
  const name = secure ? '__Host-rr_guest' : 'rr_guest'
  const digest = (token: string) => createHash('sha256').update(token).digest('hex')

  async function lookup(c: Context) {
    const token = getCookie(c, name)
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return undefined
    const record = await db
      .select()
      .from(guests)
      .where(eq(guests.id, digest(token)))
      .get()
    return record?.id
  }

  return {
    async initialize(c: Context) {
      const existing = await lookup(c)
      if (existing) return existing
      const token = randomBytes(32).toString('base64url')
      const id = digest(token)
      await db.insert(guests).values({ id })
      setCookie(c, name, token, {
        httpOnly: true,
        secure,
        sameSite: 'Lax',
        path: '/',
        maxAge: 31536000,
      })
      return id
    },
    async require(c: Context) {
      const id = await lookup(c)
      if (!id)
        throw new ApiError(
          401,
          'guest_required',
          'Open your learning progress to start a guest session.',
        )
      return id
    },
  }
}
