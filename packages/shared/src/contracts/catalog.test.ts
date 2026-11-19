import { describe, expect, it } from 'vitest'
import { lessons, tracks } from '@rendered/shared/content'
import {
  lessonSchema,
  lessonSummaryListSchema,
  searchQuerySchema,
  slugSchema,
  trackListSchema,
} from '@rendered/shared/contracts/catalog'

const lesson = lessons[0]
const summary = {
  slug: lesson.slug,
  title: lesson.title,
  trackId: lesson.trackId,
  objective: lesson.objective,
  stepCount: lesson.steps.length,
}
describe('catalog contracts', () => {
  it('accepts the published tracks, complete lessons and summaries', () => {
    expect(trackListSchema.parse(tracks)).toEqual(tracks)
    for (const item of lessons) expect(lessonSchema.parse(item)).toEqual(item)
    const summaries = lessons.map(({ slug, trackId, title, objective, steps }) => ({
      slug,
      trackId,
      title,
      objective,
      stepCount: steps.length,
    }))
    expect(lessonSummaryListSchema.parse(summaries)).toEqual(summaries)
    expect(lessonSummaryListSchema.parse([])).toEqual([])
  })

  it('accepts additional response fields and optional scene details without returning unknown fields', () => {
    expect(trackListSchema.parse([{ ...tracks[0], abbreviation: 'RF' }])).toEqual([tracks[0]])
    const [first, ...rest] = lesson.steps
    const nodes = [
      { id: 'player', label: 'Player' },
      { id: 'count', label: 'PlayCount' },
    ]
    const scene = { nodes, edges: [['player', 'count']] }
    const result = lessonSchema.parse({
      ...lesson,
      steps: [{ ...first, scene: { ...scene, version: 2 } }, ...rest],
    })
    expect(result.steps[0].scene).toEqual(scene)
  })

  it('rejects malformed diagrams before they reach the visual player', () => {
    const [first, ...rest] = lesson.steps
    const player = { id: 'player', label: 'Player' }
    for (const scene of [
      { nodes: [], edges: [] },
      { nodes: [player, player], edges: [] },
      { nodes: [player], edges: [['player', 'missing']] },
      { nodes: [player], edges: [['player']] },
      { nodes: [{ ...player, status: 'paused' }], edges: [] },
      { nodes: [{ ...player, detail: 0 }], edges: [] },
    ]) {
      expect(
        lessonSchema.safeParse({ ...lesson, steps: [{ ...first, scene }, ...rest] }).success,
      ).toBe(false)
    }
  })

  it('checks quiz choices, step counts, lesson slugs, and reference links', () => {
    const quiz = lesson.quiz
    for (const bad of [
      { ...quiz, answer: quiz.options.length },
      { ...quiz, answer: -1 },
      { ...quiz, answer: 0.5 },
      { ...quiz, options: [quiz.options[0]], answer: 0 },
      { ...quiz, options: ['  ', 'Second choice'], answer: 1 },
    ]) {
      expect(lessonSchema.safeParse({ ...lesson, quiz: bad }).success).toBe(false)
    }
    expect(lessonSchema.safeParse({ ...lesson, steps: [] }).success).toBe(false)
    expect(lessonSchema.safeParse({ ...lesson, mode: 'unknown' }).success).toBe(false)
    expect(lessonSummaryListSchema.safeParse([{ ...summary, stepCount: 0 }]).success).toBe(false)
    expect(slugSchema.safeParse('lessons/other').success).toBe(false)
    expect(slugSchema.safeParse('a'.repeat(121)).success).toBe(false)
    for (const source of ['a relative path', 'mailto:course@example.com']) {
      expect(lessonSchema.safeParse({ ...lesson, source }).success).toBe(false)
    }
  })

  it('accepts an empty search and trims the query before checking its length', () => {
    expect(searchQuerySchema.parse('  ')).toBe('')
    expect(searchQuerySchema.parse('  render state  ')).toBe('render state')
    expect(searchQuerySchema.parse(' ' + 'a'.repeat(160) + ' ')).toHaveLength(160)
    expect(searchQuerySchema.safeParse('a'.repeat(161)).success).toBe(false)
  })
})
