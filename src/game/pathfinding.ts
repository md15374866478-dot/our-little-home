import { TILE } from './constants'
import { canStand } from './collision'
import type { WorldMap } from './maps'

export interface Point { x: number; y: number }
const cell = (point: Point, width: number) => Math.floor(point.y / TILE) * width + Math.floor(point.x / TILE)
const center = (index: number, width: number): Point => ({ x: (index % width + 0.5) * TILE, y: (Math.floor(index / width) + 0.5) * TILE })
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

/** Four-way A* checks exactly the same foot clearance as player movement. */
export function findPath(map: WorldMap, start: Point, goal: Point): Point[] | null {
  if (!canStand(map, start.x, start.y) || !canStand(map, goal.x, goal.y)) return null
  const first = cell(start, map.width), last = cell(goal, map.width)
  if (first === last) return [goal]
  const count = map.width * map.height
  const g = Array<number>(count).fill(Infinity)
  const came = Array<number>(count).fill(-1)
  const closed = Array<boolean>(count).fill(false)
  const open: number[] = [first]
  g[first] = 0
  const heuristic = (i: number) => Math.abs(i % map.width - last % map.width) + Math.abs(Math.floor(i / map.width) - Math.floor(last / map.width))
  while (open.length) {
    let best = 0
    for (let i = 1; i < open.length; i++) if (g[open[i]] + heuristic(open[i]) < g[open[best]] + heuristic(open[best])) best = i
    const current = open.splice(best, 1)[0]
    if (current === last) {
      const route: Point[] = []
      for (let cursor = last; cursor !== first; cursor = came[cursor]) route.push(center(cursor, map.width))
      route.reverse()
      route[route.length - 1] = goal
      return route
    }
    closed[current] = true
    const x = current % map.width, y = Math.floor(current / map.width)
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue
      const next = ny * map.width + nx
      if (closed[next] || !canStand(map, (nx + 0.5) * TILE, (ny + 0.5) * TILE)) continue
      const cost = g[current] + 1
      if (cost >= g[next]) continue
      came[next] = current
      g[next] = cost
      if (!open.includes(next)) open.push(next)
    }
  }
  return null
}

/** Resolve a nearby free destination without ever accepting a blocked furniture tile. */
export function reachableNear(map: WorldMap, from: Point, desired: Point, radius = 3): Point | null {
  const choices: Point[] = []
  const col = Math.floor(desired.x / TILE), row = Math.floor(desired.y / TILE)
  for (let y = row - radius; y <= row + radius; y++) for (let x = col - radius; x <= col + radius; x++) {
    const point = { x: (x + 0.5) * TILE, y: (y + 0.5) * TILE }
    if (canStand(map, point.x, point.y)) choices.push(point)
  }
  choices.sort((a, b) => distance(a, desired) - distance(b, desired))
  for (const point of choices) if (findPath(map, from, point)) return point
  return null
}
