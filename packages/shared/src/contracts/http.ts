import { z } from 'zod'
import { text } from './primitives.js'

export const apiErrorSchema = z.object({ error: z.object({ code: text, message: text }) })
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>
