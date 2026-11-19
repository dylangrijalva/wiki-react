import { describe, expect, it } from 'vitest'
import { lessons, tracks } from './content'
import {
  apiErrorSchema,
  authSessionSchema,
  bookmarkListSchema,
  bookmarkResultSchema,
  lessonSchema,
  lessonSummaryListSchema,
  loginCredentialsSchema,
  progressListSchema,
  registrationCredentialsSchema,
  slugSchema,
  trackListSchema,
} from './types'

const lesson = lessons[0]
const summary = {
  slug: lesson.slug,
  title: lesson.title,
  trackId: lesson.trackId,
  objective: lesson.objective,
  stepCount: lesson.steps.length,
}
const progress = {
  lessonId: lesson.slug,
  step: 2,
  completed: false,
  visitedSteps: [0, 2],
  updatedAt: '2026-11-18T20:00:00.000Z',
}

describe('published API contracts', () => {
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

  it('validates private learning data, auth sessions, bookmarks and structured API errors', () => {
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
    expect(bookmarkListSchema.parse([lesson.slug])).toEqual([lesson.slug])
    expect(bookmarkListSchema.safeParse([null]).success).toBe(false)
    expect(bookmarkResultSchema.parse({ lessonId: lesson.slug, bookmarked: false })).toEqual({
      lessonId: lesson.slug,
      bookmarked: false,
    })
    expect(
      bookmarkResultSchema.safeParse({ lessonId: lesson.slug, bookmarked: 'false' }).success,
    ).toBe(false)
    expect(authSessionSchema.parse({ user: null })).toEqual({ user: null })
    expect(authSessionSchema.safeParse({ user: { email: 'no-domain' } }).success).toBe(false)
    expect(apiErrorSchema.safeParse({ error: { code: 'invalid_progress' } }).success).toBe(false)
    expect(
      apiErrorSchema.parse({
        error: { code: 'invalid_progress', message: 'Choose a lesson step.' },
      }).error.code,
    ).toBe('invalid_progress')
  })
})

describe('account input contracts', () => {
  const email = 'nami@strawhatpirates.example.com'
  const input = { email: '  ' + email.toUpperCase() + '  ', password: ' Keep This Case and Space ' }

  it('normalizes the address, leaves the password intact, and rejects undeclared fields', () => {
    for (const schema of [loginCredentialsSchema, registrationCredentialsSchema]) {
      expect(schema.parse(input)).toEqual({ email, password: input.password })
      expect(schema.safeParse({ ...input, nickname: 'Nami' }).success).toBe(false)
      expect(schema.safeParse({ ...input, email: 'a'.repeat(245) + '@example.com' }).success).toBe(
        false,
      )
    }
  })

  it('counts characters in Unicode code points and distinguishes a short registration password', () => {
    expect(loginCredentialsSchema.safeParse({ email, password: '🌊' }).success).toBe(true)
    expect(loginCredentialsSchema.safeParse({ email, password: '' }).success).toBe(false)
    for (const length of [15, 128]) {
      const password = '🌊'.repeat(length)
      expect(registrationCredentialsSchema.parse({ email, password }).password).toBe(password)
    }
    const short = registrationCredentialsSchema.safeParse({ email, password: '🌊'.repeat(14) })
    expect(short.error?.issues).toMatchObject([
      { path: ['password'], code: 'custom', params: { reason: 'short_registration_password' } },
    ])
    expect(
      registrationCredentialsSchema.safeParse({ email, password: '🌊'.repeat(129) }).success,
    ).toBe(false)
  })
})
