import type { ReactNode } from 'react'

const ink = '#32332d'
export const pigments = {
  violet: ['#d4bdf7', '#b599dc', '#9b7cc7'],
  mint: ['#b7ddbf', '#86baa1', '#689e86'],
  orange: ['#ffc38c', '#e6a46d', '#cb865c'],
  blue: ['#b5d5ef', '#8db7da', '#6b95bc'],
  yellow: ['#f5dc91', '#dac27d', '#b6a163'],
  pink: ['#eeb5c9', '#d69aac', '#bd8196'],
} satisfies Record<string, string[]>
export function Atom({ radius = 22 }: { radius?: number }) {
  return (
    <g fill="none" stroke={ink} strokeWidth="1.8">
      {[0, 60, 120].map((a) => (
        <ellipse key={a} rx={radius} ry={radius * 0.36} transform={'rotate(' + a + ')'} />
      ))}
      <circle r={radius * 0.13} fill={ink} />
    </g>
  )
}
export function Tile({
  x = 0,
  y = 0,
  w = 48,
  h = 14,
  p = 'violet',
  children,
}: {
  x?: number
  y?: number
  w?: number
  h?: number
  p?: keyof typeof pigments
  children?: ReactNode
}) {
  const [top, left, right] = pigments[p],
    r = w * 0.48
  return (
    <g transform={`translate(${x} ${y})`} stroke={ink} strokeWidth="1.6" strokeLinejoin="round">
      <path fill={left} d={`M${-w} 0 0 ${r}v${h}l${-w} ${-r}Z`} />
      <path fill={right} d={`M0 ${r} ${w} 0v${h}L0 ${r + h}Z`} />
      <path fill={top} d={`M0 ${-r} ${w} 0 0 ${r} ${-w} 0Z`} />
      <g transform="matrix(.82 .39 -.82 .39 0 0)">{children}</g>
    </g>
  )
}
function TinyText({ children }: { children: ReactNode }) {
  return (
    <text
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="var(--mono)"
      fontSize="22"
      fontWeight="600"
      fill={ink}
      stroke="none"
    >
      {children}
    </text>
  )
}
const trackPalette: Record<string, string> = {
  fundamentals: '#e8ddf5',
  state: '#dcece0',
  effects: '#f7e6cf',
  performance: '#dfeaf2',
  architecture: '#f0dce5',
  production: '#f0ebd0',
}
export const trackPaper = (id: string) => trackPalette[id] ?? '#e8ddf5'
export function TrackArt({ id }: { id: string }) {
  let art: ReactNode
  if (id === 'fundamentals')
    art = (
      <>
        <path d="m72 67 0 12-33 16m33-16 32 16" />
        <Tile x={40} y={91} w={23} h={9} p="violet" />
        <Tile x={106} y={91} w={23} h={9} p="violet" />
        <Tile x={72} y={49} w={34} h={14}>
          <Atom radius={17} />
        </Tile>
      </>
    )
  else if (id === 'state')
    art = (
      <>
        <path d="m34 77 27 13 33-16" />
        <Tile x={36} y={76} w={23} p="mint" h={9} />
        {[78, 59, 40].map((y, i) => (
          <Tile key={y} x={88} y={y} w={33} h={12} p="mint">
            {i === 2 && <TinyText>S</TinyText>}
          </Tile>
        ))}
      </>
    )
  else if (id === 'effects')
    art = (
      <>
        <path d="M37 68c-12-26 37-51 66-32l6 5m-11 1 11-1-2-10M111 69c8 26-35 42-62 31l-8-5m1 10-1-10 10-1" />
        <Tile x={74} y={67} w={36} h={13} p="orange">
          <path d="m3-19-16 22h12l-3 16L15-5H2z" fill="#f6a16c" />
        </Tile>
      </>
    )
  else if (id === 'performance')
    art = (
      <>
        {[0, 1, 2].map((v) => (
          <Tile key={v} x={42 + v * 29} y={88 - v * 17} w={18} h={9 + v * 8} p="blue" />
        ))}
      </>
    )
  else if (id === 'architecture')
    art = (
      <>
        {[81, 62, 43].map((y) => (
          <Tile key={y} x={73} y={y} w={39} h={11} p="pink" />
        ))}
      </>
    )
  else
    art = (
      <>
        <Tile x={72} y={77} w={41} h={13} p="yellow" />
        <path d="M51 38q20 2 28-8l19 12-2 26q-4 17-22 24-21-10-24-26z" fill="#edd488" />
        <path d="m60 61 10 10 17-20" strokeWidth="4" />
      </>
    )
  return (
    <svg
      className="track-art"
      aria-hidden="true"
      viewBox="0 0 146 124"
      fill="none"
      stroke={ink}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {art}
    </svg>
  )
}
