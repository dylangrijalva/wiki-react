// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { authSessionSchema } from '@rendered/shared/contracts/auth'
import { request } from '../../lib/http'
import { changeSession, listenForAccountChanges } from './session'

afterEach(() => vi.unstubAllGlobals())

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

it('switches away from the lesson only for a validated identity conflict', async () => {
  const replace = vi.fn()
  vi.stubGlobal(
    'window',
    Object.assign(new EventTarget(), {
      location: { pathname: '/lessons/how-react-renders', replace },
    }),
  )
  listenForAccountChanges()
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
