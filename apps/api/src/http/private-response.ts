import type { MiddlewareHandler } from 'hono'

export const privateResponse: MiddlewareHandler = async (c, next) => {
  c.header('Cache-Control', 'private, no-store')
  c.header('Vary', 'Cookie')
  await next()
}
