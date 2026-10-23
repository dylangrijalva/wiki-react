import { useState, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import Reconciliation from './experiments/Reconciliation'
import Propagation from './experiments/Propagation'
import Lifecycle from './experiments/Lifecycle'
import Composition from './experiments/Composition'
import Performance from './experiments/Performance'
import Fetching from './experiments/Fetching'
const experiments: Record<string, () => ReactNode> = {
  'lists-and-keys': Reconciliation,
  'lifting-state-up': Propagation,
  'effect-lifecycle': Lifecycle,
  'component-composition': Composition,
  memoization: Performance,
  'fetching-and-caching': Fetching,
}
export function hasExperiment(slug: string) {
  return Object.hasOwn(experiments, slug)
}
export function Experiment({ slug }: { slug: string }) {
  const [revision, setRevision] = useState(0)
  const LabView = experiments[slug]
  return (
    <div className="rr-experiment">
      <LabView key={revision} />
      <button className="rr-reset" onClick={() => setRevision((i) => i + 1)}>
        <RotateCcw size={13} /> Reset experiment
      </button>
    </div>
  )
}
