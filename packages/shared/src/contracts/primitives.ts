import { z } from 'zod'

export const text = z.string().regex(/\S/, 'Expected text.')

export const slugSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
