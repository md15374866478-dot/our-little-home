import { TILE } from './constants'
import type { MapKind, WorldMap } from './maps'

export function canStand(map: WorldMap, x: number, y: number) {
  // Only the character's feet collide; visual hair and shoulders may overlap furniture.
  for (const px of [x - 4, x + 4]) for (const py of [y - 5, y - 1]) {
    const col = Math.floor(px / TILE), row = Math.floor(py / TILE)
    if (col < 0 || row < 0 || col >= map.width || row >= map.height || map.blocked[row][col]) return false
  }
  return true
}

export function doorwayAt(kind: MapKind, x: number, y: number) {
  return kind === 'yard'
    ? x >= 21 * TILE && x < 24 * TILE && y >= 14 * TILE && y < 16 * TILE
    : x >= 13 * TILE && x < 17 * TILE && y >= 21 * TILE && y < 23 * TILE
}
