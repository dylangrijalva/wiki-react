import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const captions = [
  'Player returns a title and a play counter.',
  'Clicking the play button queues an update in PlayCount.',
  'PlayCount returns a button showing one play. The DOM still shows zero.',
  'React updates the text in the same button.',
  'The browser paints the updated count.',
]
function Card({
  x,
  y,
  label,
  tone,
  children,
  lit,
}: {
  x: number
  y: number
  label: string
  tone: string
  children: React.ReactNode
  lit: boolean
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M7 10h154v81l-6 7H4l-7-7V19Z" fill="#544e57" opacity=".14" />
      <path
        d="M0 8 7 0h150v83l-7 8H0Z"
        fill={tone}
        stroke="#37313c"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <rect
        x="0"
        y="8"
        width="150"
        height="83"
        rx="6"
        fill="#fff9ed"
        stroke="#37313c"
        strokeWidth="1.7"
      />
      <path d="M6 8h138q6 0 6 6v18H0V14q0-6 6-6Z" fill={tone} stroke="#37313c" strokeWidth="1.5" />
      <circle
        cx="11"
        cy="20"
        r="3"
        fill={lit ? '#42324d' : '#fff7eb'}
        stroke="#42324d"
        strokeWidth="1.4"
      />
      <text x="23" y="24" fontFamily="var(--mono)" fontSize="11" fill="#382f39" fontWeight="600">
        {label}
      </text>
      {children}
    </g>
  )
}
export function RenderBench({
  index,
  paused,
  replay,
}: {
  index: number
  paused: boolean
  replay: number
}) {
  const rid = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const count = index >= 3 ? 1 : 0
  const text = { fill: '#37313c', fontFamily: 'var(--mono)', fontSize: 11 }
  return (
    <div className="rr-diagram rr-bench" data-paused={paused || reduced}>
      <svg
        key={replay}
        viewBox="0 0 550 324"
        role="img"
        aria-labelledby={rid + 'title'}
        aria-describedby={rid + 'desc'}
      >
        <title id={rid + 'title'}>Player component tree</title>
        <desc id={rid + 'desc'}>{captions[index]}</desc>
        <defs>
          <pattern
            id={rid + 'hatch'}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <path d="M0 0v5" stroke="#53505e" strokeWidth=".6" />
          </pattern>
        </defs>
        <path d="m54 229 236-97 210 70-233 105Z" fill="#ccbde2" opacity=".19" />
        <g fill="none" stroke="#676071" strokeWidth="1.8">
          <path d="M273 119v19q0 7-9 10l-96 29q-10 4-10 13v14" />
          <path
            className={index === 1 || index === 2 ? 'rr-bench-wire' : ''}
            d="M273 119v19q0 7 10 10l97 29q9 4 9 13v14"
          />
        </g>
        <g fill="#b097d3" stroke="#42394a" strokeWidth="1.5">
          <circle cx="273" cy="137" r="4" />
          <circle cx="158" cy="198" r="4" />
          <circle cx="389" cy="198" r="4" />
        </g>
        <Card x={195} y={37} label="Player.tsx" tone="#c3a9e7" lit={index === 0}>
          <g fill="#a58cc7" stroke="#494052" strokeWidth="1.5">
            <path d="m12 57 15-8 15 8-15 9Z" />
            <path d="m12 57 15 9v14l-15-9Zm15 9 15-9v14l-15 9Z" />
          </g>
          <path
            d="M54 50h63m-63 10h77m-77 10h49"
            stroke="#8b7f94"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Card>
        <Card x={80} y={197} label="Title.tsx" tone="#eec5a6" lit={false}>
          <text x="12" y="65" fontFamily="var(--serif)" fontSize="23" fill="#423137">
            Night drive
          </text>
          <path d="M12 76h71" stroke="#baa69d" strokeWidth="3" strokeLinecap="round" />
        </Card>
        <Card
          x={311}
          y={197}
          label="PlayCount.tsx"
          tone={index === 4 ? '#a2d8bb' : '#add2e7'}
          lit={index > 0}
        >
          <rect
            x="13"
            y="48"
            width="122"
            height="27"
            rx="5"
            fill={index >= 3 ? '#c9ebd5' : '#e3eced'}
            stroke="#3f4b4d"
            strokeWidth="1.5"
          />
          <path d="m25 55 9 6-9 6Z" fill="#46545b" />
          <motion.text
            key={count}
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            x="47"
            y="65"
            {...text}
          >
            Plays: {count}
          </motion.text>
        </Card>
        {index > 0 && (
          <g transform="translate(367 124)">
            <rect
              width="145"
              height="29"
              rx="14"
              stroke="#56455f"
              strokeDasharray="3 2"
              fill="#efe2f8"
            />
            <text x="72" y="18" textAnchor="middle" {...text}>
              {['', 'queue: +1', 'next text: 1', 'button updated', '1 play on screen'][index]}
            </text>
          </g>
        )}
        <g stroke="#89858a" fill="none">
          <path d="M47 68h61l65 16m-49 223h74m238-209 18-19h44" strokeDasharray="2 4" />
        </g>
        <text x="48" y="60" className="rr-svg-note">
          COMPONENT
        </text>
        <text x="447" y="73" className="rr-svg-note">
          PROPS ↓
        </text>
      </svg>
      <div className="rr-legend">
        <span>
          <i style={{ background: '#c3a9e7' }} />
          Parent
        </span>
        <span>
          <i style={{ background: '#eec5a6' }} />
          Title
        </span>
        <span>
          <i style={{ background: '#add2e7' }} />
          Counter
        </span>
      </div>
    </div>
  )
}
