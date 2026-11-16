import { canStand } from './collision'
import { findPath, type Point } from './pathfinding'
import type { WorldMap } from './maps'
export const petDistance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export function petCanStand(map: WorldMap, point: Point, actors: Point[]) {
  return canStand(map, point.x, point.y) && actors.every(actor => petDistance(point, actor) >= 15)
}
/** Overlay live actors on shared map data; never mutate the furniture grid. */
export function petPath(map: WorldMap, from: Point, goal: Point, actors: Point[]): Point[] | null {
  if (!petCanStand(map, goal, actors)) return null
  const blocked = map.blocked.map(row => [...row])
  for (const actor of actors) {
    // Carry placement searches from the owner's feet: allow the search to
    // leave that occupied start, while every destination still avoids actors.
    if (petDistance(from, actor) < 15) continue
    const col = Math.floor(actor.x / 16), row = Math.floor((actor.y - 2) / 16)
    if (blocked[row]?.[col] !== undefined && !(Math.floor(from.x / 16) === col && Math.floor(from.y / 16) === row)) blocked[row][col] = true
  }
  return findPath({ ...map, blocked }, from, goal)
}
export function petNear(map: WorldMap, from: Point, target: Point, actors: Point[]) {
  for (const radius of [30, 46, 62]) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]) {
    const point = { x: target.x + dx * radius, y: target.y + dy * radius }
    if (petPath(map, from, point, actors)) return point
  }
  return null
}
