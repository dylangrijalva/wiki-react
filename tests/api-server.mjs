import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const directory = mkdtempSync(join(tmpdir(), 'react-rendered-browser-'))
process.env.DATABASE_PATH = join(directory, 'browser.sqlite')
process.on('exit', () => rmSync(directory, { recursive: true, force: true }))
await import('../apps/api/src/index.ts')
