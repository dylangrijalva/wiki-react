import { Pause, Play } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

const headlines = ['React, under\nthe hood.', 'Trace a\nstate update.', 'Follow the\nnext render.']
const original = headlines[0]
const motionQuery = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(notify: () => void) {
  const media = window.matchMedia(motionQuery)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

function prefersReducedMotion() {
  return window.matchMedia(motionQuery).matches
}

function HeadlineText({ text, showCaret }: { text: string; showCaret: boolean }) {
  const [first, second] = text.split('\n')
  return (
    <h1 className="display-heading" aria-label="React, under the hood.">
      <span
        className="headline-line"
        aria-hidden="true"
        data-caret={showCaret && second === undefined}
      >
        {first}
      </span>
      <span
        className="headline-line"
        aria-hidden="true"
        data-caret={showCaret && second !== undefined}
      >
        {second}
      </span>
    </h1>
  )
}

function AnimatedHeadline() {
  const [paused, setPaused] = useState(false)
  const [frame, setFrame] = useState({ index: 0, length: original.length, deleting: true })
  const phrase = headlines[frame.index]

  useEffect(() => {
    if (paused) return

    const complete = frame.length === phrase.length
    const delay = complete ? 2600 : frame.deleting ? 38 : 78
    const timer = window.setTimeout(() => {
      if (frame.deleting && frame.length === 1) {
        setFrame({ index: (frame.index + 1) % headlines.length, length: 0, deleting: false })
      } else {
        const length = frame.length + (frame.deleting ? -1 : 1)
        setFrame({ ...frame, length, deleting: frame.deleting || length === phrase.length })
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [frame, paused, phrase])

  const action = paused ? 'Resume headline animation' : 'Pause headline animation'
  return (
    <>
      <div className="headline-label">
        <span className="kicker field-label">AN INTERACTIVE FIELD GUIDE</span>
        <button type="button" title={action} aria-label={action} onClick={() => setPaused(!paused)}>
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </button>
      </div>
      <HeadlineText text={phrase.slice(0, frame.length)} showCaret={!paused} />
    </>
  )
}

export default function HeroHeadline() {
  const reduced = useSyncExternalStore(
    subscribeToMotionPreference,
    prefersReducedMotion,
    () => true,
  )
  if (reduced) {
    return (
      <>
        <div className="headline-label kicker field-label">AN INTERACTIVE FIELD GUIDE</div>
        <HeadlineText text={original} showCaret={false} />
      </>
    )
  }
  return <AnimatedHeadline />
}
