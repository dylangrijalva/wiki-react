// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { authSessionSchema } from '@rendered/shared'
import { changeSession, request } from './session'

afterEach(() => vi.unstubAllGlobals())

it('reports an unreadable successful response without exposing server markup', async () => {
  vi.stubGlobal('fetch', async () => new Response('<html>internal details</html>'))
  await expect(request('auth/session', authSessionSchema)).rejects.toThrow(
    'The server returned an unreadable response.',
  )
})

it('leaves account-change notifications and navigation alone for malformed auth results', async () => {
  const replace = vi.fn(),
    setItem = vi.fn()
  vi.stubGlobal('window', { location: { replace } })
  vi.stubGlobal('localStorage', { setItem })
  vi.stubGlobal('fetch', async () => Response.json({ user: { email: 101 } }))
  await expect(changeSession('logout')).rejects.toThrow(
    'The server returned an unexpected response.',
  )
  expect(replace).not.toHaveBeenCalled()
  expect(setItem).not.toHaveBeenCalled()
})

it.each([
  [
    400,
    { error: { code: 'bad_request', message: 'Enter a valid email.' } },
    'Enter a valid email.',
  ],
  [400, { error: { message: 'Internal details' } }, 'The server couldn’t complete the request.'],
  [
    500,
    { error: { code: 'internal_error', message: 'Internal details' } },
    'The server couldn’t complete the request.',
  ],
] as const)('validates the error envelope for HTTP %s', async (status, body, message) => {
  vi.stubGlobal('fetch', async () => Response.json(body, { status }))
  await expect(request('auth/session', authSessionSchema)).rejects.toThrow(message)
})

it('switches away from the lesson only for a validated identity conflict', async () => {
  const replace = vi.fn()
  vi.stubGlobal('window', { location: { pathname: '/lessons/how-react-renders', replace } })
  const conflict = { error: { code: 'session_changed', message: 'Your session has changed.' } }
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: { code: 'session_changed' } }, { status: 409 }))
      .mockResolvedValueOnce(Response.json(conflict, { status: 409 })),
  )
  await expect(request('progress', authSessionSchema)).rejects.toThrow(
    'The server couldn’t complete the request.',
  )
  expect(replace).not.toHaveBeenCalled()
  await expect(request('progress', authSessionSchema)).rejects.toThrow('Your session has changed.')
  expect(replace).toHaveBeenCalledWith('/progress')
})
