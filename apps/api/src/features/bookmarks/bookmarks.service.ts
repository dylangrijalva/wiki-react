import { and, eq, gte } from 'drizzle-orm'
import { bookmarkListSchema } from '@rendered/shared/contracts/bookmarks'
import type { Database } from '../../db/database'
import { bookmarks, lessonTable } from '../../db/schema'

export async function listBookmarks(db: Database, learnerId: string) {
  const rows = await db
    .select({ lessonId: bookmarks.lessonId })
    .from(bookmarks)
    .innerJoin(lessonTable, eq(lessonTable.slug, bookmarks.lessonId))
    .where(and(eq(bookmarks.learnerId, learnerId), gte(lessonTable.position, 0)))
    .orderBy(lessonTable.position)
  return bookmarkListSchema.parse(rows.map((row) => row.lessonId))
}

export async function setBookmark(
  db: Database,
  learnerId: string,
  lessonId: string,
  bookmarked: boolean,
) {
  if (bookmarked) {
    await db.insert(bookmarks).values({ learnerId, lessonId }).onConflictDoNothing()
  } else {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.learnerId, learnerId), eq(bookmarks.lessonId, lessonId)))
  }
  return { lessonId, bookmarked }
}
