import { describe, expect, it } from 'vitest'
import { canStand, doorwayAt } from './collision'
import type { WorldMap } from './maps'

const map: WorldMap = { kind: 'home', width: 30, height: 24, blocked: Array.from({ length: 24 }, () => Array<boolean>(30).fill(false)) }
for (let y = 2; y < 9; y++) for (let x = 2; x < 10; x++) map.blocked[y][x] = true

describe('foot collision and doors', () => {
  it('stops a character at furniture by the feet, including side overlap', () => {
    expect(canStand(map, 40, 40)).toBe(false)
    expect(canStand(map, 30, 50)).toBe(false)
    expect(canStand(map, 16, 50)).toBe(true)
  })

  it('keeps door triggers inside the intended threshold', () => {
    expect(doorwayAt('yard', 22 * 16, 15 * 16)).toBe(true)
    expect(doorwayAt('yard', 22 * 16, 16 * 16)).toBe(false)
    expect(doorwayAt('home', 15 * 16, 22 * 16)).toBe(true)
    expect(doorwayAt('home', 15 * 16, 20 * 16)).toBe(false)
  })
})
