import { fileURLToPath } from 'node:url'

export const paths = {
  migrations: fileURLToPath(new URL('../drizzle/', import.meta.url)),
  database: fileURLToPath(new URL('../data/learning.sqlite', import.meta.url)),
  web: fileURLToPath(new URL('../../web/dist/', import.meta.url)),
}
