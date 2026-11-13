import Phaser from 'phaser'
import type { Environment, Season } from './environment'
import { TILE } from './constants'
import homeArt from '../assets/maps/home.png'
import homeFront from '../assets/maps/home-front.png'
import springArt from '../assets/maps/yard-spring.png'
import springTree from '../assets/maps/yard-spring-tree-front.png'
import springBench from '../assets/maps/yard-spring-bench-front.png'
import summerArt from '../assets/maps/yard-summer.png'
import summerTree from '../assets/maps/yard-summer-tree-front.png'
import summerBench from '../assets/maps/yard-summer-bench-front.png'
import autumnArt from '../assets/maps/yard-autumn.png'
import autumnTree from '../assets/maps/yard-autumn-tree-front.png'
import autumnBench from '../assets/maps/yard-autumn-bench-front.png'
import winterArt from '../assets/maps/yard-winter.png'
import winterTree from '../assets/maps/yard-winter-tree-front.png'
import winterBench from '../assets/maps/yard-winter-bench-front.png'

export { TILE }
export type MapKind = 'yard' | 'home'
export interface WorldMap { kind: MapKind; width: number; height: number; blocked: boolean[][] }

const yardAssets: Record<Season, [string, string, string]> = {
  spring: [springArt, springTree, springBench],
  summer: [summerArt, summerTree, summerBench],
  autumn: [autumnArt, autumnTree, autumnBench],
  winter: [winterArt, winterTree, winterBench],
}

export function preloadMapArt(scene: Phaser.Scene) {
  scene.load.image('home-art', homeArt)
  scene.load.image('home-front', homeFront)
  for (const [season, files] of Object.entries(yardAssets)) {
    scene.load.image(`yard-${season}-art`, files[0])
    scene.load.image(`yard-${season}-tree`, files[1])
    scene.load.image(`yard-${season}-bench`, files[2])
  }
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
    block(map, 2, 2, 8, 7)    // double bed
    block(map, 11, 2, 4, 3)   // bookshelf
    block(map, 21, 2, 7, 4)   // wardrobe
    block(map, 3, 14, 8, 4)   // sofa
    block(map, 14, 13, 3, 2) // coffee table
    block(map, 22, 13, 6, 5) // desk
    block(map, 22, 19, 2, 2) // plant
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
  const add = (key: string, depth: number) => scene.add.image(0, 0, key).setOrigin(0).setDepth(depth)
  const layers = kind === 'home'
    ? [add('home-art', 0), add('home-front', 10.29)]
    : [add(`yard-${env.season}-art`, 0), add(`yard-${env.season}-tree`, 10.35), add(`yard-${env.season}-bench`, 10.4)]
  return { layers, map }
}
