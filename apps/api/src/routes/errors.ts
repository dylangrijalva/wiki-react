import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'

export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export function parseSlug(value: string) {
  const parsed = z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .safeParse(value)
  if (!parsed.success) throw new ApiError(400, 'invalid_lesson_id', 'Use a valid lesson slug.')
  return parsed.data
}

export function lessonNotFound() {
  return new ApiError(404, 'lesson_not_found', 'This lesson is unavailable.')
}
