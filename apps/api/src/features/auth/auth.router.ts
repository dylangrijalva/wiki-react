import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import {
  loginCredentialsSchema,
  registrationCredentialsSchema,
  type AuthSession,
} from '@rendered/shared/contracts/auth'
import type { Database } from '../../db/database'
import { ApiError } from '../../http/errors'
import { privateResponse } from '../../http/private-response'
import { loginAccount, registerAccount, revokeSession } from './auth.service'
import { readCredentials } from './credentials'
import { credentialLimits } from './limits'
import { learnerSessions } from './sessions'

const limitBody = bodyLimit({
  maxSize: 4096,
  onError: () => {
    throw new ApiError(413, 'body_too_large', 'The request exceeds 4 KB.')
  },
})

export function authRouter(db: Database, secure: boolean, trustedProxyIp?: string) {
  const router = new Hono()
  const sessions = learnerSessions(db, secure)
  const limit = credentialLimits(db, trustedProxyIp)
  router.use('*', privateResponse)
  router.get('/session', async (c) => {
    const account = await sessions.account(c)
    return c.json({ user: account ? { email: account.email } : null } satisfies AuthSession)
  })
  router.post('/register', limitBody, async (c) => {
    if (await sessions.account(c))
      throw new ApiError(409, 'already_signed_in', 'Sign out before creating another account.')
    const credentials = await readCredentials(c, registrationCredentialsSchema)
    const { user, token } = await limit(c, 'register', credentials.email, () =>
      registerAccount(db, credentials, sessions.guestId(c), sessions.sessionDigest(c)),
    )
    sessions.signIn(c, token)
    sessions.clearGuest(c)
    return c.json({ user } satisfies AuthSession, 201)
  })
  router.post('/login', limitBody, async (c) => {
    const credentials = await readCredentials(c, loginCredentialsSchema)
    const { user, token } = await limit(c, 'login', credentials.email, () =>
      loginAccount(db, credentials, sessions.sessionDigest(c)),
    )
    sessions.signIn(c, token)
    return c.json({ user } satisfies AuthSession)
  })
  router.post('/logout', async (c) => {
    await revokeSession(db, sessions.sessionDigest(c))
    sessions.signOut(c)
    return c.json({ user: null } satisfies AuthSession)
  })
  return router
}
