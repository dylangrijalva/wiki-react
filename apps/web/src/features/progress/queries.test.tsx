import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { clientForTest } from '../../test/query-client'
import { useProgress, useSaveProgress } from './queries'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('keeps the saved progress when a write returns a malformed response', async () => {
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
  const { result } = renderHook(() => useSaveProgress(), {
    wrapper,
  })
  await act(async () => {
    await expect(
      result.current.mutateAsync({ slug: 'how-react-renders', step: 1 }),
    ).rejects.toThrow()
  })
  expect(client.getQueryData(['progress', email])).toEqual(oldRows)
  expect(fetcher).toHaveBeenCalledOnce()
  const [, init] = fetcher.mock.calls[0]
  expect(new Headers(init?.headers).get('X-Expected-Account')).toBe(encodeURIComponent(email))
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
