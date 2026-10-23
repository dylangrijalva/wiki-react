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
    idle: 'The library has no data for this key. Open the collection to request it.',
    pending: 'The first request is in flight. The list shows its loading state.',
    fresh: hit
      ? 'Another observer reads fresh cached data without starting a request.'
      : 'The response populated the cache. The list can display the clips.',
    refreshing: 'The list keeps its cached clips while the new request runs.',
    error: 'The first request failed. No cached list exists yet. Open the collection to retry.',
    stale: 'The freshness window elapsed. A new observer can trigger a background refetch.',
    refreshError:
      'Refresh failed. The earlier data is still available, and the UI can report the refresh error.',
  }
  return (
    <Lab
      title="Follow a collection query"
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
              Expire freshness
            </button>
          )}
        </>
      }
      result={result[phase]}
    />
  )
}
