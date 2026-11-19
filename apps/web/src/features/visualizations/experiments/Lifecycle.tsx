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
          ? `Cleanup closes the ${previous} stream before setup opens ${station}.`
          : change === 'unmount'
            ? 'When the player unmounts, its cleanup closes the current stream.'
            : change === 'repeat'
              ? 'The station is unchanged, so the effect keeps the same connection.'
              : `In production, setup opens the ${station} stream after React commits the player.`
      }
    />
  )
}
