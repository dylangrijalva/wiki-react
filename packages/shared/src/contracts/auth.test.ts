import { describe, expect, it } from 'vitest'
import {
  authSessionSchema,
  loginCredentialsSchema,
  registrationCredentialsSchema,
} from '@rendered/shared/contracts/auth'

describe('account input contracts', () => {
  const email = 'nami@strawhatpirates.example.com'
  const input = { email: '  ' + email.toUpperCase() + '  ', password: ' Keep This Case and Space ' }

  it('accepts an anonymous session and validates signed-in email addresses', () => {
    expect(authSessionSchema.parse({ user: null })).toEqual({ user: null })
    expect(authSessionSchema.parse({ user: { email } })).toEqual({ user: { email } })
    expect(authSessionSchema.safeParse({ user: { email: 'no-domain' } }).success).toBe(false)
  })

  it('normalizes the address, leaves the password intact, and rejects undeclared fields', () => {
    for (const schema of [loginCredentialsSchema, registrationCredentialsSchema]) {
      expect(schema.parse(input)).toEqual({ email, password: input.password })
      expect(schema.safeParse({ ...input, nickname: 'Nami' }).success).toBe(false)
      expect(schema.safeParse({ ...input, email: 'a'.repeat(245) + '@example.com' }).success).toBe(
        false,
      )
    }
  })

  it('counts characters in Unicode code points and distinguishes a short registration password', () => {
    expect(loginCredentialsSchema.safeParse({ email, password: '🌊' }).success).toBe(true)
    expect(loginCredentialsSchema.safeParse({ email, password: '' }).success).toBe(false)
    for (const length of [15, 128]) {
      const password = '🌊'.repeat(length)
      expect(registrationCredentialsSchema.parse({ email, password }).password).toBe(password)
    }
    const short = registrationCredentialsSchema.safeParse({ email, password: '🌊'.repeat(14) })
    expect(short.error?.issues).toMatchObject([
      { path: ['password'], code: 'custom', params: { reason: 'short_registration_password' } },
    ])
    expect(
      registrationCredentialsSchema.safeParse({ email, password: '🌊'.repeat(129) }).success,
    ).toBe(false)
  })
})
