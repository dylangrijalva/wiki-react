import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import ClipTree from './ClipTree'
import { node } from './Lab'
const initialClips = ['Kick', 'Snare', 'Hat']
export default function Reconciliation() {
  const [operation, setOperation] = useState<'Swap' | 'Replace' | 'Rename'>('Swap')
  const [stable, setStable] = useState(true)
  const clips =
    operation === 'Swap'
      ? ['Hat', 'Snare', 'Kick']
      : operation === 'Replace'
        ? ['Kick', 'Clap', 'Hat']
        : ['Kick', 'Snare', 'Open hat']
  const result =
    operation === 'Swap'
      ? stable
        ? 'The draft follows Hat to the first position. All three row instances keep their state.'
        : 'The draft stays in slot 3. The row now displays Kick with Hat’s old draft.'
      : operation === 'Replace'
        ? stable
          ? 'Snare unmounts. Clap gets a new row and new local state.'
          : 'Slot 2 keeps its old instance when Snare becomes Clap.'
        : 'The same key and component type preserve the row. Its label changes to Open hat.'
  const oldNodes = initialClips.map((clip, i) =>
    node(
      'old' + i,
      clip,
      clip === 'Hat' ? 'draft: editing' : 'draft: empty',
      operation === 'Replace' && i === 1 && stable ? 'removed' : 'idle',
    ),
  )
  const newNodes = clips.map((clip, i) => {
    const original = !stable ? i : operation === 'Rename' ? i : initialClips.indexOf(clip)
    const status = original === -1 ? 'added' : clip !== initialClips[original] ? 'active' : 'kept'
    return node(
      original === -1 ? 'replacement' : 'clip' + original,
      clip,
      original === 2 ? 'draft: editing' : 'draft: empty',
      status,
    )
  })
  return (
    <div className="rr-lab">
      <div className="rr-lab-title">
        <FlaskConical size={15} />
        Match two clip lists
      </div>
      <div className="rr-tree-pair">
        {[
          { label: 'Before', nodes: oldNodes },
          { label: 'After', nodes: newNodes },
        ].map((group) => (
          <div key={group.label}>
            <ClipTree label={group.label} nodes={group.nodes} stable={stable} />
          </div>
        ))}
      </div>
      <div className="rr-lab-actions">
        <label>
          Row key{' '}
          <select
            value={stable ? 'id' : 'index'}
            onChange={(e) => setStable(e.target.value === 'id')}
          >
            <option value="id">Clip ID</option>
            <option value="index">Array index</option>
          </select>
        </label>
        {(['Swap', 'Replace', 'Rename'] as const).map((action) => (
          <button
            key={action}
            aria-pressed={operation === action}
            onClick={() => setOperation(action)}
          >
            {action}
          </button>
        ))}
      </div>
      <p className="rr-lab-result" aria-live="polite">
        {result}
      </p>
    </div>
  )
}
