import type { Lesson, Step } from '@rendered/shared/contracts/catalog'

type Scene = Step['scene']
export type Point = { x: number; y: number }
export const nodeWidth = 136
export const nodeHeight = 74

// Align siblings in a tree. Cycles in an effect or data flow use ordered lanes instead.
function treeRows(scene: Scene) {
  const successors = new Map<string, string[]>()
  const incoming = new Map(scene.nodes.map((node) => [node.id, 0]))
  for (const [from, to] of scene.edges) {
    successors.set(from, [...(successors.get(from) ?? []), to])
    incoming.set(to, (incoming.get(to) ?? 0) + 1)
  }
  let row = scene.nodes.filter((node) => !incoming.get(node.id)).map((node) => node.id)
  const rows: string[][] = []
  while (row.length) {
    rows.push(row)
    const next: string[] = []
    for (const id of row) {
      for (const child of successors.get(id) ?? []) {
        const parents = (incoming.get(child) ?? 1) - 1
        incoming.set(child, parents)
        if (!parents) next.push(child)
      }
    }
    row = next
  }
  return rows.flat().length === scene.nodes.length ? rows : []
}

export function layoutScene(scene: Scene, mode: Lesson['mode'], compact = false) {
  const ids = scene.nodes.map((node) => node.id)
  let rows = mode === 'tree' || mode === 'layers' ? treeRows(scene) : []
  if (!rows.length) {
    const columns = mode === 'compare' ? 2 : Math.min(ids.length || 1, 3)
    rows = Array.from({ length: Math.ceil(ids.length / columns) }, (_, index) =>
      ids.slice(index * columns, (index + 1) * columns),
    )
  }
  if (compact) {
    rows = rows.flatMap((row) =>
      Array.from({ length: Math.ceil(row.length / 2) }, (_, i) => row.slice(i * 2, i * 2 + 2)),
    )
  }
  const spacing = compact ? 149 : 172
  const width = compact
    ? 302
    : Math.max(520, Math.max(1, ...rows.map((row) => row.length)) * spacing + 30)
  const rowGap = compact ? 100 : mode === 'layers' ? 101 : 118
  const height = compact
    ? (rows.length - 1) * rowGap + 100
    : Math.max(306, (rows.length - 1) * rowGap + 140)
  const points = new Map<string, Point>()
  rows.forEach((row, y) => {
    row.forEach((id, x) =>
      points.set(id, {
        x: width / 2 + (x - (row.length - 1) / 2) * spacing,
        y: height / 2 + (y - (rows.length - 1) / 2) * rowGap,
      }),
    )
  })
  return { points, width, height }
}

export function connector(a: Point, b: Point) {
  if (a.y === b.y) {
    const sign = Math.sign(b.x - a.x)
    return `M ${a.x + sign * (nodeWidth / 2 + 2)} ${a.y} H ${b.x - sign * (nodeWidth / 2 + 4)}`
  }
  const sign = Math.sign(b.y - a.y)
  const y1 = a.y + sign * (nodeHeight / 2 + 4)
  const y2 = b.y - sign * (nodeHeight / 2 + 4)
  const mid = (y1 + y2) / 2
  return `M ${a.x} ${y1} C ${a.x} ${mid} ${b.x} ${mid} ${b.x} ${y2}`
}

export function wrap(text: string, limit: number): string[] {
  const words = text
    .split(/\s+/)
    .flatMap((word) => word.match(new RegExp(`.{1,${limit}}`, 'gu')) ?? [])
  const lines: string[] = []
  for (const word of words) {
    const previous = lines.length - 1
    if (previous >= 0 && lines[previous].length + word.length < limit) lines[previous] += ' ' + word
    else lines.push(word)
  }
  return lines
}
