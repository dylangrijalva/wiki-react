import type { Lesson } from '../types.js'
import { node, step } from './scene.js'

export const production: Lesson[] = [
  {
    slug: 'forms-and-validation',
    trackId: 'production',
    title: 'Forms and validation',
    mode: 'flow',
    objective:
      'Let someone edit a clip title and keep their draft if the form or the server rejects it.',
    steps: [
      step(
        'Start with an empty title',
        'The input displays whatever string is in title. For a new clip, start with an empty string so React controls the input from its first render.',
        'const [title, setTitle] = useState("");\n<label>Clip title<input value={title}\n  onChange={e => setTitle(e.target.value)} /></label>',
        [node('input', 'Title field', 'active', 'empty'), node('draft', 'Draft', 'kept', '""')],
        [['draft', 'input']],
      ),
      step(
        'Keep the space after Rain',
        'Copy the input value into state as the person types. If you trim after every keystroke, the space after Rain disappears before they can type walk. Trim when they submit the title.',
        '<input value={title} onChange={event => setTitle(event.target.value)} />',
        [
          node('input', 'Title field', 'active', 'Rain '),
          node('draft', 'Draft', 'active', 'Rain '),
        ],
        [['input', 'draft']],
      ),
      step(
        'Check the submitted title',
        'Handle the form’s submit event so clicking Save and pressing Enter run the same check. A title that trims to an empty string fails. Keep the draft in the field and explain the 1-to-80-character limit beside it.',
        'const Title = z.string().trim().min(1).max(80);\nfunction submit(e: React.FormEvent<HTMLFormElement>) {\n  e.preventDefault();\n  const result = Title.safeParse(title);\n  if (result.success) return saveTitle(result.data);\n  setError("Enter 1 to 80 characters.");\n}',
        [
          node('draft', 'Draft', 'kept', 'spaces'),
          node('parse', 'Title schema', 'active'),
          node('error', 'Field error', 'added', '1 to 80 characters'),
        ],
        [
          ['draft', 'parse'],
          ['parse', 'error'],
        ],
      ),
      step(
        'Link the field to its error',
        'Use aria-invalid to mark the field after an invalid submission and aria-describedby to point to its error message. The visible Clip title label stays in place while the person types.',
        '<>\n  <label htmlFor={id}>Clip title</label>\n  <input id={id} value={title} onChange={handleChange}\n    aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />\n  {error && <p id={errorId} role="alert">{error}</p>}\n</>',
        [
          node('input', 'Title field', 'active', 'invalid'),
          node('error', 'Message', 'active', 'field description'),
        ],
        [['input', 'error']],
      ),
      step(
        'Check the request on the server',
        'The form catches mistakes before sending the request. The server must still check the JSON and the title because callers can send requests directly. Return the saved clip or an error, and clear the draft only after the save succeeds.',
        'const body: unknown = await c.req.json().catch(() => undefined);\nif (body === undefined) return c.json({ error: "Invalid JSON" }, 400);\nconst parsed = z.object({ title: Title }).safeParse(body);\nif (!parsed.success) return c.json({ error: "Invalid title" }, 422);\nreturn c.json(await saveClip(parsed.data));',
        [
          node('draft', 'Draft', 'kept', 'Rain walk'),
          node('api', 'API schema', 'active'),
          node('saved', 'Saved clip', 'added', 'Rain walk'),
        ],
        [
          ['draft', 'api'],
          ['api', 'saved'],
        ],
      ),
    ],
    pitfall:
      'If you clear the input when the request starts, a lost connection leaves the person with an empty field and an unsaved title.',
    practice:
      'Use the form’s submit handler for keyboard and pointer input. A title that’s too long needs an edit. A network failure needs a way to retry.',
    recap:
      'Keep exactly what the person typed in the field. Validate the trimmed title on submit, then wait for the server to confirm the save before discarding the draft.',
    source: 'https://react.dev/reference/react-dom/components/input',
    quiz: {
      question: 'Why check the title on the server when the form already validates it?',
      options: [
        'To update the caret position',
        'Clients can bypass the form',
        'To give the field a label',
      ],
      answer: 1,
      explanation:
        'A caller can send a request directly to the endpoint. The server has to enforce the same title rules even when the form never ran.',
    },
  },
  {
    slug: 'keyboard-interactions',
    trackId: 'production',
    title: 'Keyboard interactions and focus',
    mode: 'flow',
    objective:
      'Use Tab and the arrow keys to move between the Summary and Notes panels of a clip inspector.',
    steps: [
      step(
        'Name the tab list',
        'Name the group Clip inspector. Give every panel its own ID so each tab can point to its panel, and use the tab as that panel’s accessible label.',
        '<div role="tablist" aria-label="Clip inspector">{tabs}</div>',
        [
          node('group', 'Inspector', 'active', 'tablist'),
          node('summary', 'Summary', 'kept'),
          node('notes', 'Notes', 'kept'),
        ],
        [
          ['group', 'summary'],
          ['group', 'notes'],
        ],
      ),
      step(
        'Give the group one tab stop',
        'Only the selected tab has tabIndex 0. Pressing Tab brings you into the group once. The arrow keys move you from one tab to the other.',
        '<button role="tab" id={tabId} aria-controls={panelId}\n  aria-selected={selected} tabIndex={selected ? 0 : -1}\n  onClick={() => select(index)}>{label}</button>',
        [
          node('before', 'Previous', 'kept'),
          node('summary', 'Summary', 'active', 'tabIndex 0'),
          node('notes', 'Notes', 'idle', 'tabIndex -1'),
        ],
        [['before', 'summary']],
      ),
      step(
        'Move from Summary to Notes',
        'When both panels are already loaded, Right Arrow can focus and select Notes in one move. Left Arrow moves the other way. At either end, wrap to the opposite tab.',
        'if (e.key === "ArrowRight" || e.key === "ArrowLeft") {\n  e.preventDefault();\n  const delta = e.key === "ArrowRight" ? 1 : -1;\n  const next = (index + delta + labels.length) % labels.length;\n  select(next); refs.current[next]?.focus();\n}',
        [
          node('summary', 'Summary', 'kept', 'tabIndex -1'),
          node('key', 'Right Arrow', 'active'),
          node('notes', 'Notes', 'active', 'focus + selection'),
        ],
        [['key', 'notes']],
      ),
      step(
        'Show the selected panel',
        'Selecting Notes shows its panel and hides Summary. A text-only panel has no controls to tab to, so give the panel tabIndex 0 to let the next Tab reach its content.',
        '<section role="tabpanel" id={panelId} aria-labelledby={tabId}\n  hidden={!selected} tabIndex={0}>{children}</section>',
        [
          node('notes', 'Notes tab', 'active'),
          node('panel', 'Notes panel', 'added', 'visible'),
          node('other', 'Summary panel', 'idle', 'hidden'),
        ],
        [['notes', 'panel']],
      ),
      step(
        'Let Tab leave the group',
        'Leave Tab to the browser so focus can move on, with a visible focus ring. If switching panels takes time, let arrow keys move focus and have Enter or Space activate the focused tab.',
        'const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2";\n<section role="tabpanel" id={panelId} aria-labelledby={tabId}\n  hidden={!selected} tabIndex={0} className={focusRing}>{children}</section>',
        [
          node('notes', 'Notes tab', 'kept'),
          node('panel', 'Notes panel', 'active', 'focused'),
          node('after', 'Next control', 'idle'),
        ],
        [
          ['notes', 'panel'],
          ['panel', 'after'],
        ],
      ),
    ],
    pitfall:
      'If your arrow handler changes aria-selected but leaves focus on Summary, the screen can show Notes while the keyboard user is still on the old tab.',
    practice:
      'Use automatic activation when a panel is ready to show immediately. Start on the control before the inspector, then navigate through the tabs and out the other side using just the keyboard.',
    recap:
      'Arrow keys move between the inspector tabs. The selected tab names the visible panel, and Tab continues through the page in focus order.',
    source: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    quiz: {
      question: 'With focus on the selected inspector tab, where should pressing Tab take you?',
      options: [
        'To the next element in the page’s focus order',
        'To the next tab in the inspector',
        'Out of the inspector by closing it',
      ],
      answer: 0,
      explanation:
        'Arrow keys move within the tab list. In this inspector, Tab moves from the selected tab to its focusable panel.',
    },
  },
  {
    slug: 'testing-react',
    trackId: 'production',
    title: 'Testing React applications',
    mode: 'timeline',
    objective:
      'Test a clip rename through the form so you can refactor the editor without rewriting the test.',
    steps: [
      step(
        'Start with a clip called Rain',
        'Render the editor with a clip named Rain and a save function that resolves. A listener should be able to rename the clip and see the saved title. That gives the test something to check even if the editor changes how it stores state.',
        'const user = userEvent.setup();\nconst saveClip = vi.fn(async (title: string) => ({ title }));\nrender(<ClipEditor initialTitle="Rain" onSave={saveClip} />);',
        [node('user', 'Listener', 'kept'), node('editor', 'ClipEditor', 'active', 'Rain')],
        [['user', 'editor']],
      ),
      step(
        'Find the title field',
        'Look up the textbox named Clip title. If the field loses its accessible name, this query catches the problem.',
        'const title = screen.getByRole("textbox", { name: "Clip title" });',
        [node('editor', 'ClipEditor', 'kept'), node('field', 'Clip title', 'active', 'textbox')],
        [['editor', 'field']],
      ),
      step(
        'Rename the clip',
        'Clear Rain, type Drizzle, and click Save. Await each user-event call so one interaction finishes before the next starts. That exercises the same handlers a listener uses to edit and save a clip.',
        'await user.clear(title);\nawait user.type(title, "Drizzle");\nawait user.click(screen.getByRole("button", { name: "Save" }));',
        [
          node('field', 'Clip title', 'active', 'Drizzle'),
          node('button', 'Save', 'active', 'click'),
          node('save', 'Save clip', 'added'),
        ],
        [
          ['field', 'button'],
          ['button', 'save'],
        ],
      ),
      step(
        'Wait for Drizzle to appear',
        'The heading changes after the save resolves. Use findByRole to wait for a heading named Drizzle, then check that the listener can see it.',
        'const heading = await screen.findByRole("heading", { name: "Drizzle" });\nexpect(heading).toBeVisible();',
        [
          node('save', 'Save clip', 'kept', 'resolved'),
          node('heading', 'Drizzle', 'added', 'visible heading'),
        ],
        [['save', 'heading']],
      ),
      step(
        'Try an offline save',
        'In a separate test, make the save promise reject. Check for an error that lets the listener know they can try again, and make sure Drizzle is still in the field. A browser test can cover saving through the real service and reloading.',
        'saveClip.mockRejectedValueOnce(new Error("Offline"));\nawait user.click(screen.getByRole("button", { name: "Save" }));\nexpect(await screen.findByRole("alert")).toHaveTextContent("Could not save");\nexpect(title).toHaveValue("Drizzle");',
        [
          node('save', 'Save clip', 'removed', 'rejected'),
          node('alert', 'Save error', 'added'),
          node('field', 'Draft', 'kept', 'Drizzle'),
        ],
        [['save', 'alert']],
      ),
    ],
    pitfall: 'A fixed delay makes a fast save wait and can still finish before a slow save does.',
    practice:
      'Use getBy when the element should already be there and findBy when you expect it to appear. Use queryBy to check that an element is absent.',
    recap:
      'The rename test waits for the same result the listener sees. To check that the new title survives a reload, run the flow in a browser against the real service.',
    source: 'https://testing-library.com/docs/queries/about/',
    quiz: {
      question: 'Which query waits for a heading that appears after saving?',
      options: ['getByRole', 'queryByRole', 'findByRole'],
      answer: 2,
      explanation:
        'findByRole retries the lookup until the heading appears or the query times out.',
    },
  },
  {
    slug: 'resilient-interfaces',
    trackId: 'production',
    title: 'Error boundaries and resilient interfaces',
    mode: 'tree',
    objective:
      'Keep the clip list on screen while a preview loads. Give the listener a way to recover from a failed preview or export.',
    steps: [
      step(
        'Wrap the preview',
        'Keep ClipList outside PreviewBoundary. If Preview throws while rendering, the boundary can replace the preview and the listener can still choose another clip.',
        '<>\n  <ClipList />\n  <PreviewBoundary key={clip.id}><Preview clip={clip} /></PreviewBoundary>\n</>',
        [
          node('page', 'Library', 'kept'),
          node('list', 'ClipList', 'kept'),
          node('boundary', 'Boundary', 'added'),
          node('preview', 'Preview', 'kept'),
        ],
        [
          ['page', 'list'],
          ['page', 'boundary'],
          ['boundary', 'preview'],
        ],
      ),
      step(
        'Show a fallback after a render error',
        'When a descendant throws during render, getDerivedStateFromError sets failed to true and the class boundary renders PreviewError. Add componentDidCatch if you also want to report the error.',
        'class PreviewBoundary extends Component<PropsWithChildren, { failed: boolean }> {\n  state = { failed: false };\n  static getDerivedStateFromError() { return { failed: true }; }\n  render() { return this.state.failed ? <PreviewError /> : this.props.children; }\n}',
        [
          node('preview', 'Preview', 'removed', 'threw'),
          node('boundary', 'Boundary', 'active'),
          node('error', 'Preview error', 'added'),
        ],
        [
          ['preview', 'boundary'],
          ['boundary', 'error'],
        ],
      ),
      step(
        'Show a skeleton while the decoder loads',
        'A lazy DecoderView can suspend while its module loads. Put Suspense inside PreviewBoundary. It can show the skeleton while loading, and the outer boundary can handle a failure.',
        '<PreviewBoundary key={clip.id}>\n  <Suspense fallback={<PreviewSkeleton />}>\n    <DecoderView clip={clip} />\n  </Suspense>\n</PreviewBoundary>',
        [
          node('boundary', 'Boundary', 'kept'),
          node('wait', 'Suspense', 'active'),
          node('loading', 'Skeleton', 'added'),
        ],
        [
          ['boundary', 'wait'],
          ['wait', 'loading'],
        ],
      ),
      step(
        'Catch a failed export',
        'The preview boundary handles render errors. If exportClip rejects in this click handler, catch the rejection here and tell the listener they can try again.',
        'async function handleExport() {\n  try { await exportClip(clip); setMessage(""); }\n  catch { setMessage("Export failed. Try again."); }\n}',
        [
          node('click', 'Export', 'active'),
          node('reject', 'Request', 'removed', 'rejected'),
          node('message', 'Retry notice', 'added'),
        ],
        [
          ['click', 'reject'],
          ['reject', 'message'],
        ],
      ),
      step(
        'Try the next clip',
        'Selecting another clip changes the boundary’s key. React mounts a fresh boundary and tries to render the new preview. ClipList stays mounted throughout.',
        '<PreviewBoundary key={nextClip.id}>\n  <Preview clip={nextClip} />\n</PreviewBoundary>',
        [
          node('list', 'ClipList', 'kept'),
          node('old', 'Old boundary', 'removed'),
          node('new', 'New boundary', 'added'),
          node('preview', 'Preview', 'active', 'next clip'),
        ],
        [['new', 'preview']],
      ),
    ],
    pitfall:
      'With a single boundary around the whole app, one broken preview can take the clip list off screen too.',
    practice:
      'Put the fallback around the part the listener can recover from. During a background update, keep the last usable content visible when you can.',
    recap:
      'Suspense can show a skeleton while the decoder loads. PreviewBoundary can replace a preview that throws during render. The export handler catches its own failed request.',
    source:
      'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
    quiz: {
      question:
        'exportClip rejects after someone clicks Export. Where should this button handle the failure?',
      options: [
        'In the Suspense fallback',
        'In a catch block in the export handler',
        'Only in getDerivedStateFromError',
      ],
      answer: 1,
      explanation:
        'The export runs in a click handler, outside rendering. Catch the failed request there so the button can show a retry message.',
    },
  },
]
