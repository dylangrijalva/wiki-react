import { describe, expect, it } from 'vitest'
import { lessons, tracks } from './content'
describe('published curriculum', () => {
  it('has six populated tracks and stable, unique slugs', () => {
    expect(tracks).toHaveLength(6)
    expect(new Set(lessons.map((l) => l.slug)).size).toBe(lessons.length)
    for (const t of tracks)
      expect(lessons.filter((l) => l.trackId === t.id).length).toBeGreaterThanOrEqual(4)
  })
  it.each(lessons)('$slug has connected scene references and a knowledge check', (lesson) => {
    expect(lesson.source).toMatch(/^https:\/\//)
    expect(lesson.steps.length).toBeGreaterThanOrEqual(5)
    expect(lesson.steps.length).toBeLessThanOrEqual(8)
    expect(lesson.quiz.options[lesson.quiz.answer]).toBeTruthy()
    expect(lesson.quiz.explanation).not.toBe('')
    for (const [i, step] of lesson.steps.entries()) {
      expect(step.code.trim()).not.toBe('')
      expect(step.scene.nodes.length).toBeGreaterThan(0)
      const ids = new Set(step.scene.nodes.map((n) => n.id))
      expect(ids.size).toBe(step.scene.nodes.length)
      for (const [from, to] of step.scene.edges) {
        expect(ids.has(from)).toBe(true)
        expect(ids.has(to)).toBe(true)
      }
      if (i > 0) expect(step.scene).not.toEqual(lesson.steps[i - 1].scene)
    }
  })
})
