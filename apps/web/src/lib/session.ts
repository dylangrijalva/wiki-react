import { queryOptions, useQuery } from '@tanstack/react-query'

import type { AuthSession } from '@rendered/shared'
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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/' + path, { ...init, credentials: 'same-origin' })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    if (response.status === 409 && body?.error?.code === 'session_changed') refreshIdentity()
    throw new Error(
      typeof body?.error?.message === 'string' && response.status < 500
        ? body.error.message
        : 'The server couldn’t complete the request. Please try again.',
    )
  }
  return response.json() as Promise<T>
}

export const sessionOptions = queryOptions({
  queryKey: ['session'],
  queryFn: async ({ signal }) => {
    const session = await request<AuthSession>('auth/session', { signal, cache: 'no-store' })
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
  const session = await request<AuthSession>('auth/' + action, {
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
