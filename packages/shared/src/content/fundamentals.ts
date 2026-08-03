import type { Lesson } from '../types.js';
import { node, step } from './scene.js';

export const fundamentals: Lesson[] = [
  {
    slug:'how-react-renders', trackId:'fundamentals', title:'How React renders', mode:'tree',
    objective:'Follow a play-count update from a button press to a single changed text node.',
    steps:[
      step('Meet the component tree','A player has a title and a play counter. React calls Player to discover which children belong in the tree. Each component describes its part of the screen.','function Player() {\n  return <section><Title /><PlayCount /></section>;\n}',[node('player','Player','active'),node('title','Title'),node('count','PlayCount')],[['player','title'],['player','count']]),
      step('Trigger an update','The counter owns its play count. Clicking its button queues a state update. The event handler still sees the count from the render that created it.','const [plays, setPlays] = useState(0);\nconst recordPlay = () => setPlays(n => n + 1);',[node('player','Player'),node('count','PlayCount','active','plays = 0'),node('queue','Update','added','+1')],[['player','count'],['queue','count']]),
      step('Call the component','React calls PlayCount with the updated state. Its return value now describes a button showing one play. Rendering computes this description before React changes the DOM.','return <button onClick={recordPlay}>\n  Plays: {plays}\n</button>;',[node('count','PlayCount','active','plays = 1'),node('result','Button','added','Plays: 1'),node('dom','DOM text','kept','Plays: 0')],[['count','result']]),
      step('Commit the difference','The button still has the same type and position. React can keep that DOM element and change the text inside it. The title needs no DOM edit.','// After the commit\n// <button>Plays: 1</button>',[node('result','Button','kept'),node('dom','DOM text','active','Plays: 1'),node('title','Title','kept')],[['result','dom']]),
      step('Let the browser paint','The browser can now paint the updated count. A later render that produces the same output may require no DOM changes at all.','<Title />\n// Same title before and after the click',[node('player','Player','kept'),node('title','Title','kept','unchanged'),node('count','PlayCount','kept','Plays: 1')],[['player','title'],['player','count']]),
    ],
    pitfall:'A console log in a component counts function calls. It cannot tell you how many DOM nodes changed.',
    practice:'Keep render calculations pure. Put the play-count update in the click handler so React can safely call the component again.',
    recap:'A state update triggers a render. React computes the next output, commits the necessary DOM edits, and the browser paints.',
    source:'https://react.dev/learn/render-and-commit',
    quiz:{question:'PlayCount renders again and returns the same button text. What DOM edit is required?',options:['Replace the button','Update the title','None if the output is unchanged'],answer:2,explanation:'Rendering computes output. React can keep the existing DOM when the output still matches.'}
  },
  {
    slug:'jsx-components-props',trackId:'fundamentals',title:'JSX, components, and props',mode:'flow',
    objective:'Trace a clip title through a typed prop into a heading.',
    steps:[
      step('Describe the input','ClipLabel takes a title. A TypeScript prop type lets a caller see exactly which value it must supply.','type LabelProps = { title: string };',[node('type','LabelProps','active','title: string')]),
      step('Pass a value in JSX','The parent uses braces to evaluate an expression. The resulting value becomes the title prop for this particular label.','const clip = { title: "Rain" };\n<ClipLabel title={clip.title} />',[node('parent','Clip','active','Rain'),node('type','title','added','Rain')],[['parent','type']]),
      step('Read a snapshot','React hands the component a props object. Destructuring gives the function a local name for its current title.','function ClipLabel({ title }: LabelProps) {\n  return <h3>{title}</h3>;\n}',[node('type','title','kept','Rain'),node('label','ClipLabel','active'),node('h3','Heading','added','Rain')],[['type','label'],['label','h3']]),
      step('Render a second instance','The same component definition can appear twice. Each instance receives its own props, so the two headings can show different text.','<><ClipLabel title="Rain" />\n  <ClipLabel title="Wind" /></>',[node('parent','Library','active'),node('rain','ClipLabel','kept','Rain'),node('wind','ClipLabel','added','Wind')],[['parent','rain'],['parent','wind']]),
      step('Change the source','When the parent supplies a new title, the corresponding label renders with the new value. Mutating the old props object would violate the component contract.','<ClipLabel title="Wind at dusk" />',[node('parent','Library','active'),node('rain','ClipLabel','kept','Rain'),node('wind','ClipLabel','active','Wind at dusk')],[['parent','rain'],['parent','wind']]),
    ],
    pitfall:'Writing title="clip.title" passes the literal text clip.title.',
    practice:'Use a prop for a value controlled by the caller. Use a default parameter for genuinely optional input.',
    recap:'JSX describes an element. React passes its props to the component, which returns the next part of the tree.',
    source:'https://react.dev/learn/passing-props-to-a-component',
    quiz:{question:'Which expression passes the current title value?',options:['title="clip.title"','title={clip.title}','clip.title="title"'],answer:1,explanation:'Braces evaluate clip.title in the parent’s JavaScript scope.'},
  },
  {
    slug:'component-composition',trackId:'fundamentals',title:'Component composition',mode:'layers',
    objective:'Build a clip preview by placing waveform and transport components inside a reusable frame.',
    steps:[
      step('Define the frame','A frame supplies the border and spacing. Its children prop accepts the content the caller places between its tags.','function Frame({ children }: { children: React.ReactNode }) {\n  return <section className="frame">{children}</section>;\n}',[node('frame','Frame','active','border + space')]),
      step('Fill the opening','The caller inserts a waveform. Frame places that element inside its section without needing access to the audio samples.','<Frame>\n  <Waveform samples={samples} />\n</Frame>',[node('frame','Frame','kept'),node('wave','Waveform','added','samples')],[['frame','wave']]),
      step('Compose siblings','Add transport controls next to the waveform. The element order in children controls the order inside the section.','<Frame>\n  <Waveform samples={samples} />\n  <Transport onPlay={play} />\n</Frame>',[node('frame','Frame','kept'),node('wave','Waveform','kept'),node('transport','Transport','added','onPlay')],[['frame','wave'],['frame','transport']]),
      step('Name the composition','ClipPreview can own the audio-specific arrangement. A frame change and a transport change now have different homes.','function ClipPreview({ clip }: { clip: Clip }) {\n  return <Frame><Waveform samples={clip.samples} />\n    <Transport onPlay={() => playClip(clip)} /></Frame>;\n}',[node('preview','ClipPreview','added'),node('frame','Frame','kept'),node('wave','Waveform'),node('transport','Transport')],[['preview','frame'],['frame','wave'],['frame','transport']]),
      step('Reuse the frame','An empty library can use the same frame with entirely different children. Frame needs no mode switch to support this new use.','<Frame><p>Record your first clip.</p></Frame>',[node('empty','EmptyLibrary','added'),node('frame','Frame','kept'),node('copy','Message','added')],[['empty','frame'],['frame','copy']]),
    ],
    pitfall:'A new boolean prop for every possible child forces Frame to know each feature.',
    practice:'Use children for a single flexible opening. Named props such as footer help when callers must place content in specific regions.',
    recap:'The caller chooses the contents. The wrapper chooses where those contents appear.',
    source:'https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children',
    quiz:{question:'Which component needs the waveform samples?',options:['Frame','Waveform','Every ancestor'],answer:1,explanation:'The caller can pass samples straight to Waveform while Frame handles layout.'},
  },
  {
    slug:'lists-and-keys',trackId:'fundamentals',title:'Lists, keys, and reconciliation',mode:'compare',
    objective:'Predict which editable clip rows keep their local drafts after a reorder.',
    steps:[
      step('Give rows an identity','Each clip has a durable ID. A key lets React match a row among siblings across renders. The row can keep its draft while its order changes.','clips.map(clip => <ClipRow key={clip.id} clip={clip} />)',[node('rain','Rain','kept','id: r'),node('wind','Wind','kept','id: w')]),
      step('Edit a draft','Typing edits the Wind row’s local state. Its draft belongs to this row identity while that component stays in the tree.','const [draft, setDraft] = useState(clip.name);\n<input value={draft} onChange={e => setDraft(e.target.value)} />',[node('rain','Rain','kept','id: r'),node('wind','Breeze','active','id: w')]),
      step('Reorder the list','Move Wind ahead of Rain. Both keys and component types still match under the same parent, so the edited text moves with Wind.','setClips(rows => [...rows].reverse());',[node('wind','Breeze','kept','id: w · first'),node('rain','Rain','kept','id: r · second')]),
      step('Replace a clip','Remove Rain and add Surf with a new ID. Wind keeps its draft, Rain unmounts, and Surf starts with its own initial state.','setClips(rows => [...rows.filter(c => c.id !== "r"), surf]);',[node('wind','Breeze','kept','id: w'),node('rain','Rain','removed','id: r'),node('surf','Surf','added','id: s')]),
      step('Try position as identity','Consider the original two rows keyed by index. After a reversal the first slot still has key 0. Its local draft can now be paired with the wrong clip.','clips.map((clip, i) => <ClipRow key={i} clip={clip} />)',[node('slot0','Slot 0','active','Wind / Rain draft'),node('slot1','Slot 1','active','Rain / Breeze draft')]),
    ],
    pitfall:'Generating keys during render makes unchanged items look new on each pass.',
    practice:'Assign IDs when records are created. An index can suffice for a permanently fixed list whose membership and order never change.',
    recap:'Keys identify siblings within one parent. Matching type and key can preserve state through a move, while a new identity starts fresh.',
    source:'https://react.dev/learn/preserving-and-resetting-state',
    quiz:{question:'Which key keeps a draft attached to its clip after sorting?',options:['The current array index','A random value per render','The clip’s stored ID'],answer:2,explanation:'The stored ID travels with the record when its array position changes.'},
  },
];
