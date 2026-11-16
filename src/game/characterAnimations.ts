import Phaser from 'phaser'
import type { Direction } from './input'
import { characterAssets, ensureCharacterTexture, textureForAnimation, type Role } from './characterAssets'

export type { Role } from './characterAssets'
export type Pose = 'sit' | 'stand' | 'hand-start' | 'hand' | 'hand-end' | 'hug-start' | 'hug' | 'lie' | 'sleep' | 'wake' | 'talk'
const directions: Direction[] = ['down', 'left', 'right', 'up']

export function registerCharacters(scene: Phaser.Scene) {
  for (const role of ['mashuo', 'mendu'] as const) {
    ensureCharacterTexture(scene, role)
    for (const outfit of Object.values(characterAssets[role].outfits)) {
      if (!outfit || !scene.textures.exists(outfit.textureKey)) continue
      const key = outfit.textureKey
      directions.forEach((direction, row) => {
        if (!scene.anims.exists(`${key}-idle-${direction}`)) scene.anims.create({ key: `${key}-idle-${direction}`, frames: [{ key, frame: row * 4 + 1 }], frameRate: 1 })
        if (!scene.anims.exists(`${key}-walk-${direction}`)) scene.anims.create({ key: `${key}-walk-${direction}`, frames: [0, 1, 2, 3].map(offset => ({ key, frame: row * 4 + offset })), frameRate: 8, repeat: -1 })
      })
      const make = (name: Pose, frames: number[], frameRate = 7, repeat = 0) => {
        if (!scene.anims.exists(`${key}-${name}`)) scene.anims.create({
          key: `${key}-${name}`, frames: frames.map(frame => ({ key, frame })), frameRate, repeat,
        })
      }
      make('sit', [16, 17]); make('stand', [17, 18, 19])
      make('hand-start', [20, 21]); make('hand', [21])
      make('hand-end', [21, 22, 23]); make('hug-start', [24, 25]); make('hug', [25, 26], 2, -1)
      make('lie', [28, 29]); make('sleep', [29, 30], 1.5, -1)
      make('wake', [29, 31, 18, 19]); make('talk', [23, 19], 2, -1)
    }
  }
}

export function showIdle(sprite: Phaser.GameObjects.Sprite, role: Role, direction: Direction) {
  const key = `${textureForAnimation(sprite, role)}-idle-${direction}`
  if (sprite.anims.currentAnim?.key !== key || sprite.anims.isPlaying) sprite.play(key)
}
export function showWalk(sprite: Phaser.GameObjects.Sprite, role: Role, direction: Direction) {
  sprite.play(`${textureForAnimation(sprite, role)}-walk-${direction}`, true)
}
export function showPose(sprite: Phaser.GameObjects.Sprite, role: Role, pose: Pose) {
  sprite.play(`${textureForAnimation(sprite, role)}-${pose}`, true)
}
