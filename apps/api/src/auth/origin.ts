import type { MiddlewareHandler } from 'hono'
import { ApiError } from '../routes/errors'

export function sameOriginWrites(secure: boolean, publicOrigin?: string): MiddlewareHandler {
  const configured = publicOrigin ? new URL(publicOrigin).origin : undefined
  return async (c, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
      const origin = c.req.header('Origin')
      const site = c.req.header('Sec-Fetch-Site')
      const url = new URL(c.req.url)
      const expected = configured ?? (secure ? 'https:' : url.protocol) + '//' + url.host
      if (
        site === 'cross-site' ||
        site === 'same-site' ||
        (origin !== undefined && origin !== expected)
      ) {
        throw new ApiError(403, 'cross_origin', 'This request must come from the course website.')
      }
    }
    await next()
  }
}
