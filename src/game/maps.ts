import Phaser from 'phaser'
import type { Environment } from './environment'
import { TILE } from './constants'
import { allMapLayers, homeFallbackLayers, homeFurniture, homeSampleLayers, yardLayers } from './artCatalog'

export { TILE }
export type MapKind = 'yard' | 'home'
export interface WorldMap { kind: MapKind; width: number; height: number; blocked: boolean[][] }

export function preloadMapArt(scene: Phaser.Scene) {
  for (const layer of allMapLayers) scene.load.image(layer.key, layer.url)
}

const grid = (w: number, h: number) => Array.from({ length: h }, () => Array<boolean>(w).fill(false))
const block = (map: WorldMap, x: number, y: number, w: number, h: number) => {
  for (let row = Math.max(0, y); row < Math.min(map.height, y + h); row++)
    for (let col = Math.max(0, x); col < Math.min(map.width, x + w); col++) map.blocked[row][col] = true
}

// Shared collision grid for player movement and A*; these footprints match the painted art.
export function createCollisionMap(kind: MapKind): WorldMap {
  const map: WorldMap = kind === 'home'
    ? { kind, width: 30, height: 24, blocked: grid(30, 24) }
    : { kind, width: 44, height: 34, blocked: grid(44, 34) }
  if (kind === 'home') {
    block(map, 0, 0, 30, 1); block(map, 0, 0, 1, 24); block(map, 29, 0, 1, 24)
    block(map, 0, 23, 13, 1); block(map, 17, 23, 13, 1)
    for (const item of homeFurniture) {
      const { x, y, width, height } = item.footprint
      block(map, x, y, width, height)
    }
  } else {
    for (let y = 10; y <= 32; y++) for (const x of [2, 41]) block(map, x, y, 1, 1)
    for (let x = 2; x <= 41; x++) for (const y of [10, 32]) {
      if (y === 32 && x >= 20 && x <= 24) continue
      block(map, x, y, 1, 1)
    }
    block(map, 0, 0, 44, 1); block(map, 0, 33, 44, 1)
    block(map, 0, 0, 1, 34); block(map, 43, 0, 1, 34)
    block(map, 12, 3, 21, 11) // house
    block(map, 8, 20, 2, 2)   // memorial tree trunk
    block(map, 31, 22, 6, 3) // bench
    block(map, 5, 25, 5, 3); block(map, 34, 16, 5, 3) // flower beds
    block(map, 18, 21, 1, 1); block(map, 27, 21, 1, 1) // lamps
  }
  return map
}

export function createMap(scene: Phaser.Scene, kind: MapKind, env: Environment) {
  const map = createCollisionMap(kind)
  const ready = (key: string) => !scene.textures || scene.textures.exists(key)
  const definitions = kind === 'home'
    ? (homeSampleLayers.every(layer => ready(layer.key)) ? homeSampleLayers : homeFallbackLayers)
    : yardLayers[env.season]
  const layers = definitions.map(layer => scene.add.image(layer.x, layer.y, layer.key).setOrigin(0).setDepth(layer.depth))
  return { layers, map }
}
