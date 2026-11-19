import { useQuery } from '@tanstack/react-query'
import { lessonSummaryListSchema } from '@rendered/shared/contracts/catalog'
import { request } from '../../lib/http'

export const useSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => request('search?q=' + encodeURIComponent(q), lessonSummaryListSchema),
    enabled: !!q.trim(),
    staleTime: 60000,
  })
