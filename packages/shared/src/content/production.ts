import type { Lesson } from '../types.js';
import { node, step } from './scene.js';

export const production: Lesson[] = [
  {
    slug:'forms-and-validation',trackId:'production',title:'Forms and validation',mode:'flow',
    objective:'Preserve a clip title draft while validating it on both sides of a save request.',
    steps:[
      step('Keep a string draft','A controlled text input receives its current value from state. Start with an empty string for a new clip so it stays controlled throughout its lifetime.','const [title, setTitle] = useState("");\n<label>Clip title<input value={title}\n  onChange={e => setTitle(e.target.value)} /></label>',[node('input','Title field','active','empty'),node('draft','Draft','kept','""')],[['draft','input']]),
      step('Preserve edits as typed','Write the exact input value on change. Trimming on every keystroke would make typing a space between words frustrating. Normalize at submission instead.','onChange={event => setTitle(event.target.value)}',[node('input','Title field','active','Rain '),node('draft','Draft','active','Rain ')],[['input','draft']]),
      step('Validate at submission','Parse the normalized title with a shared schema. On failure, leave the draft in place and explain the rule beside the field.','const Title = z.string().trim().min(1).max(80);\nconst result = Title.safeParse(title);\nif (!result.success) { setError("Enter 1 to 80 characters."); return; }',[node('draft','Draft','kept','spaces'),node('parse','Title schema','active'),node('error','Field error','added','1–80 characters')],[['draft','parse'],['parse','error']]),
      step('Name the error','Associate the message with its field and mark an invalid attempt. A visible label continues to identify the field after the user types.','<input id={id} value={title} onChange={handleChange}\n  aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />\n{error && <p id={errorId} role="alert">{error}</p>}',[node('input','Title field','active','invalid'),node('error','Message','active','linked description')],[['input','error']]),
      step('Validate the request again','Client checks help the author correct mistakes. The server still validates the untrusted request body and returns the saved record or a useful error. Only clear the draft on success.','const parsed = z.object({ title: Title }).safeParse(await c.req.json());\nif (!parsed.success) return c.json({ error: "Invalid title" }, 422);\nreturn c.json(await saveClip(parsed.data));',[node('draft','Draft','kept','Rain walk'),node('api','API schema','active'),node('saved','Saved clip','added','Rain walk')],[['draft','api'],['api','saved']]),
    ],
    pitfall:'Resetting the form before the save succeeds discards the user’s work on a network failure.',
    practice:'Handle the form’s submit event so Enter works. Distinguish a field correction from a retryable server failure.',
    recap:'Preserve the editable string, validate a submission, and let the server confirm what was saved.',
    source:'https://react.dev/reference/react-dom/components/input',
    quiz:{question:'Why validate the title on the server if the input already checks it?',options:['To update the caret position','Clients can bypass the form','To give the field a label'],answer:1,explanation:'The endpoint receives untrusted data from any caller and must enforce its own input contract.'},
  },
  {
    slug:'keyboard-interactions',trackId:'production',title:'Keyboard interactions and focus',mode:'flow',
    objective:'Navigate a two-tab clip inspector with one tab stop and predictable arrow-key behavior.',
    steps:[
      step('Name the tab list','Give the group an accessible name. Each tab controls a uniquely identified panel, and each panel is labelled by its tab.','<div role="tablist" aria-label="Clip inspector">{tabs}</div>',[node('group','Inspector','active','tablist'),node('summary','Summary','kept'),node('notes','Notes','kept')],[['group','summary'],['group','notes']]),
      step('Set the active tab stop','Only the selected tab is in the page’s normal Tab sequence. Tab enters the group once, while arrows move within it.','<button role="tab" id={tabId} aria-controls={panelId}\n  aria-selected={selected} tabIndex={selected ? 0 : -1}\n  onClick={() => select(index)}>{label}</button>',[node('before','Previous','kept'),node('summary','Summary','active','tabIndex 0'),node('notes','Notes','idle','tabIndex -1')],[['before','summary']]),
      step('Move focus deliberately','For automatic activation with already-loaded panels, Right Arrow moves focus and selection together. Implement Left Arrow in reverse and wrap at either end.','if (e.key === "ArrowRight" || e.key === "ArrowLeft") {\n  e.preventDefault();\n  const delta = e.key === "ArrowRight" ? 1 : -1;\n  const next = (index + delta + labels.length) % labels.length;\n  select(next); refs.current[next]?.focus();\n}',[node('summary','Summary','kept','tabIndex -1'),node('key','Right Arrow','active'),node('notes','Notes','active','focus + selection')],[['key','notes']]),
      step('Expose the selected panel','Show the panel whose tab is selected and hide the other one. For text-only panels, a focusable panel lets Tab move the reader straight into its content.','<section role="tabpanel" id={panelId} aria-labelledby={tabId}\n  hidden={!selected} tabIndex={0}>{children}</section>',[node('notes','Notes tab','active'),node('panel','Notes panel','added','visible'),node('other','Summary panel','idle','hidden')],[['notes','panel']]),
      step('Respect the next Tab','Do not intercept Tab to cycle within a tab list. Leave a visible focus indicator as the user moves onward. If switching is slow, use manual activation with Enter or Space.','button:focus-visible, [role="tabpanel"]:focus-visible {\n  outline: 3px solid currentColor;\n  outline-offset: 3px;\n}',[node('notes','Notes tab','kept'),node('panel','Notes panel','active','focused'),node('after','Next control','idle')],[['notes','panel'],['panel','after']]),
    ],
    pitfall:'Updating aria-selected without moving keyboard focus leaves arrow-key users on the wrong tab.',
    practice:'Use automatic activation when content is ready immediately. Test from the preceding control through the tab list and onward.',
    recap:'Tab moves between groups, arrow keys move within the tab list, and each selected tab identifies one visible panel.',
    source:'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    quiz:{question:'What should Tab do from the selected inspector tab?',options:['Move onward in normal focus order','Always select the next tab','Close the inspector'],answer:0,explanation:'Arrow keys handle movement inside a tab list. Tab moves to the next focusable content.'},
  },
  {
    slug:'testing-react',trackId:'production',title:'Testing React applications',mode:'timeline',
    objective:'Write a test that catches a broken rename interaction while tolerating internal refactors.',
    steps:[
      step('Choose an observable promise','A listener can rename a clip and see the new title after saving. Use that promise as the test boundary instead of testing a private state setter.','const user = userEvent.setup();\nrender(<ClipEditor initialTitle="Rain" onSave={saveClip} />);',[node('user','Listener','kept'),node('editor','ClipEditor','active','Rain')],[['user','editor']]),
      step('Locate by accessible name','A role and name describe how a user finds a control. The query also catches a missing field label.','const title = screen.getByRole("textbox", { name: "Clip title" });',[node('editor','ClipEditor','kept'),node('field','Clip title','active','textbox')],[['editor','field']]),
      step('Perform the interaction','Await each user-event action. Clearing the old title, typing, and activating Save exercise the same handlers the interface exposes.','await user.clear(title);\nawait user.type(title, "Drizzle");\nawait user.click(screen.getByRole("button", { name: "Save" }));',[node('field','Clip title','active','Drizzle'),node('button','Save','active','click'),node('save','Save clip','added')],[['field','button'],['button','save']]),
      step('Wait for the result','Use findByRole for UI that appears after the asynchronous save. Assert the result the listener can observe.','const heading = await screen.findByRole("heading", { name: "Drizzle" });\nexpect(heading).toBeVisible();',[node('save','Save clip','kept','resolved'),node('heading','Drizzle','added','visible heading')],[['save','heading']]),
      step('Cover the failed save','In a second test make the save reject. Verify the retry message and the surviving draft. A browser test can separately cover the real service and reload.','expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");\nexpect(title).toHaveValue("Drizzle");',[node('save','Save clip','removed','rejected'),node('alert','Save error','added'),node('field','Draft','kept','Drizzle')],[['save','alert']]),
    ],
    pitfall:'A fixed timeout slows a fast run and can still fail on a slow run.',
    practice:'Use getBy for present elements, findBy for expected asynchronous appearances, and queryBy when asserting absence.',
    recap:'Exercise the user’s action and wait for its visible consequence. Put persistence and integration risks in a browser test.',
    source:'https://testing-library.com/docs/queries/about/',
    quiz:{question:'Which query waits for a heading that appears after saving?',options:['getByRole','queryByRole','findByRole'],answer:2,explanation:'findByRole retries until the matching element appears or the wait times out.'},
  },
  {
    slug:'resilient-interfaces',trackId:'production',title:'Error boundaries and resilient interfaces',mode:'tree',
    objective:'Keep a clip library usable when its preview is loading, fails to render, or fails during a user action.',
    steps:[
      step('Choose the failure boundary','A preview failure should leave the clip list available. Wrap the preview subtree in a boundary that owns its fallback.','<ClipList />\n<PreviewBoundary key={clip.id}><Preview clip={clip} /></PreviewBoundary>',[node('page','Library','kept'),node('list','ClipList','kept'),node('boundary','Boundary','added'),node('preview','Preview','kept')],[['page','list'],['page','boundary'],['boundary','preview']]),
      step('Handle a render failure','A class boundary can derive fallback state when a descendant throws during render. Add componentDidCatch separately if the error should be reported.','class PreviewBoundary extends Component<PropsWithChildren, { failed: boolean }> {\n  state = { failed: false };\n  static getDerivedStateFromError() { return { failed: true }; }\n  render() { return this.state.failed ? <PreviewError /> : this.props.children; }\n}',[node('preview','Preview','removed','threw'),node('boundary','Boundary','active'),node('error','Preview error','added')],[['preview','boundary'],['boundary','error']]),
      step('Treat waiting separately','A lazy decoder view can suspend while its module loads. Place Suspense inside the error boundary so waiting and failure get different UI.','<PreviewBoundary key={clip.id}>\n  <Suspense fallback={<PreviewSkeleton />}>\n    <DecoderView clip={clip} />\n  </Suspense>\n</PreviewBoundary>',[node('boundary','Boundary','kept'),node('wait','Suspense','active'),node('loading','Skeleton','added')],[['boundary','wait'],['wait','loading']]),
      step('Catch an event failure','An error boundary will not ordinarily catch a rejected promise in a click handler. Catch that failure where the export action runs and expose a retry.','async function handleExport() {\n  try { await exportClip(clip); setMessage(""); }\n  catch { setMessage("Export failed. Try again."); }\n}',[node('click','Export','active'),node('reject','Request','removed','rejected'),node('message','Retry notice','added')],[['click','reject'],['reject','message']]),
      step('Reset on a new clip','Selecting another clip changes the boundary key. React mounts a fresh boundary, allowing the new preview to try rendering while the library stays in place.','<PreviewBoundary key={nextClip.id}>\n  <Preview clip={nextClip} />\n</PreviewBoundary>',[node('list','ClipList','kept'),node('old','Old boundary','removed'),node('new','New boundary','added'),node('preview','Preview','active','next clip')],[['new','preview']]),
    ],
    pitfall:'Wrapping the entire application in one boundary can turn a broken optional preview into a blank workspace.',
    practice:'Choose a fallback size users can recover from. Keep useful existing content visible during background updates when possible.',
    recap:'Use Suspense for supported pending work, boundaries for descendant render failures, and action-level handling for rejected user operations.',
    source:'https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary',
    quiz:{question:'Where should an export button handle a rejected request in its click handler?',options:['In a Suspense fallback','In the action’s error-handling path','Only in getDerivedStateFromError'],answer:1,explanation:'A click handler runs outside descendant rendering. It should handle its asynchronous failure and update the UI.'},
  },
];
