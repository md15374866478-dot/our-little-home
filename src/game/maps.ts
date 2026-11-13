import Phaser from 'phaser'
import { type Environment, outdoorPalette } from './environment'
import { TILE } from './constants'

export { TILE }
export type MapKind = 'yard' | 'home'
export interface WorldMap { kind: MapKind; width: number; height: number; blocked: boolean[][] }

const rect = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) => g.fillStyle(color).fillRect(x, y, w, h)
const tileRect = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) => rect(g, x * TILE, y * TILE, w * TILE, h * TILE, color)
const grid = (w: number, h: number) => Array.from({ length: h }, () => Array<boolean>(w).fill(false))
const block = (map: WorldMap, x: number, y: number, w: number, h: number) => {
  for (let row = Math.max(0, y); row < Math.min(map.height, y + h); row++)
    for (let col = Math.max(0, x); col < Math.min(map.width, x + w); col++) map.blocked[row][col] = true
}
const speck = (x: number, y: number, seed = 0) => ((x * 23 + y * 41 + seed * 17) * 37) % 19

function drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, leaf: number) {
  rect(g, x + 23, y + 37, 10, 31, 0x70553f)
  rect(g, x + 27, y + 43, 3, 21, 0x9d7350)
  rect(g, x + 8, y + 24, 42, 31, 0x486b4b)
  rect(g, x + 14, y + 12, 32, 44, leaf)
  rect(g, x + 21, y + 5, 22, 43, leaf)
  rect(g, x + 11, y + 32, 6, 6, 0xb0bc73)
  rect(g, x + 32, y + 14, 6, 5, 0xb0bc73)
  rect(g, x + 43, y + 36, 5, 5, 0xb0bc73)
}

