import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  progressSchema,
  progressListSchema,
  type Progress,
  type ProgressUpdate,
} from '@rendered/shared/contracts/progress'
import { privateRequest } from '../../lib/http'
import { useSession } from '../account/session'

export function progressOptions(email: string) {
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
export function useSaveProgress() {
  const client = useQueryClient(),
    email = useSession().data?.user?.email ?? ''
  return useMutation({
    mutationKey: ['learner', 'progress'],
    scope: { id: 'progress-writes' },
    mutationFn: async ({ slug, step, completed }: ProgressUpdate & { slug: string }) => {
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
