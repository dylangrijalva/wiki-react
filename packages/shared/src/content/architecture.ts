import type { Lesson } from '../contracts/catalog.js'
import { node, step } from './scene.js'

export const architecture: Lesson[] = [
  {
    slug: 'feature-folders',
    trackId: 'architecture',
    title: 'Feature-based project organization',
    mode: 'layers',
    objective:
      'Add an export format and decide where its dialog, filename rule, and download request belong.',
    steps: [
      step(
        'What changes for FLAC?',
        'Adding FLAC means changing the format picker, the filename extension, and the request that starts the download. Look for files you tend to edit together.',
        'type Format = "wav" | "flac";',
        [
          node('dialog', 'Export dialog', 'active'),
          node('name', 'Filename', 'active'),
          node('request', 'Download', 'active'),
        ],
      ),
      step(
        'Give export its own folder',
        'Keep these files in features/export. The clip route imports ExportDialog from the public entry point, so moving a file inside the folder leaves the route alone.',
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
        'Test the filename on its own',
        'The filename needs just a title and a format. Pass those values to a plain function and you can test how it handles a trailing space without mounting a dialog.',
        'export function filename(title: string, format: Format) {\n  return title.trim() + "." + format;\n}',
        [node('dialog', 'ExportDialog', 'kept'), node('name', 'filename()', 'active', 'pure rule')],
        [['dialog', 'name']],
      ),
      step(
        'Build the request in one place',
        'requestExport builds the URL, checks the HTTP status, and returns the download as a blob. Each button can call it with a clip ID and format.',
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
        'Share the button',
        'The export dialog and clip library need the same accessible button, so both import Button from shared UI. Only export needs filename().',
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
      'Putting filename() in a general utilities folder invites other features to depend on how export names its files.',
    practice:
      'Agree on folder boundaries with your team. A second caller that needs the same behavior gives you a reason to move a helper into shared code.',
    recap:
      'The route imports one component to offer clip export. Inside the feature, you can change the filename rule without touching the download request.',
    source: 'https://react.dev/learn/thinking-in-react',
    quiz: {
      question: 'Export is the only feature that calls filename(). Where would you put it?',
      options: [
        'Alongside shared UI controls',
        'In the export folder',
        'In each route that opens the dialog',
      ],
      answer: 1,
      explanation:
        'Keeping filename() beside the export dialog puts both ends of a filename change in one folder. You can still share it if another feature needs it.',
    },
  },
  {
    slug: 'component-boundaries',
    trackId: 'architecture',
    title: 'Component responsibilities and boundaries',
    mode: 'tree',
    objective:
      'Decide which component loads clips, which one filters them, and what a row needs to open a clip.',
    steps: [
      step(
        'Look inside LibraryPage',
        'LibraryPage loads clips, keeps the search term, and renders editable rows. A change to how a row opens has little to do with how the page fetches its clips.',
        'const clips = useClips();\nconst [query, setQuery] = useState("");',
        [node('page', 'LibraryPage', 'active', 'load + filter + rows')],
      ),
      step(
        'Pull out one clip row',
        'ClipRow takes a clip and calls onOpen with its ID when clicked. Search results and collection views can both use that row and decide for themselves what to open.',
        'type RowProps = { clip: Clip; onOpen: (id: string) => void };\nfunction ClipRow({ clip, onOpen }: RowProps) {\n  return <button onClick={() => onOpen(clip.id)}>{clip.title}</button>;\n}',
        [node('page', 'LibraryPage', 'kept'), node('row', 'ClipRow', 'added', 'clip + onOpen')],
        [['page', 'row']],
      ),
      step(
        'Keep the query with both callers',
        'SearchInput changes the query. Results needs the new value to filter the clips. LibraryFilter sits above both components and can keep the query in state.',
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
        'Let the page handle the request',
        'LibraryPage shows a skeleton while the clips load and a retry button if the request fails. Once the clips arrive, it passes the array to LibraryFilter.',
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
        'Test the filter on its own',
        'Give LibraryFilter two clips, then type Rain in the search box. You can check which row stays visible without making a network request.',
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
      'If the search box and each line of its markup have separate files, following one keystroke can take several jumps through the code.',
    practice:
      'Extract a component when you can name the job it does. A row can decide what to show for one clip even if several screens use it.',
    recap:
      'LibraryPage can hand LibraryFilter a list without knowing how it filters. LibraryFilter can render a row without knowing where opening it will take the listener.',
    source: 'https://react.dev/learn/thinking-in-react',
    quiz: {
      question: 'SearchInput changes the query and Results reads it. Where should the query live?',
      options: [
        'Each result row',
        'In LibraryFilter, their nearest shared parent',
        'A module-level mutable variable',
      ],
      answer: 1,
      explanation:
        'LibraryFilter can give SearchInput the current value and a change handler. It uses that same value to choose the rows for Results.',
    },
  },
  {
    slug: 'context-providers',
    trackId: 'architecture',
    title: 'Context and providers',
    mode: 'tree',
    objective:
      'Work out why one row shows 01:30 while a row in the editor shows 90s for the same clip.',
    steps: [
      step(
        'Choose a default format',
        'The default for TimeContext is seconds. ClipRow gets that value whenever it has no matching provider above it. The default itself stays fixed.',
        'type TimeFormat = "seconds" | "clock";\nconst TimeContext = createContext<TimeFormat>("seconds");',
        [node('default', 'Fallback', 'active', 'seconds'), node('row', 'ClipRow', 'kept')],
        [['default', 'row']],
      ),
      step(
        'Set the library format',
        'The library provider sets the format to clock for its descendants. Components between the provider and ClipRow can leave the format out of their props.',
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
        'Read the closest provider',
        'ClipRow looks up TimeContext above itself. If ClipRow returns another provider, that provider changes what its children read.',
        'const format = useContext(TimeContext);\nreturn <time>{formatDuration(clip.duration, format)}</time>;',
        [node('provider', 'Provider', 'kept', 'clock'), node('row', 'ClipRow', 'active', '01:30')],
        [['provider', 'row']],
      ),
      step(
        'Give the editor its own format',
        'Inside the editor, a second provider sets the format to seconds. A library row outside the editor still displays 01:30.',
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
        'Switch the library to seconds',
        'Changing the outer provider updates the library rows that read it. Those rows still receive context updates if you wrap them in memo. The editor reads its own provider.',
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
      'If you pass a fresh object as the provider value on every render, consumers can re-render even when all its fields stayed the same.',
    practice:
      'A prop works well when the component that needs the format is close by. Context helps when many rows deeper in the tree need the same preference.',
    recap:
      'React finds the closest matching provider above each row. It uses Object.is to compare the old and new values when that provider renders again.',
    source: 'https://react.dev/reference/react/useContext',
    quiz: {
      question:
        'The library provides clock time and the editor inside it provides seconds. Which format does EditorRow read?',
      options: [
        'The library’s clock format',
        'The editor’s seconds format',
        'A combination of both formats',
      ],
      answer: 1,
      explanation:
        'The editor is the first matching provider above EditorRow, so a 90-second clip displays as 90s.',
    },
  },
  {
    slug: 'accessible-ui-systems',
    trackId: 'architecture',
    title: 'Reusable, accessible UI systems',
    mode: 'layers',
    objective:
      'Build a Recording details button that opens its own panel and tells screen readers whether the panel is open.',
    steps: [
      step(
        'Start with a button',
        'A native button can receive focus, and Enter or Space activates it. Set type="button" so opening the details inside a form leaves the form unsubmitted.',
        '<button type="button">Recording details</button>',
        [node('control', 'Button', 'added', 'focusable')],
      ),
      step(
        'Keep one open flag',
        'Use the same boolean to show the panel and to tell assistive technology whether the button is expanded.',
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
        'Point the button at its panel',
        'Give this instance its own panel ID with useId. Set aria-controls to that ID and aria-expanded to the current open flag.',
        'const panelId = useId();\n<button type="button" aria-controls={panelId}\n  aria-expanded={open} onClick={toggle}>{label}</button>',
        [
          node('control', 'Button', 'active', 'expanded: false'),
          node('panel', 'Panel', 'kept', 'unique ID'),
        ],
        [['control', 'panel']],
      ),
      step(
        'Show the caller’s content',
        'The caller supplies the panel contents as children. With the default browser styles, hidden takes the closed panel off screen and out of the accessibility tree.',
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
        'Put two disclosures on one page',
        'Give Recording details and License terms separate IDs and open flags. The label on each button names the panel it opens.',
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
      'A div with an onClick handler still needs extra code to receive keyboard focus and respond to Enter and Space.',
    practice:
      'Start with label and children as props. If a parent needs to coordinate several panels, give it control over open as well.',
    recap:
      'Each Disclosure owns a button, a panel ID, and the flag that keeps the panel in sync with aria-expanded. Callers just supply the label and content.',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/',
    quiz: {
      question: 'Which attribute tells assistive technology that the disclosure is open?',
      options: ['aria-controls', 'aria-expanded', 'tabIndex'],
      answer: 1,
      explanation:
        'aria-expanded reports whether the panel is open. aria-controls points to the panel by ID.',
    },
  },
]
