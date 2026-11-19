import type { Lesson } from '../contracts/catalog.js'
import { fundamentals } from './fundamentals.js'
import { state } from './state.js'
import { effects } from './effects.js'
import { performance } from './performance.js'
import { architecture } from './architecture.js'
import { production } from './production.js'
export { tracks } from './tracks.js'

export const lessons: Lesson[] = [
  ...fundamentals,
  ...state,
  ...effects,
  ...performance,
  ...architecture,
  ...production,
]