function drawYard(g: Phaser.GameObjects.Graphics, env: Environment): WorldMap {
  const map: WorldMap = { kind: 'yard', width: 44, height: 34, blocked: grid(44, 34) }
  const p = outdoorPalette(env)
  for (let y = 0; y < 34; y++) for (let x = 0; x < 44; x++) {
    tileRect(g, x, y, 1, 1, (x + y) % 2 ? p.grass : p.grass2)
    const s = speck(x, y)
    if (s < 4) rect(g, x * 16 + 3, y * 16 + 9, 2, 3, 0xa5b57c)
    if (s === 7 || s === 13) rect(g, x * 16 + 10, y * 16 + 4, 3, 2, p.flower)
  }

  // A winding stone path links the gate, tree, bench and front step.
  for (let y = 14; y <= 32; y++) for (let x = 20; x <= 24; x++) {
    tileRect(g, x, y, 1, 1, (x + y) % 3 === 0 ? 0xd7c9a5 : 0xc7b999)
    if ((x * 3 + y) % 4 === 0) rect(g, x * 16 + 2, y * 16 + 11, 4, 2, 0xb0a38a)
  }
  for (let x = 14; x <= 30; x++) for (let y = 22; y <= 24; y++)
    if ((x + y) % 3 !== 0) tileRect(g, x, y, 1, 1, 0xc7ba99)

  // Fence perimeter and an open south gate.
  for (let y = 10; y <= 32; y++) for (const x of [2, 41]) {
    tileRect(g, x, y, 1, 1, 0x886344)
    rect(g, x * 16 + 3, y * 16 + 2, 10, 12, 0xc6a175)
    block(map, x, y, 1, 1)
  }
  for (let x = 2; x <= 41; x++) for (const y of [10, 32]) {
    if (y === 32 && x >= 20 && x <= 24) continue
    tileRect(g, x, y, 1, 1, 0x79583f)
    rect(g, x * 16 + 2, y * 16 + 2, 12, 9, 0xc7a275)
    block(map, x, y, 1, 1)
  }
  tileRect(g, 19, 31, 1, 2, 0x694a34)
  tileRect(g, 25, 31, 1, 2, 0x694a34)
  rect(g, 20 * 16, 32 * 16 + 12, 5 * 16, 4, 0xe7cf91)
  block(map, 0, 0, 44, 1)
  block(map, 0, 33, 44, 1)
  block(map, 0, 0, 1, 34)
  block(map, 43, 0, 1, 34)

  // The house is a single collision footprint. Its door is approached from the path.
  block(map, 12, 3, 21, 11)
  tileRect(g, 12, 5, 21, 9, 0x78634d)
  tileRect(g, 13, 6, 19, 7, 0xf2dfb3)
  for (let x = 13; x < 32; x += 2) rect(g, x * 16, 11 * 16, 1, 31, 0xe4cea2)
  tileRect(g, 11, 4, 23, 3, 0x705143)
  tileRect(g, 12, 2, 21, 3, 0x895e4b)
  tileRect(g, 14, 1, 17, 2, 0xa97657)
  for (let x = 13; x < 32; x += 2) rect(g, x * 16, 4 * 16 + 4, 13, 4, 0xc88f66)
  rect(g, 12 * 16, 7 * 16, 21 * 16, 4, 0x654b3d)
  for (const x of [15, 27]) {
    tileRect(g, x, 8, 4, 4, 0x70513c)
    tileRect(g, x + 0.4, 8.35, 3.2, 3.15, env.phase === 'night' ? 0xf4c977 : 0x9dc1b4)
    rect(g, (x + 2) * 16 - 2, 8.35 * 16, 4, 51, 0xf6e0ae)
    rect(g, x * 16 + 6, 10 * 16, 52, 4, 0xf6e0ae)
    tileRect(g, x - 0.3, 11.5, 4.6, 0.4, 0xa4774d)
  }
  tileRect(g, 21, 10, 3, 4, 0x74533d)
  tileRect(g, 21.4, 10.4, 2.2, 3.6, 0xa97950)
  rect(g, 22 * 16 + 12, 12 * 16, 4, 4, 0xf0c779)
  tileRect(g, 20, 14, 5, 1, 0xab875f)
  tileRect(g, 21, 15, 3, 0.5, 0xd0ad79)

  // Memorial tree, shared bench, flower beds and two warm lamps.
  drawTree(g, 7 * 16, 17 * 16, p.leaf)
  block(map, 8, 20, 2, 2)
  tileRect(g, 31, 22, 6, 2, 0x654b37)
  tileRect(g, 31, 22, 6, 0.55, 0xc49a67)
  tileRect(g, 31.3, 23, 5.4, 0.35, 0xd9b178)
  rect(g, 31 * 16 + 8, 24 * 16, 7, 10, 0x684e39)
  rect(g, 36 * 16, 24 * 16, 7, 10, 0x684e39)
  block(map, 31, 22, 6, 3)
  for (const [fx, fy] of [[5, 25], [34, 16]]) {
    tileRect(g, fx, fy, 5, 3, 0x765f46)
    tileRect(g, fx + 0.2, fy + 0.2, 4.6, 2.6, 0x5e6e4d)
    for (let i = 0; i < 12; i++) {
      const x = fx * 16 + 9 + (i % 4) * 18
      const y = fy * 16 + 8 + Math.floor(i / 4) * 13
      rect(g, x, y, 5, 5, i % 3 ? p.flower : 0xf2e6bc)
      rect(g, x + 2, y + 2, 2, 2, 0xf5cf75)
    }
    block(map, fx, fy, 5, 3)
  }
  for (const [lx, ly] of [[18, 20], [27, 20]]) {
    rect(g, lx * 16 + 6, ly * 16, 4, 30, 0x534c3d)
    rect(g, lx * 16, ly * 16 - 6, 16, 13, 0x6a5843)
    rect(g, lx * 16 + 3, ly * 16 - 4, 10, 9, 0xf4ce78)
    block(map, lx, ly + 1, 1, 1)
  }
  return map
}

