import { useState } from 'react'
import { Lab, node } from './Lab'
export default function Performance() {
  const [memo, setMemo] = useState(false)
  const [run, setRun] = useState({
    parent: 0,
    chart: 0,
    samples: 1,
    rendered: false,
    why: 'Choose a change and compare the render counts.',
  })
  function render(samplesChanged: boolean) {
    const renders = samplesChanged || !memo
    setRun((last) => ({
      parent: last.parent + 1,
      chart: last.chart + Number(renders),
      rendered: renders,
      samples: last.samples + Number(samplesChanged),
      why: samplesChanged
        ? 'New samples change the chart prop, so Spectrum renders.'
        : memo
          ? 'The sample reference stayed equal. This model skips the chart render.'
          : 'A parent theme change renders this ordinary child with the same samples.',
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
                why: 'Counters reset for the new comparison.',
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
        ' Counts model updates after mount. Use the React Profiler to measure a real chart.'
      }
    />
  )
}
