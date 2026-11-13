import Phaser from 'phaser'
import type { Direction } from './input'
import { ensureCharacterTexture, type Role } from './characterAssets'

export type { Role } from './characterAssets'
export type Pose = 'sit' | 'stand' | 'hand-start' | 'hand' | 'hand-end' | 'hug-start' | 'hug' | 'lie' | 'sleep' | 'wake' | 'talk'
const directions: Direction[] = ['down', 'left', 'right', 'up']

export function registerCharacters(scene: Phaser.Scene) {
  for (const role of ['mashuo', 'mendu'] as const) {
    ensureCharacterTexture(scene, role)
    directions.forEach((direction, row) => {
      scene.anims.create({ key: `${role}-idle-${direction}`, frames: [{ key: role, frame: row * 4 + 1 }], frameRate: 1 })
      scene.anims.create({ key: `${role}-walk-${direction}`, frames: [0, 1, 2, 3].map(offset => ({ key: role, frame: row * 4 + offset })), frameRate: 8, repeat: -1 })
    })
    const make = (name: Pose, frames: number[], frameRate = 7, repeat = 0) => scene.anims.create({
      key: `${role}-${name}`, frames: frames.map(frame => ({ key: role, frame })), frameRate, repeat,
    })
    make('sit', [1, 17, 16]); make('stand', [16, 17, 1])
    make('hand-start', [1, 18, 19]); make('hand', [19])
    make('hand-end', [19, 20, 1]); make('hug-start', [1, 21, 22]); make('hug', [22, 23], 2, -1)
    make('lie', [1, 24, 25]); make('sleep', [25, 26], 1.5, -1)
    make('wake', [25, 27, 1]); make('talk', [28, 29], 2, -1)
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
