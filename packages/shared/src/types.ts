export interface Track {
  id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  color: string
}
export type SceneMode = 'tree' | 'flow' | 'compare' | 'timeline' | 'layers' | 'window'
export type NodeStatus = 'idle' | 'active' | 'kept' | 'added' | 'removed'
export interface SceneNode {
  id: string
  label: string
  detail?: string
  status?: NodeStatus
}
export interface Scene {
  nodes: SceneNode[]
  edges: [string, string][]
}
export interface Step {
  title: string
  body: string
  code: string
  scene: Scene
}
export interface Lesson {
  slug: string
  trackId: string
  title: string
  objective: string
  mode: SceneMode
  steps: Step[]
  pitfall: string
  practice: string
  recap: string
  source: string
  quiz: { question: string; options: string[]; answer: number; explanation: string }
}
export interface LessonSummary {
  slug: string
  trackId: string
  title: string
  objective: string
  stepCount: number
}
export interface Progress {
  lessonId: string
  step: number
  completed: boolean
  visitedSteps: number[]
  updatedAt: string
}
