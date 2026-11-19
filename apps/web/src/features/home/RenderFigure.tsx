import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Radio, RotateCcw } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { Atom, Tile } from '../../components/Illustrations'
function Tag({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 7.5 + 18
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-w / 2}
        y="-9"
        width={w}
        height="20"
        rx="4"
        fill="#fbfaf5"
        stroke="#6e7067"
        strokeWidth="1"
      />
      <text y="5" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="#32342f">
        {text}
      </text>
    </g>
  )
}
const paths = [
  'M272 91v20l-99 47v11',
  'M272 111l101 48v9',
  'M175 192v19l-60 28',
  'M175 211l59 29',
  'M372 193v22l51 25',
]
export default function RenderFigure() {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const canvas = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (paused || reduced) canvas.current?.pauseAnimations?.()
    else canvas.current?.unpauseAnimations?.()
  }, [paused, reduced])
  const replay = () => {
    canvas.current?.setCurrentTime?.(0)
    setPaused(false)
  }
  return (
    <figure className="render-figure">
      <div className="figure-bar">
        <span>
          <i className="live-dot" /> COMPONENT TREE
        </span>
        <span>FIG. 01</span>
      </div>
      <div className="figure-field">
        <svg
          ref={canvas}
          role="img"
          aria-label="App passes props to State and View. State has two children and View has one."
          viewBox="24 0 500 289"
          className="hero-diagram"
        >
          <defs>
            <pattern id="grid-lines" width="42" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M0 0 42 20M42 0 0 20"
                fill="none"
                stroke="#787767"
                strokeWidth=".55"
                opacity=".25"
              />
            </pattern>
            <radialGradient id="grid-mask">
              <stop offset=".4" stopColor="white" />
              <stop offset="1" stopColor="black" />
            </radialGradient>
            <mask id="floor-mask">
              <ellipse cx="272" cy="195" rx="269" ry="122" fill="url(#grid-mask)" />
            </mask>
          </defs>
          <path d="M0 0h550v300H0z" fill="url(#grid-lines)" mask="url(#floor-mask)" />
          <g stroke="#57594e" fill="none" strokeWidth="2" strokeLinejoin="round">
            {paths.map((p) => (
              <path key={p} d={p} />
            ))}
          </g>
          {!reduced && (
            <g fill="#7954ba">
              {paths.map((p, i) => (
                <circle key={p} r="3.5">
                  <animateMotion
                    path={p}
                    dur="3.4s"
                    begin={i < 2 ? '0s' : '1.2s'}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
          <g fill="none" stroke="#767969" strokeWidth="1.1" strokeDasharray="3 3">
            <path d="M317 62h34l15-16h14" />
            <path d="M136 163h-17l-13-12H86" />
            <path d="M407 165h17l14-16h12" />
          </g>
          <Tile x={272} y={79} w={72} h={10} p="violet" />
          <Tile x={272} y={65} w={72} h={11} p="violet" />
          <Tile x={272} y={52} w={72} h={11} p="violet">
            <Atom radius={38} />
          </Tile>
          <Tile x={174} y={168} w={48} h={18} p="mint">
            <text
              fill="#354f40"
              stroke="none"
              fontFamily="var(--mono)"
              textAnchor="middle"
              y="9"
              fontSize="30"
              fontWeight="bold"
            >
              {'{ }'}
            </text>
          </Tile>
          <Tile x={372} y={168} w={48} h={18} p="orange">
            <text
              fill="#60412f"
              stroke="none"
              fontFamily="var(--mono)"
              textAnchor="middle"
              y="8"
              fontSize="25"
              fontWeight="bold"
            >
              {'</>'}
            </text>
          </Tile>
          <Tile x={114} y={242} w={27} h={11} p="mint" />
          <Tile x={234} y={242} w={27} h={11} p="mint" />
          <Tile x={427} y={242} w={27} h={11} p="orange" />
          <Tag x={407} y={46} text="&lt;App /&gt;" />
          <Tag x={73} y={149} text="state" />
          <Tag x={467} y={146} text="view" />
          <g fill="#716f65" fontFamily="var(--mono)" fontSize="10">
            <text x="191" y="123" transform="rotate(-26 191 123)">
              props
            </text>
            <text x="297" y="111" transform="rotate(26 297 111)">
              props
            </text>
          </g>
        </svg>
      </div>
      <figcaption>
        <span>
          <Radio size={15} />
          Props flow from parent to child
        </span>
        {!reduced && (
          <div>
            <button
              onClick={() => setPaused(!paused)}
              aria-label={paused ? 'Resume diagram' : 'Pause diagram'}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
            </button>
            <button aria-label="Replay diagram" onClick={replay}>
              <RotateCcw size={13} />
            </button>
          </div>
        )}
      </figcaption>
    </figure>
  )
}
