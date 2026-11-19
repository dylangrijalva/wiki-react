import { queryOptions, useQuery } from '@tanstack/react-query'

import { apiErrorSchema, authSessionSchema } from '@rendered/shared'
import type { ZodType } from 'zod'
export type AuthAction = 'register' | 'login' | 'logout'
const eventKey = 'rendered-account-change'
let priorEmail: string | null | undefined
let channel: BroadcastChannel | undefined
let leavingPage = false

function switchPage(destination?: string) {
  if (leavingPage) return
  leavingPage = true
  // Discard in-memory learner queries, queued mutations, and the currently mounted lesson together.
  if (destination) window.location.replace(destination)
  else window.location.reload()
}

function refreshIdentity() {
  switchPage(window.location.pathname.startsWith('/lessons/') ? '/progress' : undefined)
}

export async function request<T>(path: string, schema: ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/' + path, { ...init, credentials: 'same-origin' })
  const failure = 'The server couldn’t complete the request. Please try again.'
  if (response.status >= 500) throw new Error(failure)

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    if (init?.signal?.aborted) throw error
    throw new Error(
      response.ok ? 'The server returned an unreadable response. Please try again.' : failure,
    )
  }

  if (!response.ok) {
    const result = apiErrorSchema.safeParse(body)
    if (!result.success) throw new Error(failure)
    if (response.status === 409 && result.data.error.code === 'session_changed') refreshIdentity()
    throw new Error(result.data.error.message)
  }
  const result = schema.safeParse(body)
  if (!result.success)
    throw new Error('The server returned an unexpected response. Please try again.')
  return result.data
}

export const sessionOptions = queryOptions({
  queryKey: ['session'],
  queryFn: async ({ signal }) => {
    const session = await request('auth/session', authSessionSchema, { signal, cache: 'no-store' })
    const email = session.user?.email ?? null
    if (priorEmail !== undefined && priorEmail !== email) refreshIdentity()
    priorEmail = email
    return session
  },
  staleTime: Infinity,
  refetchOnWindowFocus: 'always',
})

export const useSession = () => useQuery(sessionOptions)

// Tabs exchange only a change notification. The server identifies the account from its cookie.
export function listenForAccountChanges() {
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(eventKey)
    channel.onmessage = refreshIdentity
  }
  window.addEventListener('storage', (event) => {
    if (event.key === eventKey) refreshIdentity()
  })
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshIdentity()
  })
}

export async function changeSession(
  action: AuthAction,
  credentials?: { email: string; password: string },
) {
  const session = await request('auth/' + action, authSessionSchema, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials ?? {}),
  })
  channel?.postMessage('changed')
  try {
    localStorage.setItem(eventKey, crypto.randomUUID())
  } catch {
    // BroadcastChannel remains available when browser storage is disabled.
  }
  switchPage(session.user ? '/progress' : '/')
}
