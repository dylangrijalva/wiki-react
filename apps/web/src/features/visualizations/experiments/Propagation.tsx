import { useState } from 'react'
import { Lab, node } from './Lab'
export default function Propagation() {
  const [solo, setSolo] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const channels = ['Lead', 'Bass']
  return (
    <Lab
      title="Solo a mixer channel"
      mode="tree"
      scene={{
        nodes: [
          node('mixer', 'Mixer', `soloId: ${solo ?? 'null'}`, started ? 'active' : 'idle'),
          ...channels.map((ch) =>
            node(ch, ch, solo === ch ? 'solo: true' : 'solo: false', started ? 'active' : 'idle'),
          ),
        ],
        edges: channels.map((ch) => ['mixer', ch]),
      }}
      controls={channels.map((ch) => (
        <button
          key={ch}
          aria-pressed={solo === ch}
          onClick={() => {
            setStarted(true)
            setSolo(solo === ch ? null : ch)
          }}
        >
          {'Solo ' + ch}
        </button>
      ))}
      result={
        started
          ? `Updating soloId to ${solo ?? 'null'} queues a Mixer render. Neither channel uses memo, so Lead and Bass both render again.`
          : 'Mixer holds the solo selection for both channels. Choose Lead or Bass to change it.'
      }
    />
  )
}
