import type { Lesson } from '../types.js'
import { node, step } from './scene.js'

export const architecture: Lesson[] = [
  {
    slug: 'feature-folders',
    trackId: 'architecture',
    title: 'Feature-based project organization',
    mode: 'layers',
    objective:
      'Place a new clip export option so its UI, domain rules, and outside dependencies have clear owners.',
    steps: [
      step(
        'Follow a change',
        'A new export format affects the export dialog, filename calculation, and download request. Identify the files that change together before moving anything.',
        'type Format = "wav" | "flac";',
        [
          node('dialog', 'Export dialog', 'active'),
          node('name', 'Filename', 'active'),
          node('request', 'Download', 'active'),
        ],
      ),
      step(
        'Name the feature',
        'Group those parts under export. A route can mount the feature through its public entry point without knowing its internal layout.',
        '// features/export/index.ts\nexport { ExportDialog } from "./ExportDialog";',
        [
          node('route', 'Clip route', 'kept'),
          node('feature', 'export/', 'added'),
          node('dialog', 'ExportDialog', 'kept'),
        ],
        [
          ['route', 'feature'],
          ['feature', 'dialog'],
        ],
      ),
      step(
        'Isolate a pure rule',
        'The filename rule depends on a title and a format. Keeping it independent of React makes it easy to exercise with plain values.',
        'export function filename(title: string, format: Format) {\n  return title.trim() + "." + format;\n}',
        [node('dialog', 'ExportDialog', 'kept'), node('name', 'filename()', 'active', 'pure rule')],
        [['dialog', 'name']],
      ),
      step(
        'Put I/O at the edge',
        'One module knows the endpoint and checks HTTP failures. The dialog can use it without repeating request construction in every button.',
        'async function requestExport(id: string, format: Format) {\n  const res = await fetch("/api/export/" + encodeURIComponent(id) + "?format=" + format);\n  if (!res.ok) throw new Error("Export failed");\n  return res.blob();\n}',
        [
          node('dialog', 'ExportDialog', 'kept'),
          node('request', 'requestExport', 'active'),
          node('api', 'HTTP', 'added'),
        ],
        [
          ['dialog', 'request'],
          ['request', 'api'],
        ],
      ),
      step(
        'Share a real primitive',
        'Export and Library both need the same accessible button. Put that primitive in shared UI and keep the export-specific filename rule inside export.',
        'import { Button } from "../../ui/Button";\nimport { filename } from "./filename";',
        [
          node('export', 'Export', 'active'),
          node('library', 'Library', 'kept'),
          node('button', 'UI Button', 'added'),
          node('rule', 'filename', 'kept'),
        ],
        [
          ['export', 'button'],
          ['library', 'button'],
          ['export', 'rule'],
        ],
      ),
    ],
    pitfall:
      'A shared utilities folder can collect feature-specific decisions until unrelated modules depend on each other.',
    practice:
      'Treat folder boundaries as a team convention. Move a helper to shared code once multiple callers need the same behavior.',
    recap:
      'Group files around a user capability. Expose a small entry point and keep transport and domain rules easy to change separately.',
    source: 'https://react.dev/learn/thinking-in-react',
    quiz: {
      question: 'Only the export feature uses its filename rule. Where should it start?',
      options: ['In global UI', 'Inside the export feature', 'In every route'],
      answer: 1,
      explanation:
        'Keeping the rule with its owner makes related changes local and leaves room to extract it later.',
    },
  },
  {
    slug: 'component-boundaries',
    trackId: 'architecture',
    title: 'Component responsibilities and boundaries',
    mode: 'tree',
    objective:
      'Split a clip library so fetching, filtering, and row interaction each have an identifiable owner.',
    steps: [
      step(
        'Identify the decisions',
        'A library screen loads clips, chooses a search term, and renders editable rows. Each decision changes for a different reason.',
        'function LibraryPage() {\n  const clips = useClips();\n  const [query, setQuery] = useState("");\n  // Render search, results, and clip actions.\n}',
        [node('page', 'LibraryPage', 'active', 'load + filter + rows')],
      ),
      step(
        'Extract the visual unit',
        'A row takes one clip and an action callback. It can render inside search results or a collection view without owning either list.',
        'type RowProps = { clip: Clip; onOpen: (id: string) => void };\nfunction ClipRow({ clip, onOpen }: RowProps) {\n  return <button onClick={() => onOpen(clip.id)}>{clip.title}</button>;\n}',
        [node('page', 'LibraryPage', 'kept'), node('row', 'ClipRow', 'added', 'clip + onOpen')],
        [['page', 'row']],
      ),
      step(
        'Find the state owner',
        'The search control writes the query and the results read it. Their shared ancestor LibraryFilter is a useful place to keep that state.',
        'const [query, setQuery] = useState("");\nconst visible = clips.filter(c => c.title.includes(query));',
        [
          node('filter', 'LibraryFilter', 'active', 'owns query'),
          node('search', 'SearchInput', 'added'),
          node('results', 'Results', 'added'),
        ],
        [
          ['filter', 'search'],
          ['filter', 'results'],
        ],
      ),
      step(
        'Keep network states together',
        'LibraryPage decides what a pending or failed request should display. LibraryFilter can accept a successful collection through a plain prop.',
        'if (query.isPending) return <LibrarySkeleton />;\nif (query.isError) return <Retry onClick={() => query.refetch()} />;\nreturn <LibraryFilter clips={query.data} />;',
        [
          node('page', 'LibraryPage', 'active', 'request'),
          node('filter', 'LibraryFilter', 'kept', 'Clip[]'),
          node('error', 'Retry', 'idle', 'error path'),
        ],
        [
          ['page', 'filter'],
          ['page', 'error'],
        ],
      ),
      step(
        'Exercise the seam',
        'Render LibraryFilter with a short array and type a term. This tests the search interaction without starting a network request.',
        'render(<LibraryFilter clips={[rain, surf]} />);\nawait user.type(screen.getByRole("searchbox"), "Rain");',
        [
          node('fixtures', 'Two clips', 'added'),
          node('filter', 'LibraryFilter', 'active', 'Rain'),
          node('row', 'ClipRow', 'kept', 'Rain'),
        ],
        [
          ['fixtures', 'filter'],
          ['filter', 'row'],
        ],
      ),
    ],
    pitfall:
      'Splitting every line of markup into a component can make one small interaction hard to follow.',
    practice:
      'Extract a component when it gives a coherent piece of UI one responsibility or isolates a meaningful change.',
    recap:
      'A boundary earns its place when the caller can use the component without managing its internal decisions.',
    source: 'https://react.dev/learn/thinking-in-react',
    quiz: {
      question: 'SearchInput changes query and Results reads it. Who should own it?',
      options: [
        'Each result row',
        'The nearest common filter component',
        'A module-level mutable variable',
      ],
      answer: 1,
      explanation:
        'One shared owner can pass the current value and a change callback where they are needed.',
    },
  },
  {
    slug: 'context-providers',
    trackId: 'architecture',
    title: 'Context and providers',
    mode: 'tree',
    objective: 'Predict which formatting preference a clip row reads under nested providers.',
    steps: [
      step(
        'Define the fallback',
        'A context has a static fallback. When a consumer has no matching provider above it, the fallback supplies its format.',
        'type TimeFormat = "seconds" | "clock";\nconst TimeContext = createContext<TimeFormat>("seconds");',
        [node('default', 'Fallback', 'active', 'seconds'), node('row', 'ClipRow', 'kept')],
        [['default', 'row']],
      ),
      step(
        'Provide a scope',
        'The library supplies clock formatting to descendants. Intermediate components do not need to receive and forward a format prop.',
        '<TimeContext.Provider value="clock">\n  <Library />\n</TimeContext.Provider>',
        [
          node('provider', 'Provider', 'added', 'clock'),
          node('library', 'Library', 'kept'),
          node('row', 'ClipRow', 'kept'),
        ],
        [
          ['provider', 'library'],
          ['library', 'row'],
        ],
      ),
      step(
        'Read the closest value',
        'ClipRow reads the nearest provider above it in the React tree. A provider returned by ClipRow itself would only apply to descendants.',
        'const format = useContext(TimeContext);\nreturn <time>{formatDuration(clip.duration, format)}</time>;',
        [node('provider', 'Provider', 'kept', 'clock'), node('row', 'ClipRow', 'active', '01:30')],
        [['provider', 'row']],
      ),
      step(
        'Override a branch',
        'A nested provider uses seconds inside the editor. Library rows outside that branch continue to show clock time.',
        '<TimeContext.Provider value="seconds">\n  <EditorRow />\n</TimeContext.Provider>',
        [
          node('outer', 'Library', 'kept', 'clock'),
          node('row', 'ClipRow', 'kept', '01:30'),
          node('inner', 'Editor', 'added', 'seconds'),
          node('editor', 'EditorRow', 'active', '90s'),
        ],
        [
          ['outer', 'row'],
          ['outer', 'inner'],
          ['inner', 'editor'],
        ],
      ),
      step(
        'Change the provided value',
        'Changing the outer format updates consumers reading that provider. A memo wrapper does not block a context update in a subscribed consumer.',
        '<TimeContext.Provider value={preference}>\n  <Library />\n</TimeContext.Provider>',
        [
          node('outer', 'Library', 'active', 'seconds'),
          node('row', 'ClipRow', 'active', '90s'),
          node('inner', 'Editor', 'kept', 'own provider'),
        ],
        [
          ['outer', 'row'],
          ['outer', 'inner'],
        ],
      ),
    ],
    pitfall:
      'An inline object provider value creates a new identity on each render and can update subscribers unnecessarily.',
    practice:
      'Prefer a prop for a nearby dependency. Context fits preferences that many distant descendants need within a defined scope.',
    recap:
      'Consumers read the nearest matching provider. React compares successive provided values with Object.is.',
    source: 'https://react.dev/reference/react/useContext',
    quiz: {
      question: 'Which format reaches EditorRow under a nested seconds provider?',
      options: ['The outer clock value', 'The nearest seconds value', 'A merge of both'],
      answer: 1,
      explanation:
        'Provider lookup stops at the nearest matching context provider above the consumer.',
    },
  },
  {
    slug: 'accessible-ui-systems',
    trackId: 'architecture',
    title: 'Reusable, accessible UI systems',
    mode: 'layers',
    objective:
      'Build a reusable disclosure with a native control and a reliable relationship to its panel.',
    steps: [
      step(
        'Start with the native control',
        'A real button receives focus and handles Enter and Space activation. Set type="button" so a disclosure in a form will not submit it.',
        '<button type="button">Recording details</button>',
        [node('control', 'Button', 'added', 'focusable')],
      ),
      step(
        'Track one state',
        'One boolean controls both the panel’s visibility and the expanded state exposed to assistive technology.',
        'const [open, setOpen] = useState(false);\nconst toggle = () => setOpen(value => !value);',
        [
          node('state', 'open', 'active', 'false'),
          node('control', 'Button', 'kept'),
          node('panel', 'Panel', 'idle', 'hidden'),
        ],
        [
          ['state', 'control'],
          ['state', 'panel'],
        ],
      ),
      step(
        'Connect the panel',
        'Generate an ID for this instance. aria-controls identifies the panel, and aria-expanded communicates whether it is open.',
        'const panelId = useId();\n<button type="button" aria-controls={panelId}\n  aria-expanded={open} onClick={toggle}>{label}</button>',
        [
          node('control', 'Button', 'active', 'expanded: false'),
          node('panel', 'Panel', 'kept', 'unique ID'),
        ],
        [['control', 'panel']],
      ),
      step(
        'Reveal the content',
        'Render the caller’s children inside the panel. The hidden attribute removes collapsed contents from display and the usual accessibility tree.',
        '<div id={panelId} hidden={!open}>{children}</div>',
        [
          node('state', 'open', 'active', 'true'),
          node('control', 'Button', 'active', 'expanded: true'),
          node('panel', 'Panel', 'added', 'visible'),
        ],
        [
          ['state', 'control'],
          ['control', 'panel'],
        ],
      ),
      step(
        'Reuse it twice',
        'Two disclosures on one screen must have independent IDs and state. Label each trigger for the content it controls.',
        '<>\n  <Disclosure label="Recording details"><Metadata /></Disclosure>\n  <Disclosure label="License terms"><License /></Disclosure>\n</>',
        [
          node('rec', 'Recording', 'kept', 'expanded'),
          node('meta', 'Metadata', 'kept', 'panel A'),
          node('license', 'License', 'added', 'collapsed'),
          node('terms', 'Terms', 'idle', 'panel B'),
        ],
        [
          ['rec', 'meta'],
          ['license', 'terms'],
        ],
      ),
    ],
    pitfall:
      'A styled div with onClick does not provide the button’s native keyboard and focus behavior.',
    practice:
      'Expose label and children first. Add a controlled open prop when callers actually need to coordinate several disclosures.',
    recap:
      'One accessible primitive can centralize activation, state announcements, and unique panel relationships.',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    quiz: {
      question: 'Which attribute tells assistive technology that the disclosure is open?',
      options: ['aria-controls', 'aria-expanded', 'tabIndex'],
      answer: 1,
      explanation:
        'aria-expanded communicates state. aria-controls identifies the element being controlled.',
    },
  },
]
