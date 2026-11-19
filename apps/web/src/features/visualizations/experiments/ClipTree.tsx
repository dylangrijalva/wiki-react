import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { SceneNode } from '@rendered/shared/contracts/catalog'
import { useCompactDiagram } from '../useCompactDiagram'
import { statusLabels } from '../SceneDiagram'

const colors = {
  active: '#c8a8ee',
  kept: '#a1d8bb',
  added: '#a6c9e8',
  removed: '#e9a799',
  idle: '#e4dfcf',
}

export default function ClipTree({
  label,
  nodes,
  stable,
}: {
  label: string
  nodes: SceneNode[]
  stable: boolean
}) {
  const id = useId()
  const compact = useCompactDiagram()
  const reduced = useReducedMotion()
  return (
    <svg
      className="rr-clip-tree"
      viewBox={compact ? '0 0 272 233' : '0 0 500 151'}
      role="img"
      aria-labelledby={id + 'title'}
      aria-describedby={id + 'desc'}
    >
      <title id={id + 'title'}>Clip tree ({label.toLowerCase()})</title>
      <desc id={id + 'desc'}>
        {nodes
          .map((n) => `${n.label}, ${statusLabels[n.status ?? 'idle']}, ${n.detail}.`)
          .join(' ')}
      </desc>
      <text x="11" y="22" className="rr-clip-lane">
        {label}
      </text>
      <g stroke="var(--rr-wire)" strokeWidth="1.6" fill="none">
        <path
          d={
            compact
              ? 'M96 116H112V42H122M112 116H122M112 116V190H122'
              : 'M250 46V56H86Q80 56 80 63V74M250 56V74M250 56H414Q420 56 420 63V74'
          }
        />
      </g>
      <rect
        x={compact ? 7 : 173}
        y={compact ? 99 : 12}
        width={compact ? 89 : 154}
        height="34"
        rx="6"
        fill="#cdb5e9"
        stroke="#4e4358"
        strokeWidth="1.5"
      />
      <text
        x={compact ? 51 : 250}
        y={compact ? 121 : 33}
        className="rr-clip-label"
        textAnchor="middle"
      >
        ClipList
      </text>
      {nodes.map((n, i) => {
        const status = n.status ?? 'idle'
        return (
          <motion.g
            key={stable ? n.id : i}
            initial={false}
            animate={compact ? { x: 122, y: i * 74 + 11 } : { x: i * 170 + 10, y: 74 }}
            transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 230, damping: 24 }}
          >
            <rect
              x="2"
              y="3"
              width="140"
              height="62"
              rx="6"
              fill="var(--rr-shadow)"
              stroke="var(--rr-outline)"
            />
            <rect
              width="140"
              height="62"
              rx="6"
              fill="var(--rr-node)"
              stroke="var(--rr-outline)"
              strokeWidth="1.5"
            />
            <path
              d="M6 0h128q6 0 6 6v10H0V6q0-6 6-6Z"
              fill={colors[status]}
              stroke="var(--rr-outline)"
              strokeWidth="1.2"
            />
            <text x="8" y="11.5" className="rr-clip-status">
              {statusLabels[status]}
            </text>
            <text x="9" y="36" className="rr-clip-label">
              {n.label}
            </text>
            <text x="9" y="52" className="rr-clip-draft">
              {n.detail}
            </text>
          </motion.g>
        )
      })}
    </svg>
  )
}
