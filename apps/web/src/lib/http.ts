import type { ZodType } from 'zod'
import { apiErrorSchema } from '@rendered/shared/contracts/http'

export const sessionConflictEvent = 'rendered:session-conflict'

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
    if (response.status === 409 && result.data.error.code === 'session_changed') {
      window.dispatchEvent(new Event(sessionConflictEvent))
    }
    throw new Error(result.data.error.message)
  }
  const result = schema.safeParse(body)
  if (!result.success)
    throw new Error('The server returned an unexpected response. Please try again.')
  return result.data
}

export function privateRequest<T>(
  email: string,
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
) {
  const headers = new Headers(init?.headers)
  headers.set('X-Expected-Account', encodeURIComponent(email))
  return request(path, schema, { ...init, cache: 'no-store', headers })
}
