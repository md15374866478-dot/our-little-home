import { describe, expect, it } from 'vitest'
import { findPath, reachableNear } from './pathfinding'
import { canStand } from './collision'
import type { WorldMap } from './maps'

function map(): WorldMap {
  return { kind: 'home', width: 12, height: 12, blocked: Array.from({ length: 12 }, () => Array<boolean>(12).fill(false)) }
}
const at = (x: number, y: number) => ({ x: (x + 0.5) * 16, y: (y + 0.5) * 16 })

describe('shared-grid pathfinding', () => {
  it('routes around furniture using foot collision', () => {
    const world = map()
    for (let y = 1; y < 10; y++) world.blocked[y][5] = true
    const route = findPath(world, at(2, 5), at(8, 5))
    expect(route).not.toBeNull()
    expect(route!.length).toBeGreaterThan(6)
    expect(route!.every(point => canStand(world, point.x, point.y))).toBe(true)
  })

  it('returns failure for sealed or blocked destinations', () => {
    const world = map()
    for (let y = 0; y < 12; y++) world.blocked[y][5] = true
    expect(findPath(world, at(2, 5), at(8, 5))).toBeNull()
    expect(reachableNear(world, at(2, 5), at(8, 5), 1)).toBeNull()
    expect(findPath(world, at(2, 5), at(5, 5))).toBeNull()
  })
})
