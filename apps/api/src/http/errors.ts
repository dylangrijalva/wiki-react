import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { ErrorHandler } from 'hono'

export class ApiError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export const apiErrorHandler: ErrorHandler = (error, c) => {
  if (error instanceof ApiError) {
    return c.json({ error: { code: error.code, message: error.message } }, error.status)
  }
  console.error(error)
  return c.json(
    { error: { code: 'internal_error', message: 'The server could not finish this request.' } },
    500,
  )
}
