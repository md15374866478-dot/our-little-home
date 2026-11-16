import { canStand } from './collision'
import type { Direction } from './input'
import type { WorldMap } from './maps'
import { findPath, reachableNear, type Point } from './pathfinding'

const directionVector: Record<Direction, Point> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

/** Choose open ground for both actors before either commits to a hug route. */
export function findHugSpot(map: WorldMap, player: Point, npc: Point): [Point, Point] | null {
  const offsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0]]
  for (const [ox, oy] of offsets) for (const vertical of [false, true]) {
    const center = { x: player.x + ox * 16, y: player.y + oy * 16 }
    const a = { x: center.x - (vertical ? 0 : 10), y: center.y - (vertical ? 10 : 0) }
    const b = { x: center.x + (vertical ? 0 : 10), y: center.y + (vertical ? 10 : 0) }
    const space = [a, b].every(point => [-14, 14].every(dx => [-8, 8].every(dy => canStand(map, point.x + dx, point.y + dy))))
    if (space && findPath(map, player, a) && findPath(map, npc, b)) return [a, b]
  }
  return null
}

/** Side-by-side when clear; behind the player when a narrow passage blocks both sides. */
export function formationTarget(map: WorldMap, player: Point, npc: Point, facing: Direction, holding = false, handSide?: -1 | 1): Point | null {
  const vector = directionVector[facing]
  const behind = { x: player.x - vector.x * (holding ? 35 : 27), y: player.y - vector.y * (holding ? 35 : 27) }
  // Keep the same horizontal partner side when turning. A side derived from
  // the travel vector crosses the player whenever they turn left or right.
  const side = holding
    ? { x: 30 * (handSide ?? (npc.x > player.x ? 1 : -1)), y: 0 }
    : { x: -vector.y * 20, y: vector.x * 20 }
  const roomy = (point: Point) => !holding || [-13, 13].every(offset =>
    canStand(map, point.x + offset, point.y) && canStand(map, point.x, point.y + offset))
  const desired = holding
    ? [{ x: player.x + side.x, y: player.y }, behind, { x: player.x - side.x, y: player.y }]
    : [behind, { x: player.x + side.x, y: player.y + side.y }]
  for (const candidate of desired) {
    if (canStand(map, candidate.x, candidate.y) && (candidate === behind || roomy(candidate)) && findPath(map, npc, candidate)) return candidate
  }
  const fallback = reachableNear(map, npc, behind, 2)
  return holding && fallback && Math.hypot(fallback.x - player.x, fallback.y - player.y) < 22 ? null : fallback
}
