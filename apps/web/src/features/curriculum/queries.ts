import { useQuery } from '@tanstack/react-query'
import { trackListSchema, lessonSummaryListSchema } from '@rendered/shared/contracts/catalog'
import { request } from '../../lib/http'

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
