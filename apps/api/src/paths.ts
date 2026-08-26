import { fileURLToPath } from 'node:url'

// Both the source entry and the bundled entry sit one directory below apps/api.
export const paths = {
  migrations: fileURLToPath(new URL('../drizzle/', import.meta.url)),
  database: fileURLToPath(new URL('../data/learning.sqlite', import.meta.url)),
  web: fileURLToPath(new URL('../../web/dist/', import.meta.url)),
}
