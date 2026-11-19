import { useState } from 'react'
import { AudioLines } from 'lucide-react'
import { Lab, node } from './Lab'
export default function Composition() {
  const [transport, setTransport] = useState(false)
  const [caption, setCaption] = useState(false)
  const nodes = [
    node('frame', 'Frame', 'children prop', 'kept'),
    node('wave', 'Waveform', 'clip preview', 'kept'),
    ...(transport ? [node('transport', 'Transport', 'playback controls', 'added')] : []),
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
            {transport ? 'Remove' : 'Add'} playback controls
          </button>
          <button aria-pressed={caption} onClick={() => setCaption(!caption)}>
            {caption ? 'Remove' : 'Add'} caption
          </button>
        </>
      }
      result={`The caller passes ${nodes.length - 1} ${nodes.length === 2 ? 'child' : 'children'} to Frame. The same Frame component renders whichever pieces you choose.`}
    >
      <div className="rr-preview" aria-label="Clip preview">
        <AudioLines size={26} />
        {transport && <span aria-label="Playback controls in the preview">◀ ▶ ▶|</span>}
        {caption && <small>Tape loop</small>}
      </div>
    </Lab>
  )
}
