import { describe, expect, it } from 'vitest'
import { apiErrorSchema } from '@rendered/shared/contracts/http'

describe('API errors', () => {
  it('requires an error code and message', () => {
    expect(apiErrorSchema.safeParse({ error: { code: 'invalid_progress' } }).success).toBe(false)
    expect(
      apiErrorSchema.parse({
        error: { code: 'invalid_progress', message: 'Choose a lesson step.' },
      }).error.code,
    ).toBe('invalid_progress')
  })
})
