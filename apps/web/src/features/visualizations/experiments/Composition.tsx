import { useState } from 'react'
import { AudioLines } from 'lucide-react'
import { Lab, node } from './Lab'
export default function Composition() {
  const [transport, setTransport] = useState(false)
  const [caption, setCaption] = useState(false)
  const nodes = [
    node('frame', 'Frame', 'children slot', 'kept'),
    node('wave', 'Waveform', 'clip preview', 'kept'),
    ...(transport ? [node('transport', 'Transport', 'play controls', 'added')] : []),
    ...(caption ? [node('caption', 'Caption', 'clip title', 'added')] : []),
  ]
  return (
    <Lab
      title="Compose a clip preview"
      mode="tree"
      scene={{ nodes, edges: nodes.slice(1).map((n) => ['frame', n.id]) }}
      controls={
        <>
          <button aria-pressed={transport} onClick={() => setTransport(!transport)}>
            {transport ? 'Remove' : 'Add'} transport
          </button>
          <button aria-pressed={caption} onClick={() => setCaption(!caption)}>
            {caption ? 'Remove' : 'Add'} caption
          </button>
        </>
      }
      result={`Frame renders ${nodes.length - 1} ${nodes.length === 2 ? 'child' : 'children'} supplied by the caller. Its own implementation stays the same.`}
    >
      <div className="rr-preview" aria-label="Composed clip preview">
        <AudioLines size={26} />
        {transport && <span aria-label="transport preview">◀ ▶ ▶|</span>}
        {caption && <small>Tape loop 01</small>}
      </div>
    </Lab>
  )
}
