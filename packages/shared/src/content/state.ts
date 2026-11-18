import type { Lesson } from '../types.js'
import { node, step } from './scene.js'

export const state: Lesson[] = [
  {
    slug: 'component-state',
    trackId: 'state',
    title: 'Understanding component state',
    mode: 'timeline',
    objective: 'Predict the gain after two queued increments in the same click handler.',
    steps: [
      step(
        'Store the gain',
        'A local variable would start over on each call. useState asks React to retain the gain for this fader’s position in the tree.',
        'const [gain, setGain] = useState(2);',
        [node('state', 'Stored gain', 'active', '2'), node('view', 'Fader', 'kept', '2')],
        [['state', 'view']],
      ),
      step(
        'Capture the snapshot',
        'The handler created during this render reads gain as 2. Calling its setter schedules work for another render.',
        'function bump() {\n  setGain(gain + 1);\n  console.log(gain); // 2\n}',
        [
          node('view', 'Fader', 'kept', '2'),
          node('event', 'Handler', 'active', 'reads 2'),
          node('q', 'Queue', 'added', 'replace with 3'),
        ],
        [
          ['view', 'event'],
          ['event', 'q'],
        ],
      ),
      step(
        'Queue two replacements',
        'Both expressions use the same snapshot. React processes two requests to replace the gain with 3, giving a final value of 3.',
        'setGain(gain + 1);\nsetGain(gain + 1);',
        [
          node('event', 'Snapshot', 'kept', '2'),
          node('q1', 'Replace', 'active', '3'),
          node('q2', 'Replace', 'active', '3'),
        ],
        [
          ['event', 'q1'],
          ['q1', 'q2'],
        ],
      ),
      step(
        'Queue two updaters',
        'Start from 2 again. Each updater receives the pending value produced by the previous one, so the queue computes 3 and then 4.',
        'setGain(value => value + 1);\nsetGain(value => value + 1);',
        [
          node('start', 'Initial', 'kept', '2'),
          node('q1', 'Updater', 'active', '2 → 3'),
          node('q2', 'Updater', 'active', '3 → 4'),
        ],
        [
          ['start', 'q1'],
          ['q1', 'q2'],
        ],
      ),
      step(
        'Display the next snapshot',
        'React processes the event’s batched updates and gives the next render a gain of 4. That render creates a new handler with the new snapshot.',
        '<output>{gain} dB</output>',
        [node('state', 'Stored gain', 'active', '4'), node('view', 'Fader', 'added', '4 dB')],
        [['state', 'view']],
      ),
    ],
    pitfall: 'Calling the setter twice with gain + 1 can enqueue the same replacement twice.',
    practice:
      'Pass the next value when you already know it. Pass a pure updater when it depends on pending state.',
    recap:
      'State survives renders. Each render sees a snapshot, and updater functions compose in queue order.',
    source: 'https://react.dev/learn/queueing-a-series-of-state-updates',
    quiz: {
      question: 'Starting at 2, what do two setGain(g => g + 1) calls in one click produce?',
      options: ['2', '3', '4'],
      answer: 2,
      explanation: 'The second updater receives 3 from the first and returns 4.',
    },
  },
  {
    slug: 'lifting-state-up',
    trackId: 'state',
    title: 'Lifting state up',
    mode: 'tree',
    objective: 'Coordinate two solo buttons so only one channel can be soloed at a time.',
    steps: [
      step(
        'Spot the conflicting state',
        'Drums and Bass each own a solo flag. Both can become true, even though this mixer allows only one solo channel.',
        'const [solo, setSolo] = useState(false);',
        [
          node('desk', 'Mixer'),
          node('drums', 'Drums', 'active', 'solo = true'),
          node('bass', 'Bass', 'active', 'solo = true'),
        ],
        [
          ['desk', 'drums'],
          ['desk', 'bass'],
        ],
      ),
      step(
        'Choose the owner',
        'Mixer is the nearest component containing both channels. One nullable ID represents every valid selection.',
        'const [soloId, setSoloId] = useState<string | null>(null);',
        [
          node('desk', 'Mixer', 'active', 'soloId = null'),
          node('drums', 'Drums'),
          node('bass', 'Bass'),
        ],
        [
          ['desk', 'drums'],
          ['desk', 'bass'],
        ],
      ),
      step(
        'Send values down',
        'Each row receives a boolean computed from the same selection. Neither row needs a separate copy of the selected ID.',
        '<Channel solo={soloId === "drums"} onSolo={() => setSoloId("drums")} />',
        [
          node('desk', 'Mixer', 'kept', 'soloId = null'),
          node('drums', 'Drums', 'kept', 'false'),
          node('bass', 'Bass', 'kept', 'false'),
        ],
        [
          ['desk', 'drums'],
          ['desk', 'bass'],
        ],
      ),
      step(
        'Request a change',
        'Activate Bass. Its child calls the callback supplied by Mixer. That callback updates the parent’s selection.',
        '<button type="button" aria-pressed={solo} onClick={onSolo}>\n  Solo\n</button>',
        [
          node('bass', 'Bass', 'active', 'click'),
          node('event', 'onSolo', 'added'),
          node('desk', 'Mixer', 'active', 'soloId = bass'),
        ],
        [
          ['bass', 'event'],
          ['event', 'desk'],
        ],
      ),
      step(
        'Read the new selection',
        'Mixer renders with the new ID. In this unoptimized tree both channel functions run, and the DOM needs to change only where their output differs.',
        '<Channel solo={soloId === "bass"} onSolo={() => setSoloId("bass")} />',
        [
          node('desk', 'Mixer', 'active', 'soloId = bass'),
          node('drums', 'Drums', 'kept', 'pressed: false'),
          node('bass', 'Bass', 'active', 'pressed: true'),
        ],
        [
          ['desk', 'drums'],
          ['desk', 'bass'],
        ],
      ),
    ],
    pitfall: 'Two booleans allow a state the mixer cannot display correctly.',
    practice:
      'Lift only the shared decision. A channel’s private input draft can still live inside that channel.',
    recap:
      'The parent owns the choice, props describe it, and child callbacks request a new choice.',
    source: 'https://react.dev/learn/sharing-state-between-components',
    quiz: {
      question: 'Where should the exclusive solo ID live?',
      options: [
        'In both channel rows',
        'In their common mixer',
        'In a global store for every mixer',
      ],
      answer: 1,
      explanation:
        'The mixer can coordinate both controls without coupling independent mixer instances.',
    },
  },
  {
    slug: 'deriving-state',
    trackId: 'state',
    title: 'Derived state vs. duplicated state',
    mode: 'flow',
    objective: 'Keep a selection accurate when the underlying clip is renamed or removed.',
    steps: [
      step(
        'Find the duplicate',
        'The clip appears once in the collection and again in selectedClip. An immutable edit to the collection can leave the separate selected object behind.',
        'const [selectedClip, setSelectedClip] = useState(clips[0]);',
        [node('list', 'Clips', 'kept', 'Rain'), node('selected', 'Selection', 'active', 'Rain')],
      ),
      step(
        'Rename the record',
        'Updating a clip by ID creates a new object. The selection still points at the old object and the detail panel shows the old name.',
        'setClips(rows => rows.map(c =>\n  c.id === id ? { ...c, title: "Drizzle" } : c));',
        [
          node('list', 'Clips', 'active', 'Drizzle'),
          node('selected', 'Selection', 'removed', 'Rain'),
        ],
      ),
      step(
        'Store the identifier',
        'Selection is the fact the user chooses. Keep its ID and let the collection own the title.',
        'const [selectedId, select] = useState<string | null>(null);',
        [node('list', 'Clips', 'kept', 'r: Drizzle'), node('id', 'Selected ID', 'added', 'r')],
      ),
      step(
        'Look up during render',
        'Read the current clip from the current array. Both the list row and detail panel now see the same title after an edit.',
        'const selected = clips.find(c => c.id === selectedId);',
        [
          node('list', 'Clips', 'kept'),
          node('id', 'Selected ID', 'kept', 'r'),
          node('detail', 'Detail', 'active', 'Drizzle'),
        ],
        [
          ['list', 'detail'],
          ['id', 'detail'],
        ],
      ),
      step(
        'Handle disappearance',
        'If the chosen ID disappears, find returns undefined. Render the empty detail state directly. Decide separately whether undo should restore the old selection.',
        'return selected ? <Details clip={selected} /> : <ChooseClip />;',
        [
          node('list', 'Clips', 'active', 'r removed'),
          node('id', 'Selected ID', 'kept', 'r'),
          node('detail', 'Choose a clip', 'added'),
        ],
        [
          ['list', 'detail'],
          ['id', 'detail'],
        ],
      ),
    ],
    pitfall:
      'An Effect to copy new props into selection adds another update and can erase a user choice.',
    practice:
      'Derive read-only display values during render. Store a separate draft only when it intentionally diverges from its source.',
    recap:
      'Keep the minimum independent facts. Calculate the selected object from its ID and the current collection.',
    source: 'https://react.dev/learn/choosing-the-state-structure',
    quiz: {
      question: 'Which value deserves independent state in the clip browser?',
      options: ['The selected ID', 'A second selected title', 'A second selected clip object'],
      answer: 0,
      explanation:
        'The user chooses an ID. The other values follow from that ID and the current collection.',
    },
  },
  {
    slug: 'reducer-transitions',
    trackId: 'state',
    title: 'Predictable transitions with useReducer',
    mode: 'flow',
    objective:
      'Express transport events as a typed action union and calculate the next transport state.',
    steps: [
      step(
        'Model a small state',
        'A transport records playback position and whether it is playing. Keeping these facts together makes Stop a single transition.',
        'type Transport = { playing: boolean; position: number };\nconst initial: Transport = { playing: false, position: 0 };',
        [node('state', 'Transport', 'active', 'stopped · 0s')],
      ),
      step(
        'Name the events',
        'A discriminated union makes the seek payload available only on the seek action. The type checker rejects a seek without seconds.',
        'type Action = { type: "play" } | { type: "stop" }\n  | { type: "seek"; seconds: number };',
        [
          node('play', 'play', 'added'),
          node('seek', 'seek', 'added', 'seconds'),
          node('stop', 'stop', 'added'),
        ],
      ),
      step(
        'Calculate the transition',
        'The reducer returns the next state for each action. It can be called with ordinary values in a test. Keep actual audio playback outside this function.',
        'function reduce(s: Transport, a: Action): Transport {\n  switch (a.type) {\n    case "play": return { ...s, playing: true };\n    case "seek": return { ...s, position: Math.max(0, a.seconds) };\n    case "stop": return initial;\n  }\n}',
        [
          node('old', 'Transport', 'kept', 'stopped · 0s'),
          node('play', 'play', 'active'),
          node('new', 'Transport', 'added', 'playing · 0s'),
        ],
        [
          ['old', 'new'],
          ['play', 'new'],
        ],
      ),
      step(
        'Dispatch a seek',
        'useReducer connects this pure calculation to React. The control dispatches an event describing where the listener wants to go.',
        'const [transport, dispatch] = useReducer(reduce, initial);\nconst jump = () => dispatch({ type: "seek", seconds: 12 });',
        [
          node('seek', 'seek', 'active', '12s'),
          node('new', 'Transport', 'active', 'playing · 12s'),
        ],
        [['seek', 'new']],
      ),
      step(
        'Reset with one event',
        'Stop resets position and playback together. Adding a second stop button reuses the same action and therefore the same behavior.',
        '<button onClick={() => dispatch({ type: "stop" })}>Stop</button>',
        [node('stop', 'stop', 'active'), node('new', 'Transport', 'active', 'stopped · 0s')],
        [['stop', 'new']],
      ),
    ],
    pitfall:
      'Mutating the existing object and returning it can cause React to skip an expected update.',
    practice:
      'Use a reducer when several events affect related fields. A single boolean toggle usually reads better with useState.',
    recap:
      'An action describes an event. A reducer computes the next state from that event and the current state.',
    source: 'https://react.dev/learn/extracting-state-logic-into-a-reducer',
    quiz: {
      question: 'Which operation belongs inside a reducer?',
      options: [
        'Starting an audio stream',
        'Sending analytics',
        'Computing the clamped seek position',
      ],
      answer: 2,
      explanation:
        'Clamping a number is a pure calculation and returns the same result for the same inputs.',
    },
  },
]
