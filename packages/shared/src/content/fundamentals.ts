import type { Lesson } from '../contracts/catalog.js'
import { node, step } from './scene.js'

export const fundamentals: Lesson[] = [
  {
    slug: 'how-react-renders',
    trackId: 'fundamentals',
    title: 'How React renders',
    mode: 'tree',
    objective: 'Follow one click from the play counter to the text that changes on screen.',
    steps: [
      step(
        'The player and its children',
        'React calls Player and reads the JSX it returns. Title supplies the heading, and PlayCount supplies the button. Both sit under Player in the component tree.',
        'function Player() {\n  return <section><Title /><PlayCount /></section>;\n}',
        [node('player', 'Player', 'active'), node('title', 'Title'), node('count', 'PlayCount')],
        [
          ['player', 'title'],
          ['player', 'count'],
        ],
      ),
      step(
        'Trigger an update',
        'PlayCount keeps its own count. Click the button and setPlays queues an increment. For the rest of this handler, plays still has the value from the render that created it.',
        'const [plays, setPlays] = useState(0);\nconst recordPlay = () => setPlays(n => n + 1);',
        [
          node('player', 'Player'),
          node('count', 'PlayCount', 'active', 'plays = 0'),
          node('queue', 'Update', 'added', '+1'),
        ],
        [
          ['player', 'count'],
          ['queue', 'count'],
        ],
      ),
      step(
        'Render the next count',
        'React calls PlayCount again, this time with plays equal to 1. The JSX describes "Plays: 1" while the button on screen still says "Plays: 0".',
        'return <button onClick={recordPlay}>\n  Plays: {plays}\n</button>;',
        [
          node('count', 'PlayCount', 'active', 'plays = 1'),
          node('result', 'Button', 'added', 'Plays: 1'),
          node('dom', 'DOM text', 'kept', 'Plays: 0'),
        ],
        [['count', 'result']],
      ),
      step(
        'Commit the difference',
        'At the same position in the tree, React finds another button. It keeps the DOM element and changes the count inside it. The title stays put.',
        '// After the commit\n// <button>Plays: 1</button>',
        [
          node('result', 'Button', 'kept'),
          node('dom', 'DOM text', 'active', 'Plays: 1'),
          node('title', 'Title', 'kept'),
        ],
        [['result', 'dom']],
      ),
      step(
        'Let the browser paint',
        'After the commit, the browser can paint the new count. If a later render returns identical output, React can leave the DOM alone.',
        '<Title />\n// Same title before and after the click',
        [
          node('player', 'Player', 'kept'),
          node('title', 'Title', 'kept', 'unchanged'),
          node('count', 'PlayCount', 'kept', 'Plays: 1'),
        ],
        [
          ['player', 'title'],
          ['player', 'count'],
        ],
      ),
    ],
    pitfall:
      'A log inside PlayCount tells you how often React called the function. An extra line in the console can appear even when the DOM stays the same.',
    practice:
      'Increment the count in the click handler. Keep the render itself pure so React can call PlayCount again without recording an extra play.',
    recap:
      'The click queues an increment. During render, React works out what the button should say. During commit, it updates the text so the browser can paint it.',
    source: 'https://react.dev/learn/render-and-commit',
    quiz: {
      question:
        'PlayCount renders again with exactly the same output. What needs to change in the DOM?',
      options: ['Replace the button', 'Update the title', 'None if the output is unchanged'],
      answer: 2,
      explanation:
        'The existing button already shows the right text, so React can keep it as it is.',
    },
  },
  {
    slug: 'jsx-components-props',
    trackId: 'fundamentals',
    title: 'JSX, components, and props',
    mode: 'flow',
    objective: 'Trace a clip title through a typed prop into a heading.',
    steps: [
      step(
        'Give the title a type',
        'ClipLabel expects a string called title. TypeScript can flag a missing title or a value of the wrong type at the call site.',
        'type LabelProps = { title: string };',
        [node('type', 'LabelProps', 'active', 'title: string')],
      ),
      step(
        'Pass a value in JSX',
        'The braces tell JSX to evaluate clip.title. For this clip, the value that reaches ClipLabel is "Rain".',
        'const clip = { title: "Rain" };\n<ClipLabel title={clip.title} />',
        [node('parent', 'Clip', 'active', 'Rain'), node('type', 'title', 'added', 'Rain')],
        [['parent', 'type']],
      ),
      step(
        'Read the title prop',
        'ClipLabel receives a props object. It pulls out title in the function parameter and uses that value as the heading text.',
        'function ClipLabel({ title }: LabelProps) {\n  return <h3>{title}</h3>;\n}',
        [
          node('type', 'title', 'kept', 'Rain'),
          node('label', 'ClipLabel', 'active'),
          node('h3', 'Heading', 'added', 'Rain'),
        ],
        [
          ['type', 'label'],
          ['label', 'h3'],
        ],
      ),
      step(
        'Label another clip',
        'The library uses ClipLabel twice. The first instance receives "Rain" and the second receives "Wind", so each heading shows the title its caller supplied.',
        '<><ClipLabel title="Rain" />\n  <ClipLabel title="Wind" /></>',
        [
          node('parent', 'Library', 'active'),
          node('rain', 'ClipLabel', 'kept', 'Rain'),
          node('wind', 'ClipLabel', 'added', 'Wind'),
        ],
        [
          ['parent', 'rain'],
          ['parent', 'wind'],
        ],
      ),
      step(
        'Rename the second clip',
        'The parent passes "Wind at dusk" on the next render. ClipLabel reads the new title from its props and leaves the previous props object alone.',
        '<ClipLabel title="Wind at dusk" />',
        [
          node('parent', 'Library', 'active'),
          node('rain', 'ClipLabel', 'kept', 'Rain'),
          node('wind', 'ClipLabel', 'active', 'Wind at dusk'),
        ],
        [
          ['parent', 'rain'],
          ['parent', 'wind'],
        ],
      ),
    ],
    pitfall: 'Writing title="clip.title" passes the literal text clip.title.',
    practice:
      'Let the caller supply a title when it knows the clip name. Give a prop a default parameter only if leaving it out makes sense.',
    recap:
      'The parent describes a ClipLabel element in JSX. React passes its props to ClipLabel, whose returned heading becomes part of the tree.',
    source: 'https://react.dev/learn/passing-props-to-a-component',
    quiz: {
      question: 'Which JSX attribute passes the title stored on the clip?',
      options: ['title="clip.title"', 'title={clip.title}', 'clip.title="title"'],
      answer: 1,
      explanation:
        'Inside braces, clip.title reads the property in the parent’s scope. Here it evaluates to "Rain".',
    },
  },
  {
    slug: 'component-composition',
    trackId: 'fundamentals',
    title: 'Component composition',
    mode: 'layers',
    objective:
      'Build a clip preview by placing waveform and transport components inside a reusable frame.',
    steps: [
      step(
        'Define the frame',
        'Frame supplies the border and spacing. Whatever the caller nests inside its tags arrives as children.',
        'function Frame({ children }: { children: React.ReactNode }) {\n  return <section className="frame">{children}</section>;\n}',
        [node('frame', 'Frame', 'active', 'border + space')],
      ),
      step(
        'Add a waveform',
        'The caller gives the samples directly to Waveform. Frame receives the resulting element as a child and places it inside its section.',
        '<Frame>\n  <Waveform samples={samples} />\n</Frame>',
        [node('frame', 'Frame', 'kept'), node('wave', 'Waveform', 'added', 'samples')],
        [['frame', 'wave']],
      ),
      step(
        'Add playback controls',
        'Put Transport after Waveform between the Frame tags. That puts the controls after the waveform in the section.',
        '<Frame>\n  <Waveform samples={samples} />\n  <Transport onPlay={play} />\n</Frame>',
        [
          node('frame', 'Frame', 'kept'),
          node('wave', 'Waveform', 'kept'),
          node('transport', 'Transport', 'added', 'onPlay'),
        ],
        [
          ['frame', 'wave'],
          ['frame', 'transport'],
        ],
      ),
      step(
        'Build ClipPreview',
        'ClipPreview picks the samples for Waveform and wires up playback for Transport. Changing the border still takes a single edit to Frame.',
        'function ClipPreview({ clip }: { clip: Clip }) {\n  return <Frame><Waveform samples={clip.samples} />\n    <Transport onPlay={() => playClip(clip)} /></Frame>;\n}',
        [
          node('preview', 'ClipPreview', 'added'),
          node('frame', 'Frame', 'kept'),
          node('wave', 'Waveform'),
          node('transport', 'Transport'),
        ],
        [
          ['preview', 'frame'],
          ['frame', 'wave'],
          ['frame', 'transport'],
        ],
      ),
      step(
        'Reuse the frame',
        'An empty library puts a paragraph inside the same frame. Frame can render the message as children without a special setting for empty libraries.',
        '<Frame><p>Record your first clip.</p></Frame>',
        [
          node('empty', 'EmptyLibrary', 'added'),
          node('frame', 'Frame', 'kept'),
          node('copy', 'Message', 'added'),
        ],
        [
          ['empty', 'frame'],
          ['frame', 'copy'],
        ],
      ),
    ],
    pitfall:
      'If Frame needs a flag for every kind of child, adding an empty-state message means editing the frame itself.',
    practice:
      'Use children when the caller can fill one area freely. Give the wrapper a named prop such as footer when a piece of content belongs in a particular spot.',
    recap:
      'ClipPreview chooses the waveform and transport controls. Frame decides where they appear inside its section.',
    source: 'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children',
    quiz: {
      question: 'Which component needs the audio samples to draw the preview?',
      options: ['Frame', 'Waveform', 'Every ancestor'],
      answer: 1,
      explanation:
        'Waveform draws the audio. Frame can arrange its children without inspecting the samples.',
    },
  },
  {
    slug: 'lists-and-keys',
    trackId: 'fundamentals',
    title: 'Lists, keys, and reconciliation',
    mode: 'compare',
    objective: 'Sort two clip rows and predict what happens to an unfinished rename.',
    steps: [
      step(
        'Use the clip ID as its key',
        'Rain has ID r and Wind has ID w. React can use those keys to match sibling rows on the next render, even if a row moves with a draft still open.',
        'clips.map(clip => <ClipRow key={clip.id} clip={clip} />)',
        [node('rain', 'Rain', 'kept', 'id: r'), node('wind', 'Wind', 'kept', 'id: w')],
      ),
      step(
        'Rename Wind to Breeze',
        'Typing "Breeze" updates the Wind row’s local draft. As long as React keeps that row in the tree, it remembers what you typed.',
        'const [draft, setDraft] = useState(clip.name);\n<input value={draft} onChange={e => setDraft(e.target.value)} />',
        [node('rain', 'Rain', 'kept', 'id: r'), node('wind', 'Breeze', 'active', 'id: w')],
      ),
      step(
        'Reorder the list',
        'Move Wind ahead of Rain. Under the same parent, each row still has the same key and component type. The Breeze draft now appears in the first row with Wind.',
        'setClips(rows => [...rows].reverse());',
        [
          node('wind', 'Breeze', 'kept', 'id: w · first'),
          node('rain', 'Rain', 'kept', 'id: r · second'),
        ],
      ),
      step(
        'Replace a clip',
        'Remove Rain and add Surf with a new ID. React unmounts Rain and gives Surf fresh state. Wind still has its Breeze draft.',
        'setClips(rows => [...rows.filter(c => c.id !== "r"), surf]);',
        [
          node('wind', 'Breeze', 'kept', 'id: w'),
          node('rain', 'Rain', 'removed', 'id: r'),
          node('surf', 'Surf', 'added', 'id: s'),
        ],
      ),
      step(
        'Reverse rows keyed by index',
        'Go back to Rain and Wind and use the array index as the key. After reversing them, key 0 still identifies the first slot. Wind now shows the Rain draft that belongs to that slot.',
        'clips.map((clip, i) => <ClipRow key={i} clip={clip} />)',
        [
          node('slot0', 'Slot 0', 'active', 'Wind / Rain draft'),
          node('slot1', 'Slot 1', 'active', 'Rain / Breeze draft'),
        ],
      ),
    ],
    pitfall:
      'A different random key on every render makes React discard a row and its draft, even if the clip itself never moved.',
    practice:
      'Give each clip an ID when you create it. An array index can work for a list whose items and order stay fixed.',
    recap:
      'Under one parent, the same key and component type let a row keep its state when it moves. Replacing Rain with a new clip gives that row fresh state.',
    source: 'https://react.dev/learn/preserving-and-resetting-state',
    quiz: {
      question: 'Which key keeps a draft attached to its clip after sorting?',
      options: ['The current array index', 'A random value per render', 'The clip’s stored ID'],
      answer: 2,
      explanation:
        'Sorting changes the position of Wind, but its stored ID still identifies the row that owns the Breeze draft.',
    },
  },
]
