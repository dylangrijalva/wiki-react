import { z } from 'zod'
import { slugSchema } from './primitives.js'

export const bookmarkListSchema = z.array(slugSchema)
export const bookmarkResultSchema = z.object({ lessonId: slugSchema, bookmarked: z.boolean() })
export type BookmarkResult = z.infer<typeof bookmarkResultSchema>
