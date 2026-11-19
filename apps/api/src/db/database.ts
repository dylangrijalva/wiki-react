import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import type { Lesson, Track } from '@rendered/shared/contracts/catalog'
import { paths } from '../paths'
import { lessonTable, trackTable } from './schema'

export async function openDatabase(path: string, tracks: Track[], lessons: Lesson[]) {
  const absolute = resolve(path)
  mkdirSync(dirname(absolute), { recursive: true })
  const client = createClient({ url: pathToFileURL(absolute).href })
  const db = drizzle(client)
  try {
    await client.execute('PRAGMA journal_mode = WAL')
    await client.execute('PRAGMA foreign_keys = ON')
    await migrate(db, { migrationsFolder: paths.migrations })
    await db.transaction(async (tx) => {
      // Unpublished lessons keep their foreign keys and learner history if they return.
      await tx.update(lessonTable).set({ position: -1 })
      await tx.update(trackTable).set({ position: -1 })
      for (const [position, track] of tracks.entries()) {
        const row = { id: track.id, position, content: track }
        await tx
          .insert(trackTable)
          .values(row)
          .onConflictDoUpdate({ target: trackTable.id, set: row })
      }
      for (const [position, lesson] of lessons.entries()) {
        const { slug, trackId, title, objective, steps } = lesson
        const row = {
          slug,
          trackId,
          title,
          objective,
          stepCount: steps.length,
          position,
          content: lesson,
        }
        await tx
          .insert(lessonTable)
          .values(row)
          .onConflictDoUpdate({ target: lessonTable.slug, set: row })
      }
    })
    return { db, close: () => client.close() }
  } catch (error) {
    client.close()
    throw error
  }
}

export type Database = Awaited<ReturnType<typeof openDatabase>>['db']
