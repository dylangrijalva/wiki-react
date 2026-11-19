import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bookmarkListSchema,
  bookmarkResultSchema,
  lessonSchema,
  lessonSummaryListSchema,
  progressListSchema,
  progressSchema,
  trackListSchema,
  type Progress,
} from '@rendered/shared'
import type { ZodType } from 'zod'
import { request, useSession } from './session'

export const useTracks = () =>
  useQuery({
    queryKey: ['tracks'],
    queryFn: () => request('tracks', trackListSchema),
    staleTime: Infinity,
  })
export const useLessons = () =>
  useQuery({
    queryKey: ['lessons'],
    queryFn: () => request('lessons', lessonSummaryListSchema),
    staleTime: Infinity,
  })
export const useLesson = (slug: string) =>
  useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => request('lessons/' + encodeURIComponent(slug), lessonSchema),
    staleTime: Infinity,
  })
export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => request('search?q=' + encodeURIComponent(q), lessonSummaryListSchema),
    enabled: !!q.trim(),
    staleTime: 60000,
  })

function privateRequest<T>(email: string, path: string, schema: ZodType<T>, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  headers.set('X-Expected-Account', encodeURIComponent(email))
  return request(path, schema, { ...init, cache: 'no-store', headers })
}

function progressOptions(email: string) {
  return queryOptions({
    queryKey: ['progress', email],
    queryFn: ({ signal }) => privateRequest(email, 'progress', progressListSchema, { signal }),
    staleTime: 30000,
  })
}

export function useProgress() {
  const session = useSession()
  return useQuery({
    ...progressOptions(session.data?.user?.email ?? ''),
    enabled: session.isSuccess,
  })
}
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
export function useSaveProgress() {
  const client = useQueryClient(),
    email = useSession().data?.user?.email ?? ''
  return useMutation({
    mutationKey: ['learner', 'progress'],
    scope: { id: 'progress-writes' },
    mutationFn: async ({
      slug,
      step,
      completed,
    }: {
      slug: string
      step: number
      completed?: boolean
    }) => {
      await client.ensureQueryData(progressOptions(email))
      return privateRequest(email, 'progress/' + encodeURIComponent(slug), progressSchema, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed }),
      })
    },
    onSuccess: (row) =>
      client.setQueryData<Progress[]>(['progress', email], (old) => [
        row,
        ...(old ?? []).filter((p) => p.lessonId !== row.lessonId),
      ]),
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
