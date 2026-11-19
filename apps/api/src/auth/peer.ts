import type { IncomingMessage } from 'node:http'
import { BlockList, isIP } from 'node:net'
import type { Context } from 'hono'

function family(ip: string) {
  const version = isIP(ip)
  return version === 4 ? 'ipv4' : version === 6 ? 'ipv6' : undefined
}

export function rateLimitPeer(trustedProxyIp?: string) {
  const trusted = new BlockList()
  if (trustedProxyIp !== undefined) {
    const type = family(trustedProxyIp)
    if (!type) throw new Error('TRUSTED_PROXY_IP must be a single IPv4 or IPv6 address.')
    trusted.addAddress(trustedProxyIp, type)
  }

  return (c: Context) => {
    const bindings: { incoming?: IncomingMessage } | undefined = c.env
    const peer = bindings?.incoming?.socket?.remoteAddress ?? 'local'
    const type = family(peer)
    if (!type || !trusted.check(peer, type)) return peer
    // The trusted proxy must append its client address, or overwrite the entire header.
    const forwarded = c.req.header('X-Forwarded-For')?.split(',').at(-1)?.trim()
    return forwarded && family(forwarded) ? forwarded : peer
  }
}
