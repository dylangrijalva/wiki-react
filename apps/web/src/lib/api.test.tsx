import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { useBookmark, useLesson, useProgress, useSaveProgress } from './api'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function clientForTest() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

it('rejects an incomplete lesson before it reaches the player or its query cache', async () => {
  const { client, wrapper } = clientForTest()
  vi.stubGlobal('fetch', async () => Response.json({ slug: 'how-react-renders', steps: [] }))
  const { result } = renderHook(() => useLesson('how-react-renders'), { wrapper })
  await waitFor(() => expect(result.current.isFetching).toBe(false))
  expect(result.current.isError).toBe(true)
  expect(client.getQueryData(['lesson', 'how-react-renders'])).toBeUndefined()
})

it('rejects malformed private writes without updating the learner cache', async () => {
  const { client, wrapper } = clientForTest()
  const email = 'reader@example.test'
  client.setQueryData(['session'], { user: { email } })
  const oldRows = [
    {
      lessonId: 'how-react-renders',
      step: 0,
      completed: false,
      visitedSteps: [0],
      updatedAt: '2026-11-18T18:00:00.000Z',
    },
  ]
  client.setQueryData(['progress', email], oldRows)
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ completed: true }))
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(() => ({ save: useSaveProgress(), bookmark: useBookmark() }), {
    wrapper,
  })
  await act(async () => {
    await expect(
      result.current.save.mutateAsync({ slug: 'how-react-renders', step: 1 }),
    ).rejects.toThrow()
    await expect(
      result.current.bookmark.mutateAsync({ slug: 'how-react-renders', bookmarked: true }),
    ).rejects.toThrow()
  })
  expect(client.getQueryData(['progress', email])).toEqual(oldRows)
  expect(fetcher).toHaveBeenCalledTimes(2)
  for (const [, init] of fetcher.mock.calls) {
    expect(new Headers(init?.headers).get('X-Expected-Account')).toBe(encodeURIComponent(email))
  }
  expect(fetcher).toHaveBeenCalledWith(
    '/api/progress/how-react-renders',
    expect.objectContaining({
      method: 'PUT',
      cache: 'no-store',
      credentials: 'same-origin',
    }),
  )
})

it('reads guest progress into the guest cache with the guest precondition', async () => {
  const { client, wrapper } = clientForTest()
  client.setQueryData(['session'], { user: null })
  const fetcher = vi.fn<typeof fetch>(async () => Response.json([]))
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(() => useProgress(), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(client.getQueryData(['progress', ''])).toEqual([])
  const [, init] = fetcher.mock.calls[0]
  expect(new Headers(init?.headers).get('X-Expected-Account')).toBe('')
  expect(fetcher).toHaveBeenCalledWith(
    '/api/progress',
    expect.objectContaining({
      cache: 'no-store',
      credentials: 'same-origin',
    }),
  )
})
