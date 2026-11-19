import { z } from 'zod'
import { slugSchema } from './primitives.js'

const stepIndex = z.int().nonnegative()

export const progressSchema = z
  .object({
    lessonId: slugSchema,
    step: stepIndex,
    completed: z.boolean(),
    visitedSteps: z.array(stepIndex),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .refine((row) => row.visitedSteps.includes(row.step), {
    path: ['visitedSteps'],
    error: 'The current step must appear in the learning history.',
  })
export const progressListSchema = z.array(progressSchema)
export type Progress = z.infer<typeof progressSchema>

export const progressUpdateSchema = z.strictObject({
  step: stepIndex,
  completed: z.boolean().optional(),
})
export type ProgressUpdate = z.infer<typeof progressUpdateSchema>
