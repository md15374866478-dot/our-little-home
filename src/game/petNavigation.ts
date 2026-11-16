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
  // Test both nodes and swept edges against actual foot circles. Merely blocking
  // an actor's tile lets an off-center actor intersect adjacent path segments.
  const obstacles=actors.filter(actor=>petDistance(from,actor)>=15)
  return findPath(map,from,goal,point=>obstacles.every(actor=>petDistance(point,actor)>=15))
}
export function petNear(map: WorldMap, from: Point, target: Point, actors: Point[]) {
  for (const radius of [30, 46, 62]) for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]) {
    const point = { x: target.x + dx * radius, y: target.y + dy * radius }
    if (petPath(map, from, point, actors)) return point
  }
  return null
}
