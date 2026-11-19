import { describe, expect, it } from 'vitest'
import { bookmarkListSchema, bookmarkResultSchema } from '@rendered/shared/contracts/bookmarks'

describe('bookmark contracts', () => {
  it('validates saved lesson slugs and bookmark write results', () => {
    const slug = 'how-react-renders'
    expect(bookmarkListSchema.parse([slug])).toEqual([slug])
    expect(bookmarkListSchema.safeParse([null]).success).toBe(false)
    expect(bookmarkResultSchema.parse({ lessonId: slug, bookmarked: false })).toEqual({
      lessonId: slug,
      bookmarked: false,
    })
    expect(bookmarkResultSchema.safeParse({ lessonId: slug, bookmarked: 'false' }).success).toBe(
      false,
    )
  })
})
