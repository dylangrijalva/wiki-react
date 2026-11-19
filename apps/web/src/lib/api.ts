import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Lesson, LessonSummary, Progress, Track } from '@rendered/shared'
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api/' + path, { credentials: 'same-origin', ...init })
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? 'We couldn’t find that lesson.'
        : 'The server couldn’t complete the request.',
    )
  return response.json() as Promise<T>
}
export const useTracks = () =>
  useQuery({ queryKey: ['tracks'], queryFn: () => request<Track[]>('tracks'), staleTime: Infinity })
export const useLessons = () =>
  useQuery({
    queryKey: ['lessons'],
    queryFn: () => request<LessonSummary[]>('lessons'),
    staleTime: Infinity,
  })
export const useLesson = (slug: string) =>
  useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => request<Lesson>('lessons/' + encodeURIComponent(slug)),
    staleTime: Infinity,
  })
export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => request<LessonSummary[]>('search?q=' + encodeURIComponent(q)),
    enabled: !!q.trim(),
    staleTime: 60000,
  })
const progressOptions = queryOptions({
  queryKey: ['progress'],
  queryFn: () => request<Progress[]>('progress'),
  staleTime: 30000,
})
export const useProgress = () => useQuery(progressOptions)
export function useBookmarks() {
  const progress = useProgress()
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => request<string[]>('bookmarks'),
    enabled: progress.isSuccess,
  })
}
export function useSaveProgress() {
  const client = useQueryClient()
  return useMutation({
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
      await client.ensureQueryData(progressOptions)
      return request<Progress>('progress/' + encodeURIComponent(slug), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed }),
      })
    },
    onSuccess: (row) =>
      client.setQueryData<Progress[]>(['progress'], (old) => [
        row,
        ...(old ?? []).filter((p) => p.lessonId !== row.lessonId),
      ]),
  })
}
export function useBookmark() {
  const client = useQueryClient()
  return useMutation({
    scope: { id: 'bookmark-writes' },
    mutationFn: async ({ slug, bookmarked }: { slug: string; bookmarked: boolean }) => {
      await client.ensureQueryData(progressOptions)
      await request('bookmarks/' + encodeURIComponent(slug), {
        method: bookmarked ? 'POST' : 'DELETE',
      })
      return { slug, bookmarked }
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['bookmarks'] }),
  })
}
