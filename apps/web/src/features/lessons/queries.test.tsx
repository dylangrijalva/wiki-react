import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { clientForTest } from '../../test/query-client'
import { useLesson } from './queries'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('rejects an incomplete lesson before it reaches the player or its query cache', async () => {
  const { client, wrapper } = clientForTest()
  vi.stubGlobal('fetch', async () => Response.json({ slug: 'how-react-renders', steps: [] }))
  const { result } = renderHook(() => useLesson('how-react-renders'), { wrapper })
  await waitFor(() => expect(result.current.isFetching).toBe(false))
  expect(result.current.isError).toBe(true)
  expect(client.getQueryData(['lesson', 'how-react-renders'])).toBeUndefined()
})
