import { queryOptions, useQuery } from '@tanstack/react-query'
import { authSessionSchema, type LoginCredentials } from '@rendered/shared/contracts/auth'
import { request, sessionConflictEvent } from '../../lib/http'

type AuthAction = 'register' | 'login' | 'logout'
const eventKey = 'rendered-account-change'
let priorEmail: string | null | undefined
let channel: BroadcastChannel | undefined
let leavingPage = false

function switchPage(destination?: string) {
  if (leavingPage) return
  leavingPage = true
  // Queued writes belong to the previous identity, so start with a fresh query client.
  if (destination) window.location.replace(destination)
  else window.location.reload()
}

function refreshIdentity() {
  switchPage(window.location.pathname.startsWith('/lessons/') ? '/progress' : undefined)
}

const sessionOptions = queryOptions({
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

export function listenForAccountChanges() {
  window.addEventListener(sessionConflictEvent, refreshIdentity)
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

export async function changeSession(action: AuthAction, credentials?: LoginCredentials) {
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
    // Storage can be disabled.
  }
  switchPage(session.user ? '/progress' : '/')
}
