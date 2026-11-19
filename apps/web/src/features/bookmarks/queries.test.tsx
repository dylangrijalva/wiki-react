import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { clientForTest } from '../../test/query-client'
import { useBookmark } from './queries'
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('keeps bookmarks cached when a private write returns a malformed response', async () => {
  const { client, wrapper } = clientForTest()
  const email = 'reader@example.test'
  client.setQueryData(['session'], { user: { email } })
  client.setQueryData(['progress', email], [])
  client.setQueryData(['bookmarks', email], [])
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ completed: true }))
  vi.stubGlobal('fetch', fetcher)
  const { result } = renderHook(() => useBookmark(), { wrapper })
  await act(async () => {
    await expect(
      result.current.mutateAsync({ slug: 'how-react-renders', bookmarked: true }),
    ).rejects.toThrow()
  })
  expect(client.getQueryState(['bookmarks', email])?.isInvalidated).toBe(false)
  expect(fetcher).toHaveBeenCalledOnce()
  const [, init] = fetcher.mock.calls[0]
  expect(new Headers(init?.headers).get('X-Expected-Account')).toBe(encodeURIComponent(email))
})
