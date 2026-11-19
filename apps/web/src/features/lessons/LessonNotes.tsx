import { useState, useRef, useEffect, Fragment } from 'react'
import { Check, CheckCircle2, Code2, ExternalLink, Lightbulb, TriangleAlert } from 'lucide-react'
import type { Lesson, Step } from '@rendered/shared'

function highlight(code: string) {
  return code
    .split(
      /(\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|return|function|type|const|let|if|else|async|await|export|interface|true|false|null|use[A-Z]\w*)\b)/g,
    )
    .map((part, i) =>
      i % 2 ? (
        <span
          key={i}
          className={
            part.startsWith('//')
              ? 'rr-code-comment'
              : /^["']/.test(part)
                ? 'rr-code-string'
                : 'rr-code-keyword'
          }
        >
          {part}
        </span>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
}
function markKeywords(body: string, step: Step) {
  const labels = step.scene.nodes.map((n) => n.label).filter((label) => label.length > 2)
  const expression = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  if (!expression) return body
  return body
    .split(new RegExp(`(\\b(?:${expression})\\b)`, 'ig'))
    .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}
export function LessonNotes({ lesson, index }: { lesson: Lesson; index: number }) {
  const step = lesson.steps[index]
  return (
    <aside className="rr-notes" aria-label="Step explanation">
      <div className="rr-step-copy" aria-live="polite" aria-atomic="true">
        <h2>{step.title}</h2>
        <p>{markKeywords(step.body, step)}</p>
      </div>
      <div className="rr-code">
        <div>
          <Code2 size={14} />
          Example.tsx
        </div>
        <pre tabIndex={0} aria-label="TypeScript example">
          <code>{highlight(step.code)}</code>
        </pre>
      </div>
      <details className="rr-note-detail">
        <summary>
          <TriangleAlert size={15} />
          Common mistake
        </summary>
        <p>{lesson.pitfall}</p>
      </details>
      <details className="rr-note-detail">
        <summary>
          <Lightbulb size={15} />
          In practice
        </summary>
        <p>{lesson.practice}</p>
      </details>
      <a className="rr-source" href={lesson.source} target="_blank" rel="noreferrer">
        Read the documentation <ExternalLink size={12} />
      </a>
    </aside>
  )
}
export function KnowledgeCheck({
  lesson,
  completed,
  onComplete,
  pending,
}: {
  lesson: Lesson
  completed: boolean
  onComplete: () => void
  pending: boolean
}) {
  const [answer, setAnswer] = useState<number | null>(null)
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    title.current?.focus({ preventScroll: true })
  }, [])
  const correct = answer === lesson.quiz.answer
  return (
    <section className="rr-quiz" aria-labelledby="rr-check">
      <div className="rr-eyebrow">
        <CheckCircle2 size={15} />
        Knowledge check
      </div>
      <h2 ref={title} tabIndex={-1} id="rr-check">
        {lesson.quiz.question}
      </h2>
      <div className="rr-answers">
        {lesson.quiz.options.map((option, i) => (
          <button key={option} aria-pressed={answer === i} onClick={() => setAnswer(i)}>
            {option}
            {correct && i === answer && <Check size={16} />}
          </button>
        ))}
      </div>
      {answer !== null && (
        <p role="status" className={'rr-feedback ' + (correct ? 'is-correct' : '')}>
          {correct ? lesson.quiz.explanation : 'Check the diagram and try again.'}
        </p>
      )}
      {(correct || completed) && (
        <div className="rr-recap">
          <h3>Lesson recap</h3>
          <p>{lesson.recap}</p>
          <button className="btn primary" disabled={completed || pending} onClick={onComplete}>
            {completed ? (
              <>
                <Check size={15} /> Lesson completed
              </>
            ) : (
              'Complete lesson'
            )}
          </button>
        </div>
      )}
    </section>
  )
}
