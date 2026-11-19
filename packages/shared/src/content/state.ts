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
        'This fader starts at 2 dB. A local variable would start over each time React called the component. With useState, React remembers the gain at this position in the tree.',
        'const [gain, setGain] = useState(2);',
        [node('state', 'Stored gain', 'active', '2'), node('view', 'Fader', 'kept', '2')],
        [['state', 'view']],
      ),
      step(
        'Read the gain after calling setGain',
        'The handler captured gain when it was 2. setGain schedules another render, so the log right after that call still prints 2.',
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
        'Both lines read the same gain of 2. Each asks React to replace it with 3, so the second replacement leaves it at 3.',
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
        'Start again at 2. This time the first updater adds 1 and passes 3 along. The second receives that pending value and returns 4.',
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
        'Read the fader after the click',
        'React batches the updates from the click. The next render shows 4 dB and creates a handler that now reads 4.',
        '<output>{gain} dB</output>',
        [node('state', 'Stored gain', 'active', '4'), node('view', 'Fader', 'added', '4 dB')],
        [['state', 'view']],
      ),
    ],
    pitfall:
      'Writing setGain(gain + 1) twice in one click can leave the fader just 1 dB louder. Both lines calculate the replacement from the same gain.',
    practice:
      'Pass a value to set an exact level. When the control adds one decibel to whatever level is pending, pass a pure updater function.',
    recap:
      'React keeps the gain between renders. The click handler sees a single snapshot, but React passes the result of each queued updater to the next.',
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
    objective: 'Make the mixer’s two Solo buttons agree about which channel should play.',
    steps: [
      step(
        'Solo two channels',
        'Click Solo on Drums, then on Bass. With a separate solo flag in each row, both buttons can stay pressed even though only one channel should play solo.',
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
        'Keep the selection in Mixer',
        'Mixer contains both channel rows. It can store the ID of the solo channel, or null when neither is solo.',
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
        'Pass solo to each channel',
        'Mixer compares each channel ID with soloId and passes down the resulting boolean. When soloId is null, both rows receive false.',
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
        'Press Solo on Bass',
        'The Bass button calls onSolo, the callback it received from Mixer. Mixer sets its selected ID to bass.',
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
        'Mixer now renders with soloId set to bass. React calls both channel components again in this unoptimized tree. Only the Bass button needs a DOM change because its pressed state went from false to true.',
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
    pitfall: 'Separate booleans let both rows claim to be the only solo channel.',
    practice:
      'Keep soloId in Mixer because both rows depend on it. A draft channel name can stay local to the one row you are editing.',
    recap:
      'Mixer owns soloId and sends each row its pressed state. Pressing a row’s button calls back into Mixer to change the selection.',
    source: 'https://react.dev/learn/sharing-state-between-components',
    quiz: {
      question: 'Where should this mixer keep the ID of its solo channel?',
      options: [
        'In each channel row',
        'In the Mixer that contains both rows',
        'In one global selection for all mixers',
      ],
      answer: 1,
      explanation:
        'Both buttons can read the choice from their shared Mixer. Another mixer can keep a different channel solo.',
    },
  },
  {
    slug: 'deriving-state',
    trackId: 'state',
    title: 'Derived state vs. duplicated state',
    mode: 'flow',
    objective: 'Keep the detail panel in sync when someone renames or removes the selected clip.',
    steps: [
      step(
        'Select Rain',
        'The collection holds Rain, and selectedClip points to the same object. If an edit replaces the object in the collection, selectedClip can still point to the old one.',
        'const [selectedClip, setSelectedClip] = useState(clips[0]);',
        [node('list', 'Clips', 'kept', 'Rain'), node('selected', 'Selection', 'active', 'Rain')],
      ),
      step(
        'Rename Rain to Drizzle',
        'The list replaces the clip with a new object named Drizzle. The detail panel reads selectedClip, so it still says Rain.',
        'setClips(rows => rows.map(c =>\n  c.id === id ? { ...c, title: "Drizzle" } : c));',
        [
          node('list', 'Clips', 'active', 'Drizzle'),
          node('selected', 'Selection', 'removed', 'Rain'),
        ],
      ),
      step(
        'Keep the selected ID',
        'The user chose clip r. Keep r in state and read its title from the collection, where the rename already happened.',
        'const [selectedId, select] = useState<string | null>(null);',
        [node('list', 'Clips', 'kept', 'r: Drizzle'), node('id', 'Selected ID', 'added', 'r')],
      ),
      step(
        'Find the selected clip',
        'Look up r in the array during render. The detail panel now reads Drizzle from the very same clip as the list row.',
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
        'Remove the selected clip',
        'When you delete r, find returns undefined and the panel can ask you to choose a clip. If you keep r as the selected ID, undoing the deletion can restore the selection too.',
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
      'Copying new props into selection with an Effect takes an extra update and can overwrite a choice the user just made.',
    practice:
      'Read the saved title from the current collection during render. A separate title draft makes sense when the user can edit it before saving.',
    recap:
      'The selected ID records the choice. Looking up that ID each time the panel renders gives you the current record, including later edits.',
    source: 'https://react.dev/learn/choosing-the-state-structure',
    quiz: {
      question: 'Which value does the clip browser need to remember separately?',
      options: ['The selected ID', 'A second selected title', 'A second selected clip object'],
      answer: 0,
      explanation:
        'Two panels can look up the title and the clip object from the same collection. The selected ID tells them which one to read.',
    },
  },
  {
    slug: 'reducer-transitions',
    trackId: 'state',
    title: 'Predictable transitions with useReducer',
    mode: 'flow',
    objective:
      'Give Play, Seek, and Stop typed actions, then use a reducer to work out what happens to playback.',
    steps: [
      step(
        'Describe playback',
        'The transport tracks the playback position and whether audio is playing. Stop needs to pause and return to the beginning, so it helps to keep those fields together.',
        'type Transport = { playing: boolean; position: number };\nconst initial: Transport = { playing: false, position: 0 };',
        [node('state', 'Transport', 'active', 'stopped · 0s')],
      ),
      step(
        'Give each action a type',
        'Only seek needs a time in seconds. With this discriminated union, TypeScript can catch a seek action that omits seconds.',
        'type Action = { type: "play" } | { type: "stop" }\n  | { type: "seek"; seconds: number };',
        [
          node('play', 'play', 'added'),
          node('seek', 'seek', 'added', 'seconds'),
          node('stop', 'stop', 'added'),
        ],
      ),
      step(
        'Write the reducer',
        'Given a state and an action, the reducer returns the next state. A test can call it with plain objects. Starting audio playback belongs outside the reducer.',
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
        'Jump to 12 seconds',
        'useReducer gives the control a dispatch function. Sending a seek action with 12 seconds updates the position and keeps playback running.',
        'const [transport, dispatch] = useReducer(reduce, initial);\nconst jump = () => dispatch({ type: "seek", seconds: 12 });',
        [
          node('seek', 'seek', 'active', '12s'),
          node('new', 'Transport', 'active', 'playing · 12s'),
        ],
        [['seek', 'new']],
      ),
      step(
        'Stop and rewind',
        'Stop restores the initial state, with playback off and position at zero. A second stop button can dispatch the same action.',
        '<button onClick={() => dispatch({ type: "stop" })}>Stop</button>',
        [node('stop', 'stop', 'active'), node('new', 'Transport', 'active', 'stopped · 0s')],
        [['stop', 'new']],
      ),
    ],
    pitfall:
      'If the reducer mutates the existing transport object and returns it, React can see the same object and skip the update you expected.',
    practice:
      'A reducer helps when several controls change related fields. A lone on/off switch usually needs only useState.',
    recap:
      'The control dispatches what happened, such as a seek to 12 seconds. The reducer uses that action and the current transport state to calculate the next state.',
    source: 'https://react.dev/learn/extracting-state-logic-into-a-reducer',
    quiz: {
      question: 'Which part of seeking belongs in the reducer?',
      options: [
        'Starting an audio stream',
        'Sending analytics',
        'Computing the clamped seek position',
      ],
      answer: 2,
      explanation:
        'Clamping the seek position to zero or above only takes a number. The same input always gives the same result.',
    },
  },
]
