import { useState } from 'react'
import { Lab, node } from './Lab'
type RequestState = 'idle' | 'pending' | 'fresh' | 'refreshing' | 'error' | 'stale' | 'refreshError'
export default function Fetching() {
  const [phase, setPhase] = useState<RequestState>('idle')
  const [hit, setHit] = useState(false)
  const requesting = phase === 'pending' || phase === 'refreshing'
  const cached = ['fresh', 'stale', 'refreshing', 'refreshError'].includes(phase)
  function request() {
    setHit(phase === 'fresh')
    if (phase !== 'fresh') setPhase(cached ? 'refreshing' : 'pending')
  }
  const result: Record<RequestState, string> = {
    idle: 'The cache is empty for this collection. Open it to fetch the clips.',
    pending: 'The list shows a loading indicator while it waits for the first response.',
    fresh: hit
      ? 'Opening the collection again reads fresh clips from the cache. The server gets no new request.'
      : 'The server returned the clips. The list reads them from the cache.',
    refreshing: 'The cached clips stay on screen while the library fetches an update.',
    error: 'The first request failed, so the cache is still empty. Reopen the collection to retry.',
    stale: 'The cached clips are now stale. Reopen the collection to trigger a background refetch.',
    refreshError:
      'The refresh failed. The list can show the error and keep the cached clips on screen.',
  }
  return (
    <Lab
      title="Fetch a clip collection"
      mode="flow"
      scene={{
        nodes: [
          node(
            'screen',
            'Clip library',
            cached
              ? 'show cached clips'
              : phase === 'error'
                ? 'show error'
                : requesting
                  ? 'loading…'
                  : 'empty',
            cached ? 'kept' : 'active',
          ),
          node(
            'cache',
            'Query cache',
            cached ? (phase === 'fresh' ? 'fresh' : 'stale') : 'no data',
            hit ? 'kept' : cached ? 'added' : 'idle',
          ),
          node(
            'server',
            'Server',
            requesting
              ? 'fetching…'
              : phase === 'error' || phase === 'refreshError'
                ? 'failed'
                : 'ready',
            requesting
              ? 'active'
              : phase === 'error' || phase === 'refreshError'
                ? 'removed'
                : 'idle',
          ),
        ],
        edges: requesting
          ? [
              ['screen', 'cache'],
              ['cache', 'server'],
            ]
          : cached
            ? [['cache', 'screen']]
            : [],
      }}
      controls={
        <>
          <button onClick={request} disabled={requesting}>
            Open collection
          </button>
          {requesting ? (
            <>
              <button onClick={() => setPhase('fresh')}>Resolve request</button>
              <button onClick={() => setPhase(cached ? 'refreshError' : 'error')}>
                Fail request
              </button>
            </>
          ) : (
            <button
              disabled={phase !== 'fresh'}
              onClick={() => {
                setPhase('stale')
                setHit(false)
              }}
            >
              Mark cache stale
            </button>
          )}
        </>
      }
      result={result[phase]}
    />
  )
}
