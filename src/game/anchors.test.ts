import { describe, expect, it } from 'vitest'
import type Phaser from 'phaser'
import { activityAnchors, bedSeat, benchSeat, sofaSeat } from './anchors'
import { canStand } from './collision'
import { getEnvironment } from './environment'
import { createMap, type MapKind } from './maps'
import { findPath } from './pathfinding'

function builtMap(kind: MapKind) {
  const graphics = { setDepth() { return this }, fillStyle() { return this }, fillRect() { return this } }
  const scene = { add: { graphics: () => graphics } } as unknown as Phaser.Scene
  return createMap(scene, kind, getEnvironment(new Date('2026-06-01T04:00:00Z'))).map
}

describe('interaction anchors on the actual map grid', () => {
  for (const kind of ['home', 'yard'] as const) it(`${kind} anchors are reachable outside furniture`, () => {
    const map = builtMap(kind)
    const start = kind === 'home' ? { x: 15 * 16, y: 20 * 16 } : { x: 22.5 * 16, y: 30.5 * 16 }
    for (const anchor of activityAnchors[kind]) {
      expect(canStand(map, anchor.position.x, anchor.position.y), anchor.id).toBe(true)
      expect(findPath(map, start, anchor.position), anchor.id).not.toBeNull()
    }
    for (const seat of kind === 'home' ? [sofaSeat, bedSeat] : [benchSeat]) {
      for (const position of seat.approach) {
        expect(canStand(map, position.x, position.y)).toBe(true)
        expect(findPath(map, start, position)).not.toBeNull()
      }
    }
  })
})
