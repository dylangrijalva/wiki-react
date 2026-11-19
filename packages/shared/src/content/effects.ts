import type { Lesson } from '../contracts/catalog.js'
import { node, step } from './scene.js'

export const effects: Lesson[] = [
  {
    slug: 'effect-lifecycle',
    trackId: 'effects',
    title: 'The useEffect lifecycle',
    mode: 'timeline',
    objective: 'Follow a radio subscription as its station changes and its player unmounts.',
    steps: [
      step(
        'Render the station',
        'Radio reads stationId to render the heading. If it opened the stream during render, a render that React later discarded could leave that stream open.',
        'function Radio({ stationId }: { stationId: string }) {\n  useStation(stationId);\n  return <h2>{stationId}</h2>;\n}',
        [node('radio', 'Radio', 'active', 'FM 88'), node('stream', 'Stream', 'idle', 'closed')],
      ),
      step(
        'Run setup after commit',
        'Once React commits Radio to the screen, the Effect connects to FM 88. Its cleanup function remembers the stream that this setup opened.',
        'useEffect(() => {\n  const stream = connect(stationId);\n  return () => stream.close();\n}, [stationId]);',
        [
          node('commit', 'Commit', 'kept', 'FM 88'),
          node('setup', 'Setup', 'active'),
          node('stream', 'FM 88', 'added', 'connected'),
        ],
        [
          ['commit', 'setup'],
          ['setup', 'stream'],
        ],
      ),
      step(
        'Turn up the volume',
        'A volume change can render Radio again with stationId still set to FM 88. React compares that dependency with Object.is, so this render leaves the connection open.',
        '<Radio stationId="FM 88" />',
        [
          node('render', 'Render', 'active', 'same station'),
          node('stream', 'FM 88', 'kept', 'connected'),
        ],
      ),
      step(
        'Disconnect FM 88',
        'Switch to FM 92. After React commits the change, it calls the previous cleanup, which still has the FM 88 stream and closes it.',
        '// Cleanup captured by the FM 88 setup\nreturn () => stream.close();',
        [node('commit', 'Commit', 'active', 'FM 92'), node('old', 'FM 88', 'removed', 'closed')],
        [['commit', 'old']],
      ),
      step(
        'Connect to FM 92',
        'With FM 88 disconnected, the new setup opens FM 92. The player should now have just one stream open.',
        'const stream = connect(stationId); // FM 92',
        [
          node('old', 'FM 88', 'removed', 'closed'),
          node('setup', 'Setup', 'active'),
          node('new', 'FM 92', 'added', 'connected'),
        ],
        [['setup', 'new']],
      ),
      step(
        'Unmount the player',
        'When you remove Radio, its last cleanup closes FM 92. In development, Strict Mode can also run an extra setup and cleanup on mount to check that the two match.',
        '{showRadio && <Radio stationId={stationId} />}',
        [node('radio', 'Radio', 'removed', 'unmounted'), node('new', 'FM 92', 'removed', 'closed')],
        [['radio', 'new']],
      ),
    ],
    pitfall:
      'Leave stationId out of the dependency array and the player can keep streaming FM 88 while the heading says FM 92.',
    practice:
      'Open the stream and return the cleanup that closes it in the same Effect. List every reactive value the setup or cleanup reads as a dependency.',
    recap:
      'Each setup starts one subscription. When the station changes, React closes the old stream before opening the next. Removing the player closes its last stream.',
    source: 'https://react.dev/reference/react/useEffect',
    quiz: {
      question:
        'React has committed the switch from FM 88 to FM 92. Which Effect function runs first?',
      options: ['Setup for FM 92', 'Cleanup for FM 88', 'Both setups at once'],
      answer: 1,
      explanation:
        'Cleanup still has the connection from the FM 88 setup. React lets it close that stream before starting FM 92.',
    },
  },
  {
    slug: 'avoiding-effects',
    trackId: 'effects',
    title: 'Avoiding unnecessary Effects',
    mode: 'compare',
    objective:
      'Decide which parts of a clip library need an Effect, from filtering titles to changing the player volume.',
    steps: [
      step(
        'Search for a clip',
        'Type a new query. On the first render, matches can still hold results for the previous search. The Effect then calls setMatches and triggers another update.',
        'useEffect(() => {\n  setMatches(clips.filter(c => c.title.includes(query)));\n}, [clips, query]);',
        [
          node('query', 'Query', 'active', 'wind'),
          node('view', 'Render', 'kept', 'old matches'),
          node('effect', 'Effect', 'added', 'setMatches'),
        ],
        [
          ['query', 'view'],
          ['view', 'effect'],
        ],
      ),
      step(
        'Filter during render',
        'The list depends only on clips and query. Filtering during render uses the latest values of both, so this render already has the right results.',
        'const matches = clips.filter(c => c.title.includes(query));',
        [
          node('query', 'Query', 'kept', 'wind'),
          node('clips', 'Clips', 'kept'),
          node('view', 'Matches', 'active', 'Wind'),
        ],
        [
          ['query', 'view'],
          ['clips', 'view'],
        ],
      ),
      step(
        'Buy the selected license',
        'Clicking Buy tells you exactly when to submit the purchase and which license the customer selected. The click handler has both pieces of information.',
        'async function handleBuy() {\n  await purchaseLicense(selectedId);\n}',
        [node('click', 'Buy click', 'active'), node('order', 'Purchase', 'added', 'one request')],
        [['click', 'order']],
      ),
      step(
        'Set the audio volume',
        'The audio element has a volume property of its own. An Effect can copy the current volume into that property whenever the React value changes.',
        'useEffect(() => {\n  if (audioRef.current) audioRef.current.volume = volume;\n}, [volume]);',
        [
          node('volume', 'Volume', 'active', '0.6'),
          node('effect', 'Effect', 'added'),
          node('audio', 'Audio', 'active', '0.6'),
        ],
        [
          ['volume', 'effect'],
          ['effect', 'audio'],
        ],
      ),
      step(
        'Switch clips in the trim editor',
        'Give TrimEditor the clip ID as its key. Choosing a different clip mounts a fresh editor and resets its local draft, including the trim points.',
        '<TrimEditor key={clip.id} clip={clip} />',
        [
          node('old', 'Old editor', 'removed', 'draft 2 to 8s'),
          node('new', 'New editor', 'added', 'initial draft'),
        ],
      ),
    ],
    pitfall:
      'A purchased flag stays in state after the click. An Effect that watches it can submit a purchase when the component mounts with that flag already set.',
    practice:
      'For a new feature, identify the cause first. A purchase has a particular click behind it. The audio volume needs to stay in sync however the React value changes.',
    recap:
      'Filtering belongs in render, and buying a license belongs in the click handler. The volume Effect keeps an external audio element in sync with React.',
    source: 'https://react.dev/learn/you-might-not-need-an-effect',
    quiz: {
      question:
        'As you type, the library shows how many clips match. Where should it get that count?',
      options: [
        'In an Effect with setCount',
        'During render from the filtered list',
        'In a second server request',
      ],
      answer: 1,
      explanation:
        'The render already has the filtered clips. Its array length gives the count for this search.',
    },
  },
  {
    slug: 'custom-hooks',
    trackId: 'effects',
    title: 'Custom hooks and reusable logic',
    mode: 'layers',
    objective:
      'Write the Shift-key listener once and let both the mixer and the trim editor use it independently.',
    steps: [
      step(
        'Watch the Shift key',
        'Both the mixer and the editor need to know whether Shift is down. Writing the keydown and keyup handlers in each component would duplicate the same work.',
        'const [shift, setShift] = useState(false);\nconst readShift = (event: KeyboardEvent) => setShift(event.shiftKey);',
        [
          node('mixer', 'Mixer', 'active', 'key events'),
          node('editor', 'Editor', 'active', 'key events'),
        ],
      ),
      step(
        'Write useShiftHeld',
        'Give the hook a name that starts with use and return a boolean for the current key state. Call the hook at the top level so its order stays the same on every render.',
        'function useShiftHeld() {\n  const [held, setHeld] = useState(false);\n  return held;\n}',
        [node('hook', 'useShiftHeld', 'added'), node('held', 'held', 'kept', 'false')],
        [['hook', 'held']],
      ),
      step(
        'Listen for keyup and blur',
        'Use the same listener for keydown and keyup. If the user switches windows before releasing Shift, blur clears held. Cleanup aborts the listeners registered by this Effect.',
        'useEffect(() => {\n  const key = (e: KeyboardEvent) => setHeld(e.shiftKey);\n  const reset = () => setHeld(false);\n  const controller = new AbortController();\n  const options = { signal: controller.signal };\n  window.addEventListener("keydown", key, options);\n  window.addEventListener("keyup", key, options);\n  window.addEventListener("blur", reset, options);\n  return () => controller.abort();\n}, []);',
        [
          node('window', 'Window', 'active'),
          node('hook', 'Listener', 'added'),
          node('held', 'held', 'active', 'true'),
        ],
        [
          ['window', 'hook'],
          ['hook', 'held'],
        ],
      ),
      step(
        'Use Shift in two places',
        'Mixer and Editor each call useShiftHeld. They listen to the same browser events, but each call has its own subscription and state. In Editor, holding Shift reduces the trim step to 0.01.',
        'function Editor() {\n  const precise = useShiftHeld();\n  return <TrimControl step={precise ? 0.01 : 1} />;\n}',
        [
          node('window', 'Window', 'kept'),
          node('mixer', 'Mixer hook', 'active', 'true'),
          node('editor', 'Editor hook', 'active', 'true'),
        ],
        [
          ['window', 'mixer'],
          ['window', 'editor'],
        ],
      ),
      step(
        'Close the editor',
        'Closing Editor removes its listeners. Mixer stays mounted and continues to receive key events through its own subscription.',
        '<>\n  {editing && <Editor />}\n  <Mixer />\n</>',
        [
          node('window', 'Window', 'kept'),
          node('mixer', 'Mixer hook', 'kept'),
          node('editor', 'Editor hook', 'removed'),
        ],
        [['window', 'mixer']],
      ),
    ],
    pitfall:
      'Calling useShiftHeld only inside an if statement can change Hook order between renders.',
    practice:
      'Give a custom hook one recognizable job, such as tracking Shift. If both components need one subscription and one value, call the hook once in their shared parent.',
    recap:
      'Mixer and Editor share the hook’s implementation. Each mounted component keeps its own key state and cleans up its own listeners.',
    source: 'https://react.dev/learn/reusing-logic-with-custom-hooks',
    quiz: {
      question: 'Mixer and Editor both call useShiftHeld. Which state do the two calls share?',
      options: [
        'One global Shift value',
        'One state value per browser event',
        'None. Each call keeps its own state.',
      ],
      answer: 2,
      explanation:
        'React associates each Hook call with its position in the component tree. Closing Editor leaves the Mixer call and its state in place.',
    },
  },
  {
    slug: 'fetching-and-caching',
    trackId: 'effects',
    title: 'Fetching, caching, and server state',
    mode: 'flow',
    objective:
      'Trace a clip collection through a cold request, a fresh cache hit, and a background refresh.',
    steps: [
      step(
        'Key the query by collection',
        'Include collectionId in the query key, along with any other input that changes which clips come back. Two library views requesting the same collection can then share its cache entry.',
        'const queryKey = ["clips", collectionId] as const;',
        [node('view', 'Library', 'active'), node('cache', 'Query key', 'added', 'clips / field')],
        [['view', 'cache']],
      ),
      step(
        'Request an uncached collection',
        'With this query enabled and the cache empty, the library is pending while it waits for the server. Even a 404 can resolve fetch, so check res.ok before reading the clips.',
        'const clips = useQuery({ queryKey, staleTime: 60_000,\n  queryFn: async ({ signal }) => {\n    const res = await fetch("/api/clips/" + encodeURIComponent(collectionId), { signal });\n    if (!res.ok) throw new Error("Could not load clips");\n    return parseClips(await res.json());\n  } });',
        [
          node('view', 'Library', 'active', 'pending'),
          node('cache', 'Cache', 'idle', 'empty'),
          node('api', 'Server', 'active', 'request'),
        ],
        [
          ['view', 'cache'],
          ['cache', 'api'],
        ],
      ),
      step(
        'Cache the returned clips',
        'The query caches the three clips from the response. The library receives that array and renders the rows. The one-minute staleTime starts with this successful update.',
        'if (clips.data) return <Rows clips={clips.data} />;',
        [
          node('api', 'Server', 'kept', '200'),
          node('cache', 'Cache', 'added', 'fresh'),
          node('view', 'Library', 'active', '3 clips'),
        ],
        [
          ['api', 'cache'],
          ['cache', 'view'],
        ],
      ),
      step(
        'Open the collection again',
        'Open a second view of the same collection within a minute. The data is still fresh unless something invalidated it. With the default mount behavior, the new view can show the clips without fetching again.',
        'useQuery({ queryKey, queryFn: loadClips, staleTime: 60_000 });',
        [
          node('view', 'Library', 'active', 'mount'),
          node('cache', 'Cache', 'kept', 'fresh hit'),
          node('api', 'Server', 'idle'),
        ],
        [['cache', 'view']],
      ),
      step(
        'Reopen after a minute',
        'Open the collection after the minute has passed, while the clips are still in the cache. The library can show those rows right away and fetch updates in the background.',
        '{clips.isFetching && <small>Refreshing…</small>}',
        [
          node('view', 'Library', 'kept', '3 clips'),
          node('cache', 'Cache', 'active', 'stale'),
          node('api', 'Server', 'active', 'refetch'),
        ],
        [
          ['cache', 'view'],
          ['cache', 'api'],
        ],
      ),
      step(
        'Handle a failed request',
        'If the first request runs out of retries, offer a retry button. If a later refresh fails, keep the last good rows visible and tell the reader the refresh failed.',
        'if (clips.isError && clips.data === undefined) {\n  return <button onClick={() => clips.refetch()}>Retry</button>;\n}',
        [
          node('api', 'Server', 'removed', 'failed'),
          node('cache', 'Cache', 'kept', 'last good rows'),
          node('view', 'Library', 'active', 'refresh warning'),
        ],
        [['cache', 'view']],
      ),
    ],
    pitfall:
      'A fixed key such as ["clips"] can show data for the wrong collection after the route changes.',
    practice:
      'Set staleTime to how long the clip list can reasonably stay fresh. A shorter window allows earlier refetches, which can mean more requests.',
    recap:
      'The collection ID gives each clip list its own cache entry. That entry can still be there when you reopen the library. Its freshness helps determine whether mounting the view triggers a fetch.',
    source: 'https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults',
    quiz: {
      question:
        'The library has three cached clips and starts a background refresh. What can it show while it waits?',
      options: [
        'Only a loading screen',
        'The clips from the last successful request',
        'A guaranteed fresh list',
      ],
      answer: 1,
      explanation:
        'The cached array is still available while isFetching is true. The library can keep all three rows on screen until it receives an update.',
    },
  },
]
