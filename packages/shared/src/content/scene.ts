import type { Step } from '../contracts/catalog.js'

type Node = Step['scene']['nodes'][number]

export function node(
  id: string,
  label: string,
  status: Node['status'] = 'idle',
  detail?: string,
): Node {
  return { id, label, status, ...(detail ? { detail } : {}) }
}

export function step(
  title: string,
  body: string,
  code: string,
  nodes: Node[],
  edges: [string, string][] = [],
): Step {
  return { title, body, code, scene: { nodes, edges } }
}