function drawHome(g: Phaser.GameObjects.Graphics, env: Environment): WorldMap {
  const map: WorldMap = { kind: 'home', width: 30, height: 24, blocked: grid(30, 24) }
  tileRect(g, 0, 0, 30, 24, 0x9a704f)
  for (let y = 1; y < 23; y++) for (let x = 1; x < 29; x++) {
    tileRect(g, x, y, 1, 1, (y + x) % 3 ? 0xd3ab77 : 0xcda370)
    rect(g, x * 16, y * 16 + 15, 16, 1, 0xb9885c)
    if (x % 4 === 0) rect(g, x * 16, y * 16, 1, 16, 0xc29364)
  }
  tileRect(g, 0, 0, 30, 1, 0x6e5240)
  tileRect(g, 0, 1, 1, 22, 0x775842)
  tileRect(g, 29, 1, 1, 22, 0x775842)
  tileRect(g, 0, 23, 30, 1, 0x6e5240)
  tileRect(g, 13, 22, 4, 2, 0x8d6748)
  tileRect(g, 13.3, 22, 3.4, 1, 0xd6b584)
  block(map, 0, 0, 30, 1); block(map, 0, 0, 1, 24); block(map, 29, 0, 1, 24)
  block(map, 0, 23, 13, 1); block(map, 17, 23, 13, 1)

  // Windows and low wall trim.
  for (const x of [5, 18]) {
    tileRect(g, x, 0.5, 4, 2, 0xf0d9aa)
    tileRect(g, x + 0.3, 0.8, 3.4, 1.4, env.phase === 'night' ? 0x394f60 : 0x9fc4bb)
    rect(g, (x + 2) * 16 - 2, 13, 4, 22, 0xf7eacb)
    rect(g, x * 16 + 4, 24, 56, 3, 0xf7eacb)
  }

  // Bed (2,2), 8 × 7.
  tileRect(g, 2, 2, 8, 7, 0x76553e)
  tileRect(g, 2.3, 2.3, 7.4, 6.2, 0xe8d7b4)
  tileRect(g, 2.5, 2.5, 3, 2, 0xfff1d5)
  tileRect(g, 6.5, 2.5, 3, 2, 0xfff1d5)
  tileRect(g, 2.5, 4.6, 7, 3.5, 0xa5b394)
  tileRect(g, 2.5, 7.6, 7, 0.6, 0x889c80)
  block(map, 2, 2, 8, 7)

  // Bookshelf (11,2), 4 × 3.
  tileRect(g, 11, 2, 4, 3, 0x74533d)
  for (let row = 0; row < 2; row++) {
    rect(g, 11 * 16 + 5, (2 + row) * 16 + 5, 54, 14, 0x9c7049)
    for (let i = 0; i < 7; i++) rect(g, 11 * 16 + 7 + i * 7, (2 + row) * 16 + 7, 5, 10, [0xb8906a, 0x79937c, 0xe3c184][i % 3])
  }
  block(map, 11, 2, 4, 3)

  // Wardrobe (21,2), 7 × 4.
  tileRect(g, 21, 2, 7, 4, 0x684d3b)
  tileRect(g, 21.25, 2.3, 6.5, 3.3, 0xaf8058)
  rect(g, 24.5 * 16, 2.3 * 16, 3, 53, 0x704d38)
  for (const x of [23.9, 25.1]) rect(g, x * 16, 4.1 * 16, 3, 8, 0xf0cd87)
  block(map, 21, 2, 7, 4)

  // Sofa (3,14), 8 × 4, with a pale woven rug nearby.
  tileRect(g, 11, 12, 9, 7, 0xe9d8b4)
  for (let y = 12; y < 19; y++) rect(g, 11 * 16, y * 16 + 2, 9 * 16, 2, 0xdec9a2)
  tileRect(g, 3, 14, 8, 4, 0x648170)
  tileRect(g, 3.4, 14.3, 7.2, 2.8, 0x8fa596)
  tileRect(g, 3.4, 16.9, 7.2, 0.8, 0x6d8d7b)
  tileRect(g, 3.1, 14.2, 0.9, 3.5, 0x6b8775)
  tileRect(g, 10, 14.2, 0.9, 3.5, 0x6b8775)
  block(map, 3, 14, 8, 4)

  // Coffee table (14,13), 3 × 2.
  tileRect(g, 14, 13, 3, 2, 0x79583f)
  tileRect(g, 14.15, 13.1, 2.7, 1.45, 0xc29769)
  rect(g, 15 * 16 + 4, 13 * 16 + 6, 10, 7, 0xf4e6c6)
  block(map, 14, 13, 3, 2)

  // Desk (22,13), 6 × 5.
  tileRect(g, 22, 13, 6, 5, 0x775943)
  tileRect(g, 22.3, 13.3, 5.4, 1.4, 0xc39b6c)
  tileRect(g, 23, 14, 2, 1, 0xf3dfb4)
  tileRect(g, 25.5, 14, 1.3, 0.7, 0x637e75)
  tileRect(g, 22.4, 15, 1.2, 2.5, 0xa77852)
  tileRect(g, 26.5, 15, 1.2, 2.5, 0xa77852)
  block(map, 22, 13, 6, 5)

  // Plant (22,19), 2 × 2.
  tileRect(g, 22.5, 20, 1, 0.9, 0x9b7155)
  tileRect(g, 22, 19.2, 2, 1, 0x5a7d5e)
  tileRect(g, 22.6, 18.7, 0.8, 1.4, 0x789b6e)
  block(map, 22, 19, 2, 2)
  return map
}

export function createMap(scene: Phaser.Scene, kind: MapKind, env: Environment) {
  const graphics = scene.add.graphics().setDepth(0)
  const map = kind === 'yard' ? drawYard(graphics, env) : drawHome(graphics, env)
  return { graphics, map }
}

