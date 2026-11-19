import { randomUUID } from 'node:crypto'
import { and, eq, inArray, lte, or } from 'drizzle-orm'
import type { LoginCredentials, RegistrationCredentials } from '@rendered/shared/contracts/auth'
import type { Database } from '../../db/database'
import { accounts, accountSessions, bookmarks, learners, progress } from '../../db/schema'
import { ApiError } from '../../http/errors'
import { clearLoginAttempts } from './limits'
import { hashPassword, matchesPassword } from './passwords'
import { newToken, sessionLifetime } from './sessions'

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

function issueSession(db: Database, accountId: string, previous?: string) {
  const { id, token } = newToken()
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

export async function registerAccount(
  db: Database,
  { email, password }: RegistrationCredentials,
  guestId?: string,
  previousSession?: string,
) {
  const id = randomUUID()
  const passwordHash = await hashPassword(password)
  const session = issueSession(db, id, previousSession)
  try {
    await db.batch([
      db.insert(learners).values({ id, kind: 'account' }),
      db.insert(accounts).values({ id, email, passwordHash }),
      ...transferGuestRecords(db, guestId, id),
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
  return { user: { email }, token: session.token }
}

export async function loginAccount(
  db: Database,
  { email, password }: LoginCredentials,
  previousSession?: string,
) {
  const account = await db.select().from(accounts).where(eq(accounts.email, email)).get()
  if (!(await matchesPassword(password, account?.passwordHash)) || !account) {
    throw new ApiError(401, 'invalid_credentials', 'The email or password is incorrect.')
  }
  const session = issueSession(db, account.id, previousSession)
  await db.batch([...session.queries, clearLoginAttempts(db, email)])
  return { user: { email: account.email }, token: session.token }
}

export async function revokeSession(db: Database, id: string | undefined) {
  if (id) await db.delete(accountSessions).where(eq(accountSessions.digest, id))
}
