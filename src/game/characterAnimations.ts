import Phaser from 'phaser'
import type { Direction } from './input'

export type Role = 'sister' | 'mendu'
export type Pose = 'sit' | 'stand' | 'hand-start' | 'hand' | 'hand-end' | 'hug-start' | 'hug' | 'lie' | 'sleep' | 'wake' | 'talk'
const W = 16, H = 24
const directions: Direction[] = ['down', 'left', 'right', 'up']
const colors = {
  sister: { hair: '#573e38', skin: '#f4c7a8', shirt: '#f0e2be', body: '#a0b393', shoes: '#6f6255', detail: '#453734' },
  mendu: { hair: '#423a35', skin: '#efbd98', shirt: '#d4a970', body: '#8a745d', shoes: '#514d45', detail: '#322d2c' },
}

function sheet(role: Role): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W * 3
  canvas.height = H * 7
  const c = canvas.getContext('2d')!
  c.imageSmoothingEnabled = false
  const palette = colors[role]
  const draw = (frame: number, x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color
    c.fillRect((frame % 3) * W + x, Math.floor(frame / 3) * H + y, w, h)
  }
  const person = (frame: number, facing: Direction, step = 0) => {
    draw(frame, 4, 3, 8, 8, palette.hair)
    draw(frame, 3, 6, 10, 6, palette.hair)
    draw(frame, 5, 6, 7, 6, palette.skin)
    if (facing !== 'up') {
      draw(frame, facing === 'left' ? 5 : 6, 9, 1, 1, palette.detail)
      if (facing !== 'left') draw(frame, 10, 9, 1, 1, palette.detail)
    }
    draw(frame, 4, 12, 9, 7, palette.shirt)
    draw(frame, 5, 15, 7, 5, palette.body)
    draw(frame, 2, 13, 2, 5, palette.skin)
    draw(frame, 13, 13, 2, 5, palette.skin)
    draw(frame, 5 + step, 20, 3, 3, palette.shoes)
    draw(frame, 10 - step, 20, 3, 3, palette.shoes)
    draw(frame, 4, 3, 2, 5, palette.detail)
    if (facing === 'up') draw(frame, 5, 7, 6, 5, palette.hair)
    if (role === 'mendu') { draw(frame, 11, 4, 3, 2, palette.hair); draw(frame, 6, 12, 5, 2, '#f0d1a0') }
  }
  directions.forEach((direction, row) => {
    for (let f = 0; f < 3; f++) person(row * 3 + f, direction, f === 0 ? -1 : f === 2 ? 1 : 0)
  })
  // Action frames are separate shapes, so replacing the sheet does not require changing game logic.
  person(12, 'down'); draw(12, 3, 18, 11, 4, palette.body); draw(12, 4, 21, 10, 2, palette.shoes)
  person(13, 'down'); draw(13, 3, 17, 11, 3, palette.body)
  person(14, 'right'); draw(14, 13, 13, 3, 2, palette.skin)
  person(15, 'left'); draw(15, 1, 13, 4, 3, palette.skin); draw(15, 12, 13, 4, 3, palette.skin)
  draw(16, 2, 10, 12, 5, palette.hair); draw(16, 3, 14, 11, 5, palette.shirt); draw(16, 3, 19, 12, 3, palette.body)
  draw(17, 2, 11, 12, 5, palette.hair); draw(17, 3, 15, 11, 4, palette.shirt); draw(17, 3, 19, 12, 3, palette.body); draw(17, 5, 13, 1, 1, palette.detail)
  draw(18, 2, 11, 12, 5, palette.hair); draw(18, 4, 15, 10, 5, palette.shirt); draw(18, 3, 20, 12, 3, palette.body)
  person(19, 'down'); draw(19, 13, 8, 2, 2, '#f3e6ca')
  person(20, 'right'); draw(20, 13, 14, 3, 3, palette.skin)
  return canvas
}

export function registerCharacters(scene: Phaser.Scene) {
  for (const role of ['sister', 'mendu'] as const) {
    const raw = scene.textures.addCanvas(role, sheet(role))!
    scene.textures.addSpriteSheet(role, raw, { frameWidth: W, frameHeight: H })
    directions.forEach((direction, row) => {
      scene.anims.create({ key: `${role}-idle-${direction}`, frames: [{ key: role, frame: row * 3 + 1 }], frameRate: 1 })
      scene.anims.create({ key: `${role}-walk-${direction}`, frames: [0, 1, 2, 1].map(offset => ({ key: role, frame: row * 3 + offset })), frameRate: 7, repeat: -1 })
    })
    const make = (name: Pose, frames: number[], frameRate = 7, repeat = 0) => scene.anims.create({ key: `${role}-${name}`, frames: frames.map(frame => ({ key: role, frame })), frameRate, repeat })
    make('sit', [1, 13, 12]); make('stand', [12, 13, 1])
    make('hand-start', [1, 20, 14]); make('hand', [14])
    make('hand-end', [14, 20, 1]); make('hug-start', [1, 20, 15]); make('hug', [15, 20], 2, -1)
    make('lie', [1, 16, 17]); make('sleep', [17, 16], 1.5, -1)
    make('wake', [17, 18, 1]); make('talk', [19, 1], 2, -1)
  }
}

export function showIdle(sprite: Phaser.GameObjects.Sprite, role: Role, direction: Direction) {
  const key = `${role}-idle-${direction}`
  if (sprite.anims.currentAnim?.key !== key || sprite.anims.isPlaying) sprite.play(key)
}
export function showWalk(sprite: Phaser.GameObjects.Sprite, role: Role, direction: Direction) {
  sprite.play(`${role}-walk-${direction}`, true)
}
export function showPose(sprite: Phaser.GameObjects.Sprite, role: Role, pose: Pose) {
  sprite.play(`${role}-${pose}`, true)
}
