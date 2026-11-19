import { useState } from 'react'
import { Lab, node } from './Lab'
export default function Performance() {
  const [memo, setMemo] = useState(false)
  const [run, setRun] = useState({
    parent: 0,
    chart: 0,
    samples: 1,
    rendered: false,
    why: 'Change the theme, then turn on memo and change it again. Watch the Spectrum counter.',
  })
  function render(samplesChanged: boolean) {
    const renders = samplesChanged || !memo
    setRun((last) => ({
      parent: last.parent + 1,
      chart: last.chart + Number(renders),
      rendered: renders,
      samples: last.samples + Number(samplesChanged),
      why: samplesChanged
        ? 'Spectrum gets a new samples array, so it renders again.'
        : memo
          ? 'Only the theme changed. Spectrum gets the same samples array, so memo skips this render.'
          : 'The theme change renders Editor again. With memo off, Spectrum renders too, even with the same samples.',
    }))
  }
  return (
    <Lab
      title="Compare a memoized chart"
      mode="tree"
      scene={{
        nodes: [
          node('panel', 'Editor', `${run.parent} updates`, 'active'),
          node(
            'list',
            memo ? 'memo(Spectrum)' : 'Spectrum',
            `${run.chart} render ${run.chart === 1 ? 'call' : 'calls'}`,
            run.rendered ? 'active' : 'kept',
          ),
          node('samples', 'Samples', `buffer ${run.samples}`, 'idle'),
        ],
        edges: [
          ['panel', 'list'],
          ['samples', 'list'],
        ],
      }}
      controls={
        <>
          <button
            aria-pressed={memo}
            onClick={() => {
              setMemo(!memo)
              setRun({
                parent: 0,
                chart: 0,
                samples: 1,
                rendered: false,
                why: 'Both counters start at zero. Change the theme to see which components render.',
              })
            }}
          >
            Memo {memo ? 'on' : 'off'}
          </button>
          <button onClick={() => render(false)}>Change theme</button>
          <button onClick={() => render(true)}>New samples</button>
        </>
      }
      result={
        run.why +
        ' These counts simulate renders after mount. Use the React Profiler to measure rendering time in your app.'
      }
    />
  )
}
