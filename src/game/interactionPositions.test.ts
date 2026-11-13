import { describe, expect, it } from 'vitest'
import { findHugSpot, formationTarget } from './interactionPositions'
import type { WorldMap } from './maps'

const point = (x: number, y: number) => ({ x: (x + 0.5) * 16, y: (y + 0.5) * 16 })

describe('two-person placement', () => {
  it('uses a front-back formation in a one-tile corridor', () => {
    const map: WorldMap = { kind: 'home', width: 9, height: 9, blocked: Array.from({ length: 9 }, (_, y) => Array.from({ length: 9 }, (_, x) => x !== 4 || y === 0 || y === 8)) }
    const player = point(4, 4), npc = point(4, 6)
    expect(formationTarget(map, player, npc, 'up', true)).toEqual({ x: player.x, y: player.y + 23 })
    expect(findHugSpot(map, player, npc)).toBeNull()
  })
})
