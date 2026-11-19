import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookmarkListSchema, bookmarkResultSchema } from '@rendered/shared/contracts/bookmarks'
import { privateRequest } from '../../lib/http'
import { useSession } from '../account/session'
import { progressOptions, useProgress } from '../progress/queries'

export function useBookmarks() {
  const session = useSession(),
    email = session.data?.user?.email ?? ''
  const progress = useProgress()
  return useQuery({
    queryKey: ['bookmarks', email],
    queryFn: ({ signal }) => privateRequest(email, 'bookmarks', bookmarkListSchema, { signal }),
    enabled: session.isSuccess && progress.isSuccess,
  })
}
export function useBookmark() {
  const client = useQueryClient(),
    email = useSession().data?.user?.email ?? ''
  return useMutation({
    mutationKey: ['learner', 'bookmark'],
    scope: { id: 'bookmark-writes' },
    mutationFn: async ({ slug, bookmarked }: { slug: string; bookmarked: boolean }) => {
      await client.ensureQueryData(progressOptions(email))
      await privateRequest(email, 'bookmarks/' + encodeURIComponent(slug), bookmarkResultSchema, {
        method: bookmarked ? 'POST' : 'DELETE',
      })
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['bookmarks', email] }),
  })
}
