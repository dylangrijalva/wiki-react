import { and, desc, eq, gte, sql } from 'drizzle-orm'
import {
  progressListSchema,
  progressSchema,
  type ProgressUpdate,
} from '@rendered/shared/contracts/progress'
import type { Database } from '../../db/database'
import { lessonTable, progress } from '../../db/schema'

const progressFields = {
  lessonId: progress.lessonId,
  step: progress.step,
  visitedSteps: progress.visitedSteps,
  completed: progress.completed,
  updatedAt: progress.updatedAt,
}

export async function listProgress(db: Database, learnerId: string) {
  const rows = await db
    .select(progressFields)
    .from(progress)
    .innerJoin(lessonTable, eq(progress.lessonId, lessonTable.slug))
    .where(and(eq(progress.learnerId, learnerId), gte(lessonTable.position, 0)))
    .orderBy(desc(progress.updatedAt))
  return progressListSchema.parse(rows)
}

export async function saveProgress(
  db: Database,
  learnerId: string,
  lessonId: string,
  { step, completed = false }: ProgressUpdate,
) {
  const previous = await db
    .select({ visited: progress.visitedSteps })
    .from(progress)
    .where(and(eq(progress.learnerId, learnerId), eq(progress.lessonId, lessonId)))
    .get()
  if (previous) progressSchema.shape.visitedSteps.parse(previous.visited)
  const updatedAt = new Date().toISOString()
  // Merge in SQLite so overlapping saves retain every visited step.
  const result = await db
    .insert(progress)
    .values({
      learnerId,
      lessonId,
      step,
      completed,
      visitedSteps: [step],
      updatedAt,
    })
    .onConflictDoUpdate({
      target: [progress.learnerId, progress.lessonId],
      set: {
        step,
        updatedAt,
        completed: sql`${progress.completed} OR excluded.completed`,
        visitedSteps: sql`(SELECT json_group_array(value) FROM (SELECT value FROM json_each(${progress.visitedSteps}) UNION SELECT excluded.step AS value ORDER BY value))`,
      },
    })
    .returning(progressFields)
    .get()
  return progressSchema.parse(result)
}
