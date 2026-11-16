import { describe, expect, it } from 'vitest'
import { findHugSpot, formationTarget } from './interactionPositions'
import { createCollisionMap } from './maps'
import type { WorldMap } from './maps'

const point = (x: number, y: number) => ({ x: (x + 0.5) * 16, y: (y + 0.5) * 16 })

describe('two-person placement', () => {
  it('uses a front-back formation in a one-tile corridor', () => {
    const map: WorldMap = { kind: 'home', width: 9, height: 9, blocked: Array.from({ length: 9 }, (_, y) => Array.from({ length: 9 }, (_, x) => x !== 4 || y === 0 || y === 8)) }
    const player = point(4, 4), npc = point(4, 6)
    expect(formationTarget(map, player, npc, 'up', true)).toEqual({ x: player.x, y: player.y + 35 })
    expect(findHugSpot(map, player, npc)).toBeNull()
  })

  it('keeps the hand partner on the chosen side while the player turns', () => {
    const map = createCollisionMap('home')
    const player = { x: 230, y: 190 }
    const left = { x: 200, y: 190 }
    for (const facing of ['up', 'right', 'down', 'left'] as const)
      expect(formationTarget(map, player, left, facing, true, -1)).toEqual(left)
    const right = { x: 260, y: 190 }
    for (const facing of ['up', 'right', 'down', 'left'] as const)
      expect(formationTarget(map, player, right, facing, true, 1)).toEqual(right)
  })
})
