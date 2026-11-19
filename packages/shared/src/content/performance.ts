import type { Lesson } from '../types.js'
import { node, step } from './scene.js'

export const performance: Lesson[] = [
  {
    slug: 'component-rerenders',
    trackId: 'performance',
    title: 'Understanding re-renders',
    mode: 'tree',
    objective:
      'Trace a new meter reading through Mixer and see which component functions run before React updates the DOM.',
    steps: [
      step(
        'Find the level state',
        'Mixer stores the signal level and passes it to Meter. Its other child, SongTitle, has no use for the reading.',
        'function Mixer() {\n  const [level, setLevel] = useState(0);\n  return <><Meter level={level} /><SongTitle /></>;\n}',
        [
          node('m', 'Mixer', 'kept', 'level = 0'),
          node('meter', 'Meter'),
          node('title', 'SongTitle'),
        ],
        [
          ['m', 'meter'],
          ['m', 'title'],
        ],
      ),
      step(
        'Receive the next reading',
        'The sensor reports 7. Calling setLevel(7) asks React to render Mixer again with 7 as its level.',
        'setLevel(7);',
        [node('input', 'Reading', 'added', '7'), node('m', 'Mixer', 'active', 'level = 7')],
        [['input', 'm']],
      ),
      step(
        'Follow the child renders',
        'Mixer returns new elements for Meter and SongTitle. Neither child uses memo here, so React normally calls both functions on this render.',
        '<>\n  <Meter level={7} />\n  <SongTitle />\n</>',
        [
          node('m', 'Mixer', 'active'),
          node('meter', 'Meter', 'active', 'called'),
          node('title', 'SongTitle', 'active', 'called'),
        ],
        [
          ['m', 'meter'],
          ['m', 'title'],
        ],
      ),
      step(
        'Check what reaches the DOM',
        'Meter now returns a meter value of 7. SongTitle ran too, but it returned the same title, so React can keep the existing title DOM.',
        '<meter min={0} max={10} value={level} />',
        [
          node('meter', 'Meter DOM', 'active', 'value = 7'),
          node('title', 'Title DOM', 'kept', 'same text'),
        ],
      ),
      step(
        'Move the sensor into Meter',
        'Only Meter needs the reading. If it owns the subscription and the level state, React can start the next update at Meter and leave Mixer out of it.',
        'function Meter() {\n  const level = useSignalLevel();\n  return <meter min={0} max={10} value={level} />;\n}',
        [
          node('m', 'Mixer', 'kept'),
          node('meter', 'Meter', 'active', 'owns level'),
          node('title', 'SongTitle', 'kept'),
        ],
        [
          ['m', 'meter'],
          ['m', 'title'],
        ],
      ),
    ],
    pitfall:
      'A DOM observer sees the meter change. It misses the work SongTitle did to produce the same title.',
    practice:
      'Keep the level state near the component that uses it. If an interaction feels slow, record it in the React DevTools Profiler before moving more state.',
    recap:
      'Where you store the reading determines where React starts this update. A component can run again and still return output that fits the existing DOM.',
    source: 'https://react.dev/learn/render-and-commit',
    quiz: {
      question:
        'SongTitle ran during the meter update. What does that tell you about the title in the DOM?',
      options: [
        'React replaced the title element',
        'React computed the title again. Its DOM may be unchanged.',
        'React removed every sibling of the title',
      ],
      answer: 1,
      explanation:
        'React compares the new output with the previous output. Matching title text can stay in place even though SongTitle ran.',
    },
  },
  {
    slug: 'memoization',
    trackId: 'performance',
    title: 'When memoization helps',
    mode: 'compare',
    objective:
      'Find out whether Spectrum needs to calculate its frequency bins again when someone changes the theme.',
    steps: [
      step(
        'Toggle the theme',
        'The page renders again when the theme changes. Spectrum gets the same sample array as before and calculates its frequency bins again. The diagram counts simulated calculations. A profiler can tell you how long a real one takes.',
        'function Spectrum({ samples }: { samples: number[] }) {\n  return <Bars values={computeBins(samples)} />;\n}',
        [
          node('page', 'Page', 'active', 'theme change'),
          node('chart', 'Spectrum', 'active', 'compute bins'),
        ],
        [['page', 'chart']],
      ),
      step(
        'Wrap Spectrum in memo',
        'Create StableSpectrum once, outside the page component. On a parent update, React can skip Spectrum if Object.is considers each prop equal to its previous value.',
        'const StableSpectrum = memo(Spectrum);',
        [
          node('page', 'Page', 'active'),
          node('gate', 'memo', 'added', 'compare props'),
          node('chart', 'Spectrum', 'idle'),
        ],
        [
          ['page', 'gate'],
          ['gate', 'chart'],
        ],
      ),
      step(
        'Pass the same samples',
        'The theme toggle leaves recording.samples pointing to the original array. Spectrum doesn’t read the theme context, and its own state hasn’t changed. React can reuse its last result.',
        '<StableSpectrum samples={recording.samples} />',
        [
          node('page', 'Page', 'active'),
          node('gate', 'Same array', 'kept', 'equal'),
          node('chart', 'Spectrum', 'kept', 'work skipped'),
        ],
        [
          ['page', 'gate'],
          ['gate', 'chart'],
        ],
      ),
      step(
        'Try a copy of the array',
        'Spreading recording.samples creates a separate array on every render. Object.is sees two different arrays even though they contain the same samples.',
        '<StableSpectrum samples={[...recording.samples]} />',
        [
          node('page', 'Page', 'active'),
          node('gate', 'New array', 'active', 'different'),
          node('chart', 'Spectrum', 'active', 'compute bins'),
        ],
        [
          ['page', 'gate'],
          ['gate', 'chart'],
        ],
      ),
      step(
        'Time the chart',
        'A different recording needs new frequency bins. On hardware your listeners might use, profile the same slow interaction with and without memo and compare the render times across commits. React Compiler can also memoize components when it compiles them.',
        '<Profiler id="Spectrum" onRender={recordDuration}>\n  <StableSpectrum samples={recording.samples} />\n</Profiler>',
        [
          node('input', 'Recording', 'added', 'new samples'),
          node('chart', 'Spectrum', 'active', 'compute bins'),
          node('result', 'Profiler', 'active', 'observed cost'),
        ],
        [
          ['input', 'chart'],
          ['chart', 'result'],
        ],
      ),
    ],
    pitfall:
      'If a custom prop comparison ignores a new callback, the chart can keep calling an old one that reads stale values.',
    practice:
      'Pass only the props the chart needs, and keep their references stable when the values stay the same. Comparing them should cost less than rendering the chart.',
    recap:
      'memo can save a render triggered by a parent. Spectrum can still render for a new prop, a change to its own state, or an update to context it reads.',
    source: 'https://react.dev/reference/react/memo',
    quiz: {
      question: 'Which prop value will look different to memo each time the parent renders?',
      options: [
        'The same string value',
        'The original sample array',
        'A fresh copy made with [...recording.samples]',
      ],
      answer: 2,
      explanation:
        'Each spread creates a new array. Object.is compares the two array references, even when every sample matches.',
    },
  },
  {
    slug: 'lazy-loading',
    trackId: 'performance',
    title: 'Code splitting and lazy loading',
    mode: 'timeline',
    objective:
      'Load the score editor when a listener opens it, and keep the playback controls usable while they wait.',
    steps: [
      step(
        'Split out the score editor',
        'Every listener needs the player at startup. Only someone who opens the score editor needs its code, so it can go in a separate bundle chunk.',
        'const ScoreEditor = lazy(() => import("./ScoreEditor"));',
        [
          node('initial', 'Player', 'kept', 'entry chunk'),
          node('editor', 'Editor', 'idle', 'separate chunk'),
        ],
      ),
      step(
        'Open the score editor',
        'React calls the loader the first time it tries to render ScoreEditor. Declare the lazy component at module scope so each parent render refers to the same component type.',
        '{editing && <ScoreEditor />}',
        [
          node('open', 'Edit score', 'active'),
          node('editor', 'Editor', 'active', 'request module'),
        ],
        [['open', 'editor']],
      ),
      step(
        'Keep playback available',
        'While the import is pending, the nearest Suspense boundary can show EditorSkeleton. Transport sits outside the boundary, so the listener can still use the playback controls.',
        '<>\n  <Transport />\n  <Suspense fallback={<EditorSkeleton />}>\n    {editing && <ScoreEditor />}\n  </Suspense>\n</>',
        [
          node('transport', 'Transport', 'kept'),
          node('boundary', 'Suspense', 'active'),
          node('fallback', 'Editor shell', 'added'),
        ],
        [['boundary', 'fallback']],
      ),
      step(
        'Replace the skeleton',
        'Once the module loads, React can render its default export, ScoreEditor. The editor takes the place of the skeleton.',
        'export default function ScoreEditor() {\n  return <ScoreCanvas />;\n}',
        [
          node('boundary', 'Suspense', 'kept'),
          node('fallback', 'Editor shell', 'removed'),
          node('editor', 'Editor', 'added', 'ready'),
        ],
        [['boundary', 'editor']],
      ),
      step(
        'Recover from a missing chunk',
        'If the import rejects, React passes the error to the nearest error boundary. A tab left open during a deployment might still request an old chunk. A Reload button lets the listener fetch the current app.',
        '<EditorErrorBoundary>\n  <Suspense fallback={<EditorSkeleton />}><ScoreEditor /></Suspense>\n</EditorErrorBoundary>',
        [
          node('error', 'Import', 'removed', 'rejected'),
          node('boundary', 'Boundary', 'active'),
          node('retry', 'Reload', 'added'),
        ],
        [
          ['error', 'boundary'],
          ['boundary', 'retry'],
        ],
      ),
    ],
    pitfall:
      'Calling lazy inside a parent component creates a new component type on each render. The editor can lose its local state.',
    practice:
      'An optional editor makes a useful split point. Dividing it into many tiny chunks adds requests and can leave listeners waiting for one piece after another.',
    recap:
      'Opening the editor triggers its first import. Suspense can show a skeleton while the import is pending. If the import rejects, the error boundary can offer a reload.',
    source: 'https://react.dev/reference/react/lazy',
    quiz: {
      question: 'Where should the lazy component declaration live?',
      options: ['At module scope', 'Inside every render', 'Inside the fallback'],
      answer: 0,
      explanation:
        'At module scope, ScoreEditor keeps the same component identity when its parent renders again.',
    },
  },
  {
    slug: 'list-virtualization',
    trackId: 'performance',
    title: 'Virtualizing long lists',
    mode: 'window',
    objective:
      'Calculate which clip rows to mount as a listener scrolls through a library of 10,000 clips.',
    steps: [
      step(
        'Reserve the full scroll height',
        'Each of the 10,000 rows is 32 pixels tall. A 320,000-pixel spacer gives the scrollbar the right range even when only a few rows are mounted.',
        'const rowHeight = 32;\nconst fullHeight = clips.length * rowHeight;',
        [node('all', '10,000 rows', 'kept'), node('space', 'Spacer', 'active', '320,000 px')],
        [['all', 'space']],
      ),
      step(
        'Find the first visible row',
        'Scroll down 320 pixels and row 10 reaches the top. Row numbers start at zero, and every row has the same height, so divide the offset by 32 and round down.',
        'const first = Math.floor(scrollTop / rowHeight);',
        [
          node('offset', 'Scroll top', 'active', '320 px'),
          node('first', 'Row 10', 'added', 'first visible'),
        ],
        [['offset', 'first']],
      ),
      step(
        'Find the end of the window',
        'At that offset a 96-pixel viewport fits rows 10 through 12 exactly. At other offsets, part of the next row may show. Round up to get the first index to leave out of the slice.',
        'const end = Math.min(clips.length,\n  Math.ceil((scrollTop + viewportHeight) / rowHeight));',
        [
          node('r10', 'Row 10', 'active'),
          node('r11', 'Row 11', 'active'),
          node('r12', 'Row 12', 'active'),
        ],
      ),
      step(
        'Give scrolling a buffer',
        'Mount one extra row on either side of the viewport. This buffer, called overscan, costs two extra rows here and reduces blank flashes as the listener scrolls.',
        'const from = Math.max(0, first - 1);\nconst to = Math.min(clips.length, end + 1);',
        [
          node('r9', 'Row 9', 'added', 'buffer'),
          node('view', 'Rows 10 to 12', 'active', 'visible'),
          node('r13', 'Row 13', 'added', 'buffer'),
        ],
      ),
      step(
        'Position the mounted rows',
        'Move the slice down inside the spacer by the height of the rows before it. Use the clip ID as each key. A row can unmount when it scrolls away, so keep any drafts you need to preserve outside the row.',
        '<div style={{ height: fullHeight }}>\n  <div style={{ transform: `translateY(${from * rowHeight}px)` }}>\n    {clips.slice(from, to).map(c => (\n      <div key={c.id} style={{ height: rowHeight }}><Row clip={c} /></div>\n    ))}\n  </div>\n</div>',
        [
          node('r9', 'Row 9', 'removed', 'scrolled away'),
          node('r10', 'Row 10', 'kept', 'upper buffer'),
          node('view', 'Rows 11 to 13', 'active', 'next viewport'),
          node('r14', 'Row 14', 'added', 'lower buffer'),
        ],
      ),
    ],
    pitfall:
      'If a long title wraps onto a second line, the fixed-height calculation puts later rows at the wrong offset.',
    practice:
      'Measure rows whose heights can vary. Before virtualizing an interactive list, check what happens to keyboard focus, browser Find, and screen reader navigation when a row leaves the DOM.',
    recap:
      'The spacer keeps the scrollbar sized for the whole library. As it scrolls, the list mounts the visible rows plus a few neighbors to make scrolling smoother.',
    source: 'https://tanstack.com/virtual/latest/docs/api/virtualizer',
    quiz: {
      question: 'Rows are 32 pixels tall and numbered from zero. Which row starts 320 pixels down?',
      options: ['9', '10', '32'],
      answer: 1,
      explanation: 'Ten rows fit in the first 320 pixels. Row 10 starts just below them.',
    },
  },
]
