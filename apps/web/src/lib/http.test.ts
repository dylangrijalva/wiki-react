// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { authSessionSchema } from '@rendered/shared/contracts/auth'
import { request } from './http'

afterEach(() => vi.unstubAllGlobals())

it('reports an unreadable successful response without exposing server markup', async () => {
  vi.stubGlobal('fetch', async () => new Response('<html>internal details</html>'))
  await expect(request('auth/session', authSessionSchema)).rejects.toThrow(
    'The server returned an unreadable response.',
  )
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
