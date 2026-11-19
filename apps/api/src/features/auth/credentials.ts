import {
  loginCredentialsSchema,
  registrationCredentialsSchema,
} from '@rendered/shared/contracts/auth'
import type { Context } from 'hono'
import { ApiError } from '../../http/errors'

export async function readCredentials(
  c: Context,
  schema: typeof loginCredentialsSchema | typeof registrationCredentialsSchema,
) {
  if (c.req.header('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new ApiError(415, 'json_required', 'Send credentials as JSON.')
  const parsed = schema.safeParse(await c.req.json<unknown>().catch(() => null))
  if (parsed.success) return parsed.data

  const issues = parsed.error.issues
  const first = issues[0]
  if (
    issues.length === 1 &&
    first.code === 'custom' &&
    first.params?.reason === 'short_registration_password'
  ) {
    throw new ApiError(400, 'invalid_password', 'Use a password with 15 to 128 characters.')
  }
  throw new ApiError(
    400,
    'invalid_credentials_format',
    'Enter a valid email address and a password of up to 128 characters.',
  )
}
