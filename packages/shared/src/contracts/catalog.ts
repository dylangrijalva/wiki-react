import { z } from 'zod'
import { slugSchema, text } from './primitives.js'

export { slugSchema }
export const searchQuerySchema = z.string().trim().max(160)

const trackSchema = z.object({
  id: slugSchema,
  title: text,
  description: text,
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  color: text,
})
export const trackListSchema = z.array(trackSchema)
export type Track = z.infer<typeof trackSchema>

const sceneModeSchema = z.enum(['tree', 'flow', 'compare', 'timeline', 'layers', 'window'])
const nodeStatusSchema = z.enum(['idle', 'active', 'kept', 'added', 'removed'])
const sceneNodeSchema = z.object({
  id: text,
  label: text,
  detail: z.string().optional(),
  status: nodeStatusSchema.optional(),
})
const sceneSchema = z
  .object({
    nodes: z.array(sceneNodeSchema).min(1),
    edges: z.array(z.tuple([text, text])),
  })
  .superRefine(({ nodes, edges }, ctx) => {
    const ids = new Set(nodes.map((node) => node.id))
    if (ids.size !== nodes.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: 'Scene nodes must have unique IDs.',
      })
    }
    for (const [index, [from, to]] of edges.entries()) {
      if (!ids.has(from) || !ids.has(to)) {
        ctx.addIssue({
          code: 'custom',
          path: ['edges', index],
          message: 'Both ends of a connection must name a node in this scene.',
        })
      }
    }
  })
const stepSchema = z.object({
  title: text,
  body: text,
  code: text,
  scene: sceneSchema,
})
export type SceneMode = z.infer<typeof sceneModeSchema>
export type NodeStatus = z.infer<typeof nodeStatusSchema>
export type SceneNode = z.infer<typeof sceneNodeSchema>
export type Scene = z.infer<typeof sceneSchema>
export type Step = z.infer<typeof stepSchema>

const lessonInfo = z.object({
  slug: slugSchema,
  trackId: slugSchema,
  title: text,
  objective: text,
})
const quizSchema = z
  .object({
    question: text,
    options: z.array(text).min(2),
    answer: z.int().nonnegative(),
    explanation: text,
  })
  .refine((quiz) => quiz.answer < quiz.options.length, {
    path: ['answer'],
    error: 'The answer must refer to one of the choices.',
  })

export const lessonSchema = lessonInfo.extend({
  mode: sceneModeSchema,
  steps: z.array(stepSchema).min(5).max(8),
  pitfall: text,
  practice: text,
  recap: text,
  source: z.url({ protocol: /^https?$/ }),
  quiz: quizSchema,
})
const lessonSummarySchema = lessonInfo.extend({
  stepCount: z.int().min(5).max(8),
})
export const lessonSummaryListSchema = z.array(lessonSummarySchema)
export type Lesson = z.infer<typeof lessonSchema>
export type LessonSummary = z.infer<typeof lessonSummarySchema>
