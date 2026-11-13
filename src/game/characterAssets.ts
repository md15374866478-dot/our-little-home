import Phaser from 'phaser'
import mashuoSheet from '../assets/characters/mashuo.png'
import menduSheet from '../assets/characters/mendu.png'

export type Role = 'mashuo' | 'mendu'
export const FRAME_WIDTH = 32
export const FRAME_HEIGHT = 48

// Accept the old ID only when reading legacy data. Game state always uses mashuo.
export function normalizeRole(value: string): Role | undefined {
  if (value === 'sister') return 'mashuo'
  return value === 'mashuo' || value === 'mendu' ? value : undefined
}

export const characterAssets: Record<Role, { key: Role; displayName: string; url: string; outfit: string }> = {
  mashuo: { key: 'mashuo', displayName: '马硕', url: mashuoSheet, outfit: 'plaid-dress-v1' },
  mendu: { key: 'mendu', displayName: '门都', url: menduSheet, outfit: 'dark-hoodie-v1' },
}

export function preloadCharacters(scene: Phaser.Scene) {
  for (const asset of Object.values(characterAssets))
    scene.load.spritesheet(asset.key, asset.url, { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT })
}

function fallbackSheet(role: Role): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_WIDTH * 8
  canvas.height = FRAME_HEIGHT * 4
  const c = canvas.getContext('2d')!
  const color = role === 'mashuo' ? '#8f6052' : '#353239'
  for (let frame = 0; frame < 32; frame++) {
    const x = (frame % 8) * FRAME_WIDTH, y = Math.floor(frame / 8) * FRAME_HEIGHT
    c.fillStyle = '#342d30'; c.fillRect(x + 7, y + 8, 18, 35)
    c.fillStyle = '#efbf9f'; c.fillRect(x + 10, y + 15, 12, 12)
    c.fillStyle = color; c.fillRect(x + 8, y + 28, 16, 14)
    c.fillStyle = '#27282a'; c.fillRect(x + 8, y + 42, 6, 5); c.fillRect(x + 19, y + 42, 6, 5)
  }
  return canvas
}

export function ensureCharacterTexture(scene: Phaser.Scene, role: Role) {
  if (scene.textures.exists(role)) return
  const canvas = scene.textures.addCanvas(`${role}-fallback-canvas`, fallbackSheet(role))!
  scene.textures.addSpriteSheet(role, canvas, { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT })
}
