import { useState } from 'react'
import { useReducedMotion } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Workflow,
} from 'lucide-react'
import type { Lesson } from '@rendered/shared'
import { SceneDiagram } from '../visualizations/SceneDiagram'
import { RenderBench } from '../visualizations/RenderBench'
import { Experiment, hasExperiment } from '../visualizations/Experiments'
export function Walkthrough({
  lesson,
  index,
  onStep,
  onCheck,
}: {
  lesson: Lesson
  index: number
  onStep: (step: number) => void
  onCheck: () => void
}) {
  const [paused, setPaused] = useState(false)
  const [replay, setReplay] = useState(0)
  const [lab, setLab] = useState(false)
  const reduced = useReducedMotion()
  const step = lesson.steps[index]
  const last = index === lesson.steps.length - 1
  const specialized = hasExperiment(lesson.slug)
  return (
    <div className="rr-stage">
      <div className="rr-stage-top">
        <div className="rr-stage-views">
          {specialized ? (
            <>
              <button aria-pressed={!lab} onClick={() => setLab(false)}>
                <Workflow size={15} />
                Walkthrough
              </button>
              <button aria-pressed={lab} onClick={() => setLab(true)}>
                <FlaskConical size={15} />
                Experiment
              </button>
            </>
          ) : (
            <span>
              <Workflow size={16} />
              Visual walkthrough
            </span>
          )}
        </div>
        {!lab && (
          <div className="rr-tools">
            <button
              title="Replay animation"
              aria-label="Replay animation"
              onClick={() => {
                setPaused(false)
                setReplay((n) => n + 1)
              }}
            >
              <RotateCcw size={15} />
            </button>
            {!reduced && (
              <button
                title={paused ? 'Resume motion' : 'Pause motion'}
                aria-label={paused ? 'Resume motion' : 'Pause motion'}
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
            )}
          </div>
        )}
      </div>
      {lab ? (
        <Experiment slug={lesson.slug} />
      ) : (
        <div className="rr-canvas" data-paused={paused || reduced}>
          <div className="rr-fig">
            <span>
              <ScanLine size={13} /> FIG. {String(index + 1).padStart(2, '0')}
            </span>
            <span>{lesson.mode} view</span>
          </div>
          {lesson.slug === 'how-react-renders' ? (
            <RenderBench index={index} replay={replay} paused={paused} />
          ) : (
            <SceneDiagram
              mode={lesson.mode}
              scene={step.scene}
              label={step.title}
              paused={paused}
              replay={replay}
            />
          )}
        </div>
      )}
      <div className="rr-stage-controls">
        <div className="rr-step-row">
          <span>
            Step {String(index + 1).padStart(2, '0')} /{' '}
            {String(lesson.steps.length).padStart(2, '0')}
          </span>
          <div className="rr-segments">
            {lesson.steps.map((s, i) => (
              <button
                key={s.title}
                aria-label={`Step ${i + 1}: ${s.title}`}
                title={s.title}
                aria-current={i === index ? 'step' : undefined}
                className={i <= index ? 'viewed' : ''}
                onClick={() => {
                  setLab(false)
                  onStep(i)
                }}
              />
            ))}
          </div>
        </div>
        <div className="rr-step-actions">
          <button
            disabled={!index}
            onClick={() => {
              setLab(false)
              onStep(index - 1)
            }}
          >
            <ArrowLeft size={15} />
            Previous
          </button>
          <button
            className="rr-next"
            onClick={() => {
              setLab(false)
              if (last) onCheck()
              else onStep(index + 1)
            }}
          >
            {last ? 'Knowledge check' : 'Next step'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
