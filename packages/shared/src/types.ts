import { z } from 'zod'

const text = z.string().regex(/\S/, 'Expected text.')
const stepIndex = z.int().nonnegative()

export const slugSchema = z
  .string()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

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

export const bookmarkListSchema = z.array(slugSchema)
export const bookmarkResultSchema = z.object({ lessonId: slugSchema, bookmarked: z.boolean() })
export const apiErrorSchema = z.object({ error: z.object({ code: text, message: text }) })

const emailSchema = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .max(254, 'Use an email address with up to 254 characters.')
  .pipe(z.email({ error: 'Enter a valid email address.' }))

export const authSessionSchema = z.object({
  user: z.object({ email: emailSchema }).nullable(),
})
export type AuthSession = z.infer<typeof authSessionSchema>

const passwordSchema = z
  .string({ error: 'Enter your password.' })
  .min(1, 'Enter your password.')
  .refine((value) => [...value].length <= 128, 'Use a password with up to 128 characters.')

export const loginCredentialsSchema = z.strictObject({
  email: emailSchema,
  password: passwordSchema,
})
export const registrationCredentialsSchema = loginCredentialsSchema.extend({
  password: passwordSchema.refine((value) => value === '' || [...value].length >= 15, {
    message: 'Use a password with 15 to 128 characters.',
    params: { reason: 'short_registration_password' },
  }),
})
