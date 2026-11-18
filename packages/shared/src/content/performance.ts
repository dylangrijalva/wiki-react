import type { Lesson } from '../types.js'
import { node, step } from './scene.js'

export const performance: Lesson[] = [
  {
    slug: 'component-rerenders',
    trackId: 'performance',
    title: 'Understanding re-renders',
    mode: 'tree',
    objective: 'Distinguish component calls from visible DOM changes when a mixer meter updates.',
    steps: [
      step(
        'Map the tree',
        'Mixer currently owns the signal level. It renders a level meter and an unrelated song title as children.',
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
        'Schedule an update',
        'A new reading arrives. Updating the level asks React to render Mixer with its next snapshot.',
        'setLevel(7);',
        [node('input', 'Reading', 'added', '7'), node('m', 'Mixer', 'active', 'level = 7')],
        [['input', 'm']],
      ),
      step(
        'Follow ordinary children',
        'In this example neither child is memoized. Calling Mixer returns new child elements and React normally calls both child functions as part of this render.',
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
        'Find the DOM edit',
        'Meter describes a new value. SongTitle produces identical output, so its DOM can stay as it was even though the function ran.',
        '<meter min={0} max={10} value={level} />',
        [
          node('meter', 'Meter DOM', 'active', 'value = 7'),
          node('title', 'Title DOM', 'kept', 'same text'),
        ],
      ),
      step(
        'Move the owner',
        'If only Meter needs level, move the state and sensor subscription into Meter. The next reading can start rendering there without calling Mixer for this update.',
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
    pitfall: 'Counting DOM mutations misses work spent computing identical output.',
    practice:
      'Start by locating state near its consumers. Use React DevTools Profiler to investigate slow interactions before changing component boundaries.',
    recap:
      'State ownership sets the starting point for an update. React can call components whose existing DOM remains valid.',
    source: 'https://react.dev/learn/render-and-commit',
    quiz: {
      question: 'A child function ran. What can you conclude about its DOM?',
      options: [
        'It was replaced',
        'Its output was computed, and the DOM may be unchanged',
        'Every sibling was removed',
      ],
      answer: 1,
      explanation: 'React compares the output before committing any required DOM changes.',
    },
  },
  {
    slug: 'memoization',
    trackId: 'performance',
    title: 'When memoization helps',
    mode: 'compare',
    objective: 'Predict when an expensive spectrum chart can reuse work after a theme update.',
    steps: [
      step(
        'Choose an interaction',
        'A theme toggle renders the page again. Its Spectrum child computes frequency bins from an unchanged sample array. The diagram counts simulated chart calculations. Use a profiler for actual durations.',
        'function Spectrum({ samples }: { samples: number[] }) {\n  return <Bars values={computeBins(samples)} />;\n}',
        [
          node('page', 'Page', 'active', 'theme change'),
          node('chart', 'Spectrum', 'active', 'compute bins'),
        ],
        [['page', 'chart']],
      ),
      step(
        'Add a memo boundary',
        'Wrap Spectrum once at module scope. For a parent update, React normally skips the wrapped component when every prop compares equal with Object.is.',
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
        'Reuse the input',
        'Toggling theme leaves the original sample array intact. Here Spectrum reads neither theme context nor its own changed state, so its computation can be skipped.',
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
        'Break the comparison',
        'Spreading the samples creates a new array. Its contents match, but its reference differs and the default prop comparison sees a change.',
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
        'Measure the actual cost',
        'A genuinely changed recording should recompute. Compare the slow interaction on representative hardware with the Profiler. Compare commits with and without the optimization. React Compiler can also supply memoization in compiled code.',
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
      'A custom equality function that ignores a changed callback can leave a handler reading stale values.',
    practice:
      'Prefer stable, minimal props. The cost of comparing props should be worth the work you expect to avoid.',
    recap:
      'memo is a performance optimization. Own state, consumed context, or changed props can still cause a render.',
    source: 'https://react.dev/reference/react/memo',
    quiz: {
      question: 'Which prop value can defeat the default memo comparison on every parent render?',
      options: ['An unchanged string', 'The original sample array', 'A newly spread sample array'],
      answer: 2,
      explanation: 'Object.is distinguishes two array objects even if their elements are equal.',
    },
  },
  {
    slug: 'lazy-loading',
    trackId: 'performance',
    title: 'Code splitting and lazy loading',
    mode: 'timeline',
    objective: 'Defer an optional score editor and keep the transport usable while its code loads.',
    steps: [
      step(
        'Draw the split',
        'The player is used immediately. The score editor is opened on demand, which makes it a candidate for a separate bundle chunk.',
        'const ScoreEditor = lazy(() => import("./ScoreEditor"));',
        [
          node('initial', 'Player', 'kept', 'entry chunk'),
          node('editor', 'Editor', 'idle', 'separate chunk'),
        ],
      ),
      step(
        'Request the component',
        'React first calls the lazy loader when it tries to render ScoreEditor. Declare it at module scope so the component identity survives parent renders.',
        '{editing && <ScoreEditor />}',
        [
          node('open', 'Edit score', 'active'),
          node('editor', 'Editor', 'active', 'request module'),
        ],
        [['open', 'editor']],
      ),
      step(
        'Show local feedback',
        'While the import is pending, the nearest Suspense boundary can show its fallback. Transport outside that boundary stays available.',
        '<>\n  <Transport />\n  <Suspense fallback={<EditorSkeleton />}>\n    {editing && <ScoreEditor />}\n  </Suspense>\n</>',
        [
          node('transport', 'Transport', 'kept'),
          node('boundary', 'Suspense', 'active'),
          node('fallback', 'Editor shell', 'added'),
        ],
        [['boundary', 'fallback']],
      ),
      step(
        'Reveal the editor',
        'When the module resolves, React can render its default export. The boundary replaces the placeholder with the editor.',
        'export default function ScoreEditor() {\n  return <ScoreCanvas />;\n}',
        [
          node('boundary', 'Suspense', 'kept'),
          node('fallback', 'Editor shell', 'removed'),
          node('editor', 'Editor', 'added', 'ready'),
        ],
        [['boundary', 'editor']],
      ),
      step(
        'Handle a failed import',
        'A rejected import reaches an error boundary. Offer a recovery that can load the current assets, such as reloading the page after an outdated deployment.',
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
      'Declaring lazy inside another component can reset local state by creating a different component type.',
    practice:
      'Split at user-visible boundaries. Too many tiny chunks introduce request overhead and additional loading states.',
    recap:
      'lazy defers module loading to first use. Suspense handles the wait, and an error boundary handles a rejected import.',
    source: 'https://react.dev/reference/react/lazy',
    quiz: {
      question: 'Where should the lazy component declaration live?',
      options: ['At module scope', 'Inside every render', 'Inside the fallback'],
      answer: 0,
      explanation:
        'A module-level declaration preserves the component identity across parent renders.',
    },
  },
  {
    slug: 'list-virtualization',
    trackId: 'performance',
    title: 'Virtualizing long lists',
    mode: 'window',
    objective: 'Calculate which clip rows a fixed-height scrolling window needs to mount.',
    steps: [
      step(
        'Estimate the full height',
        'A catalogue has 10,000 rows of 32 pixels each. A spacer reserves their combined height so the scroll bar reflects the full collection.',
        'const rowHeight = 32;\nconst fullHeight = clips.length * rowHeight;',
        [node('all', '10,000 rows', 'kept'), node('space', 'Spacer', 'active', '320,000 px')],
        [['all', 'space']],
      ),
      step(
        'Locate the first visible row',
        'With a scroll offset of 320 pixels, the first visible item has zero-based index 10. This arithmetic assumes equal row heights.',
        'const first = Math.floor(scrollTop / rowHeight);',
        [
          node('offset', 'Scroll top', 'active', '320 px'),
          node('first', 'Row 10', 'added', 'first visible'),
        ],
        [['offset', 'first']],
      ),
      step(
        'Include the viewport',
        'A 96-pixel viewport at this exact offset contains indices 10 through 12. Rounding the exclusive end upward includes a partially visible last row at other offsets.',
        'const end = Math.min(clips.length,\n  Math.ceil((scrollTop + viewportHeight) / rowHeight));',
        [
          node('r10', 'Row 10', 'active'),
          node('r11', 'Row 11', 'active'),
          node('r12', 'Row 12', 'active'),
        ],
      ),
      step(
        'Add overscan',
        'Render a small buffer before and after the visible rows. This reduces empty flashes during a scroll at the cost of mounting a few extra rows.',
        'const from = Math.max(0, first - 1);\nconst to = Math.min(clips.length, end + 1);',
        [
          node('r9', 'Row 9', 'added', 'buffer'),
          node('view', 'Rows 10–12', 'active', 'visible'),
          node('r13', 'Row 13', 'added', 'buffer'),
        ],
      ),
      step(
        'Position the window',
        'Place the rendered slice at its offset inside the full-height spacer. Preserve a durable key for each clip. Store editable drafts outside rows that may unmount.',
        '<div style={{ height: fullHeight }}>\n  <div style={{ transform: `translateY(${from * rowHeight}px)` }}>\n    {clips.slice(from, to).map(c => (\n      <div key={c.id} style={{ height: rowHeight }}><Row clip={c} /></div>\n    ))}\n  </div>\n</div>',
        [
          node('r9', 'Row 9', 'removed', 'scrolled away'),
          node('r10', 'Row 10', 'kept', 'upper buffer'),
          node('view', 'Rows 11–13', 'active', 'next viewport'),
          node('r14', 'Row 14', 'added', 'lower buffer'),
        ],
      ),
    ],
    pitfall: 'Assuming a fixed height when titles wrap makes the computed offsets drift.',
    practice:
      'Use measurement for variable-height rows. Plan keyboard focus, browser find, and assistive navigation before virtualizing interactive lists.',
    recap:
      'Virtualization keeps a full scroll range but mounts a moving slice. Overscan trades extra DOM work for smoother scrolling.',
    source: 'https://tanstack.com/virtual/latest/docs/api/virtualizer',
    quiz: {
      question: 'With 32-pixel rows, which zero-based row starts at scroll offset 320?',
      options: ['9', '10', '32'],
      answer: 1,
      explanation: '320 divided by the fixed row height of 32 gives index 10.',
    },
  },
]
