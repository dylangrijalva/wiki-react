import { z } from 'zod'

const emailSchema = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .max(254, 'Use an email address with up to 254 characters.')
  .pipe(z.email({ error: 'Enter a valid email address.' }))

export const authSessionSchema = z.object({
  user: z.object({ email: emailSchema }).nullable(),
})
export type AuthSession = z.infer<typeof authSessionSchema>

const passwordSchema = z
  .string({ error: 'Enter your password.' })
  .min(1, 'Enter your password.')
  .refine((value) => [...value].length <= 128, 'Use a password with up to 128 characters.')

export const loginCredentialsSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
})
export const registrationCredentialsSchema = loginCredentialsSchema.extend({
  password: passwordSchema.refine((value) => value === '' || [...value].length >= 15, {
    message: 'Use a password with 15 to 128 characters.',
    params: { reason: 'short_registration_password' },
  }),
})
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>
export type RegistrationCredentials = z.infer<typeof registrationCredentialsSchema>
