import type { ReactNode } from 'react'
import { FlaskConical } from 'lucide-react'
import type { Step, Lesson } from '@rendered/shared'
import { SceneDiagram } from '../SceneDiagram'

export type Node = Step['scene']['nodes'][number]
type Status = NonNullable<Node['status']>
export const node = (id: string, label: string, detail: string, status: Status = 'idle'): Node => ({
  id,
  label,
  detail,
  status,
})

export function Lab({
  title,
  scene,
  mode,
  controls,
  result,
  children,
}: {
  title: string
  scene: Step['scene']
  mode: Lesson['mode']
  controls: ReactNode
  result: string
  children?: ReactNode
}) {
  return (
    <div className="rr-lab">
      <div className="rr-lab-title">
        <FlaskConical size={15} />
        {title}
      </div>
      {children}
      <SceneDiagram scene={scene} mode={mode} label={title} />
      <div className="rr-lab-actions">{controls}</div>
      <p className="rr-lab-result" aria-live="polite">
        {result}
      </p>
    </div>
  )
}
