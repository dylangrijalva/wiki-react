import { useQuery } from '@tanstack/react-query'
import { lessonSchema } from '@rendered/shared/contracts/catalog'
import { request } from '../../lib/http'

export const useLesson = (slug: string) =>
  useQuery({
    queryKey: ['lesson', slug],
    queryFn: () => request('lessons/' + encodeURIComponent(slug), lessonSchema),
    staleTime: Infinity,
  })
