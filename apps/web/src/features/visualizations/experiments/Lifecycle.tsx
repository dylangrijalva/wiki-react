import { useState } from 'react'
import { Lab, node, type Node } from './Lab'
export default function Lifecycle() {
  const [mounted, setMounted] = useState(true)
  const [station, setStation] = useState('Jazz')
  const [previous, setPrevious] = useState<string | null>(null)
  const [change, setChange] = useState<'mount' | 'switch' | 'unmount' | 'repeat'>('mount')
  const switchStation = () => {
    setPrevious(station)
    setStation(station === 'Jazz' ? 'Folk' : 'Jazz')
    setChange('switch')
  }
  const toggleMount = () => {
    setPrevious(mounted ? station : null)
    setChange(mounted ? 'unmount' : 'mount')
    setMounted(!mounted)
  }
  const nodes: Node[] =
    change === 'unmount'
      ? [
          node('commit', 'Commit', 'remove player', 'active'),
          node('clean', 'Cleanup', `close ${previous}`, 'removed'),
        ]
      : [
          node('render', 'Render', station, 'active'),
          node('commit', 'Commit', 'update UI', 'kept'),
          ...(change === 'switch'
            ? [node('clean', 'Cleanup', `close ${previous}`, 'removed')]
            : []),
          node(
            'setup',
            change === 'repeat' ? 'Still connected' : 'Setup',
            `${change === 'repeat' ? 'keep' : 'open'} ${station}`,
            change === 'repeat' ? 'kept' : 'added',
          ),
        ]
  return (
    <Lab
      title="Reconnect a preview stream"
      mode="timeline"
      scene={{ nodes, edges: nodes.slice(1).map((n, i) => [nodes[i].id, n.id]) }}
      controls={
        <>
          <button disabled={!mounted} onClick={switchStation}>
            Change station
          </button>
          <button disabled={!mounted} onClick={() => setChange('repeat')}>
            Render again
          </button>
          <button onClick={toggleMount}>{mounted ? 'Unmount' : 'Mount'} player</button>
        </>
      }
      result={
        change === 'switch'
          ? `The cleanup closes ${previous} before setup connects to ${station}.`
          : change === 'unmount'
            ? 'Removing the player runs the last cleanup. The stream is closed.'
            : change === 'repeat'
              ? 'The dependency stayed equal. This commit keeps the existing subscription.'
              : `After the component commits, setup opens the ${station} stream. This model shows the production lifecycle.`
      }
    />
  )
}
