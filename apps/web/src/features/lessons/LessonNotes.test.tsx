import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { lessons } from '@rendered/shared/content'
import { KnowledgeCheck } from './LessonNotes'

afterEach(cleanup)
it('shows a retry, explains the correct answer, and submits completion once selected', () => {
  const onComplete = vi.fn()
  const lesson = lessons[0]
  render(
    <KnowledgeCheck lesson={lesson} completed={false} pending={false} onComplete={onComplete} />,
  )
  const wrong = lesson.quiz.options.findIndex((_, i) => i !== lesson.quiz.answer)
  const choose = (index: number) => fireEvent.click(screen.getByText(lesson.quiz.options[index]))
  choose(wrong)
  expect(screen.queryByRole('button', { name: 'Complete lesson' })).toBeNull()
  choose(lesson.quiz.answer)
  expect(screen.getByRole('status').textContent).toBe(lesson.quiz.explanation)
  fireEvent.click(screen.getByRole('button', { name: 'Complete lesson' }))
  expect(onComplete).toHaveBeenCalledTimes(1)
})
