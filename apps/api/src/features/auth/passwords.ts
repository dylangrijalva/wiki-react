import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const version = 'scrypt-v1'
const cost = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }
const placeholder = version + ':' + '00'.repeat(16) + ':' + '00'.repeat(64)

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, cost, (error, key) => (error ? reject(error) : resolve(key)))
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await derive(password, salt)
  return [version, salt.toString('hex'), hash.toString('hex')].join(':')
}

export async function matchesPassword(password: string, stored: string | undefined) {
  // Unknown addresses do the same password work as existing accounts.
  const [algorithm, salt, hash] = (stored ?? placeholder).split(':')
  if (algorithm !== version || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) {
    return false
  }
  const derived = await derive(password, Buffer.from(salt, 'hex'))
  return timingSafeEqual(derived, Buffer.from(hash, 'hex')) && stored !== undefined
}
