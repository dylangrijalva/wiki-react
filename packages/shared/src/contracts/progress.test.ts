import { describe, expect, it } from 'vitest'
import { progressListSchema, progressUpdateSchema } from '@rendered/shared/contracts/progress'

const progress = {
  lessonId: 'how-react-renders',
  step: 2,
  completed: false,
  visitedSteps: [0, 2],
  updatedAt: '2026-11-18T20:00:00.000Z',
}

describe('progress contracts', () => {
  it('checks saved steps, completion, timestamps and visit history', () => {
    expect(progressListSchema.parse([progress])).toEqual([progress])
    for (const change of [
      { step: -1 },
      { step: 0.5 },
      { visitedSteps: [-1, 2] },
      { visitedSteps: [0] },
      { updatedAt: 'yesterday' },
      { completed: 1 },
    ]) {
      expect(progressListSchema.safeParse([{ ...progress, ...change }]).success).toBe(false)
    }
  })

  it('accepts a nonnegative integer update with an optional completion flag', () => {
    expect(progressUpdateSchema.parse({ step: 0 })).toEqual({ step: 0 })
    expect(progressUpdateSchema.parse({ step: 2, completed: false })).toEqual({
      step: 2,
      completed: false,
    })
    for (const value of [
      {},
      { step: -1 },
      { step: 0.5 },
      { step: '2' },
      { step: 0, completed: 1 },
      { step: 0, visitedSteps: [] },
    ]) {
      expect(progressUpdateSchema.safeParse(value).success).toBe(false)
    }
  })
})
