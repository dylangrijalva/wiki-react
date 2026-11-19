import { slugSchema } from '@rendered/shared/contracts/catalog'
import { ApiError } from '../../http/errors'

export function parseLessonSlug(value: string) {
  const parsed = slugSchema.safeParse(value)
  if (!parsed.success) throw new ApiError(400, 'invalid_lesson_id', 'Use a valid lesson slug.')
  return parsed.data
}
