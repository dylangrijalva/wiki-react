import { useId } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Lesson, Step } from '@rendered/shared'
import { connector, layoutScene, nodeHeight, nodeWidth, wrap } from './scene-layout'

export const statusLabels = {
  idle: 'Waiting',
  active: 'Active',
  kept: 'Preserved',
  added: 'Added',
  removed: 'Removed',
}
const swatches = {
  idle: '#e5dfd1',
  active: '#b89af0',
  kept: '#8bd5b4',
  added: '#a5c9fa',
  removed: '#ef9e8c',
}

function NodeGlyph({ status }: { status: keyof typeof swatches }) {
  return (
    <g fill="none" stroke="#312c2e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {status === 'active' ? (
        <path d="m-4 -5 -5 5 5 5 m8 -10 5 5 -5 5 m-3 -12 -3 14" />
      ) : status === 'added' ? (
        <path d="M-6 0H6M0-6V6" />
      ) : status === 'removed' ? (
        <path d="M-6 0H6" />
      ) : status === 'kept' ? (
        <path d="m-6 0 4 4 8 -8" />
      ) : (
        <>
          <rect x="-7" y="-5" width="14" height="10" rx="2" />
          <path d="M-3 0H3" />
        </>
      )}
    </g>
  )
}

export function SceneDiagram({
  scene,
  mode,
  label,
  paused = false,
  replay = 0,
}: {
  scene: Step['scene']
  mode: Lesson['mode']
  label: string
  paused?: boolean
  replay?: number
}) {
  const mid = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const { width, height, points } = layoutScene(scene, mode)
  const colors = [...new Set(scene.nodes.map((n) => n.status ?? 'idle'))]
  const summary = scene.nodes
    .map(
      (n) => `${n.label}, ${statusLabels[n.status ?? 'idle']}${n.detail ? ', ' + n.detail : ''}.`,
    )
    .join(' ')
  const transition =
    paused || reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 230, damping: 26 }
  return (
    <div className="rr-diagram" data-paused={paused || reduced}>
      <svg
        key={replay}
        className="rr-graph"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={mid + 'title'}
        aria-describedby={mid + 'desc'}
      >
        <title id={mid + 'title'}>{label}</title>
        <desc id={mid + 'desc'}>
          {summary}{' '}
          {scene.edges
            .map(([a, b]) => {
              const nodeLabel = (id: string) => scene.nodes.find((n) => n.id === id)?.label
              return `${nodeLabel(a)} points to ${nodeLabel(b)}.`
            })
            .join(' ')}
        </desc>
        <defs>
          <marker
            id={mid + 'arrow'}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="m1 1 4 2-4 2" stroke="var(--rr-wire)" fill="none" />
          </marker>
        </defs>
        <g fill="none" stroke="var(--rr-wire)" strokeWidth="1.8">
          {scene.edges.map(([a, b], i) => {
            const from = points.get(a),
              to = points.get(b)
            if (!from || !to) return null
            const d = connector(from, to)
            return (
              <g key={a + '-' + b}>
                <path d={d} markerEnd={`url(#${mid}arrow)`} />
                {!reduced && (
                  <circle
                    className="rr-pulse"
                    r="3"
                    stroke="none"
                    fill="var(--rr-wire)"
                    style={{ offsetPath: `path('${d}')`, animationDelay: `${-i * 0.37}s` }}
                  />
                )}
              </g>
            )
          })}
        </g>
        <AnimatePresence>
          {scene.nodes.map((node) => {
            const point = points.get(node.id)!
            const status = node.status ?? 'idle'
            const lines = wrap(node.label, 17)
            const detail = node.detail ? wrap(node.detail, 24) : []
            const left = -nodeWidth / 2,
              top = -nodeHeight / 2
            return (
              <motion.g
                key={node.id}
                initial={{ ...point, opacity: reduced ? 1 : 0 }}
                animate={{ ...point, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              >
                <title>
                  {[node.label, node.detail, statusLabels[status]].filter(Boolean).join(' · ')}
                </title>
                <rect
                  x={left + 3}
                  y={top + 4}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  fill="var(--rr-shadow)"
                  stroke="var(--rr-outline)"
                  strokeWidth="1.5"
                />
                <rect
                  x={left}
                  y={top}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  fill="var(--rr-node)"
                  stroke="var(--rr-outline)"
                  strokeWidth="1.5"
                />
                <path
                  d={`M${left + 8} ${top}h${nodeWidth - 16}q8 0 8 8v12h-${nodeWidth}v-12q0-8 8-8Z`}
                  fill={swatches[status]}
                  stroke="var(--rr-outline)"
                  strokeWidth="1.3"
                />
                <g transform={`translate(${left + 14} ${top + 10}) scale(.7)`}>
                  <NodeGlyph status={status} />
                </g>
                <text x={left + 28} y={top + 13.7} className="rr-node-status">
                  {statusLabels[status]}
                </text>
                {lines.slice(0, 2).map((line, i) => (
                  <text
                    className="rr-node-label"
                    textAnchor="middle"
                    key={i}
                    y={(lines.length > 1 ? -1 : 7) + i * 15}
                  >
                    {line}
                  </text>
                ))}
                {detail.length > 0 && (
                  <text className="rr-node-detail" textAnchor="middle" y="28">
                    {detail[0]}
                    {detail.length > 1 ? '…' : ''}
                  </text>
                )}
              </motion.g>
            )
          })}
        </AnimatePresence>
      </svg>
      <div className="rr-legend" aria-label="Diagram legend">
        {colors.map((color) => (
          <span key={color}>
            <i style={{ background: swatches[color] }} />
            {statusLabels[color]}
          </span>
        ))}
      </div>
    </div>
  )
}
