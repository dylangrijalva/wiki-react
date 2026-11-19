import { describe, expect, it } from 'vitest'
import { matchesLesson } from './Curriculum'
import type { LessonSummary } from '@rendered/shared/contracts/catalog'
import type { Progress } from '@rendered/shared/contracts/progress'
const row: LessonSummary = {
  slug: 'jsx-components-props',
  title: 'JSX and props',
  objective: 'Trace a value through a component.',
  trackId: 'fundamentals',
  stepCount: 5,
}
const started: Progress = {
  lessonId: row.slug,
  step: 2,
  completed: false,
  updatedAt: '2026-10-01T12:00:00Z',
  visitedSteps: [0, 1, 2],
}
describe('curriculum filters', () => {
  it('combines the objective search with the chosen completion state', () => {
    expect(matchesLesson(row, '  VaLuE ', 'started', started)).toBeTruthy()
    expect(matchesLesson(row, '  VaLuE ', 'new', started)).toBeFalsy()
    expect(matchesLesson(row, 'effect', 'started', started)).toBeFalsy()
  })
  it('distinguishes new and completed lessons', () => {
    expect(matchesLesson(row, '', 'new')).toBeTruthy()
    expect(matchesLesson(row, '', 'complete', { ...started, completed: true })).toBeTruthy()
    expect(matchesLesson(row, '', 'started', { ...started, completed: true })).toBeFalsy()
  })
})
