import { eq, lte, sql } from 'drizzle-orm'
import type { Context } from 'hono'
import type { Database } from '../../db/database'
import { authAttempts } from '../../db/schema'
import { ApiError } from '../../http/errors'
import { digest } from './sessions'
import { rateLimitPeer } from './peer'

const windowMs = 15 * 60 * 1000

const emailBucket = (email: string) => 'login:email:' + digest(email)

export function clearLoginAttempts(db: Database, email: string) {
  return db.delete(authAttempts).where(eq(authAttempts.bucket, emailBucket(email)))
}

export function credentialLimits(db: Database, trustedProxyIp?: string) {
  const peerFor = rateLimitPeer(trustedProxyIp)
  let pending = 0

  function reject(c: Context, seconds: number): never {
    c.header('Retry-After', String(seconds))
    throw new ApiError(429, 'too_many_attempts', 'Too many attempts. Please try again later.')
  }

  async function reserve(c: Context, bucket: string, limit: number) {
    const now = Date.now()
    const rows = await db
      .insert(authAttempts)
      .values({ bucket, attempts: 1, expiresAt: now + windowMs })
      .onConflictDoUpdate({
        target: authAttempts.bucket,
        set: { attempts: sql`${authAttempts.attempts} + 1` },
        setWhere: sql`${authAttempts.attempts} < ${limit}`,
      })
      .returning({ attempts: authAttempts.attempts })
    if (!rows.length) reject(c, windowMs / 1000)
  }

  return async function limitCredentials<T>(
    c: Context,
    kind: 'login' | 'register',
    email: string,
    work: () => Promise<T>,
  ) {
    if (pending >= 4) reject(c, 2)
    pending++
    try {
      const peer = peerFor(c)
      await db.delete(authAttempts).where(lte(authAttempts.expiresAt, Date.now()))
      await reserve(c, kind + ':peer:' + digest(peer), kind === 'register' ? 10 : 120)
      if (kind === 'login') await reserve(c, emailBucket(email), 10)
      return await work()
    } finally {
      pending--
    }
  }
}
