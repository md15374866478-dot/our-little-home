import Phaser from 'phaser'
import mashuoSheet from '../assets/characters/mashuo.png'
import menduSheet from '../assets/characters/mendu.png'

export type Role = 'mashuo' | 'mendu'
export type OutfitSlot = 'default' | 'alternate'
export const FRAME_WIDTH = 32
export const FRAME_HEIGHT = 48
export const FRAME_COLUMNS = 8
export const FRAME_ROWS = 4
export const FOOT_ORIGIN = { x: 0.5, y: 1 } as const

// Accept the old ID only when reading legacy data. Game state always uses mashuo.
export function normalizeRole(value: string): Role | undefined {
  if (value === 'sister') return 'mashuo'
  return value === 'mashuo' || value === 'mendu' ? value : undefined
}

export interface OutfitAsset {
  id: string
  textureKey: string
  url: string
  status: 'playable-review' | 'final'
  /** First 16 frames have four directions × four walking phases. */
  walkFrames: 16
  /** Interaction frames are still temporary on the current atlases. */
  interactionFrames: 'temporary' | 'final'
}

export interface CharacterAsset {
  id: Role
  displayName: string
  frameWidth: typeof FRAME_WIDTH
  frameHeight: typeof FRAME_HEIGHT
  footOrigin: typeof FOOT_ORIGIN
  outfits: Record<OutfitSlot, OutfitAsset | null>
}

export const characterAssets: Record<Role, CharacterAsset> = {
  mashuo: {
    id: 'mashuo', displayName: '马硕', frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT, footOrigin: FOOT_ORIGIN,
    outfits: {
      default: { id: 'plaid-dress-review', textureKey: 'mashuo', url: mashuoSheet, status: 'playable-review', walkFrames: 16, interactionFrames: 'temporary' },
      alternate: null,
    },
  },
  mendu: {
    id: 'mendu', displayName: '门都', frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT, footOrigin: FOOT_ORIGIN,
    outfits: {
      default: { id: 'dark-hoodie-review', textureKey: 'mendu', url: menduSheet, status: 'playable-review', walkFrames: 16, interactionFrames: 'temporary' },
      alternate: null,
    },
  },
}

export function preloadCharacters(scene: Phaser.Scene) {
  for (const character of Object.values(characterAssets))
    for (const outfit of Object.values(character.outfits))
      if (outfit) scene.load.spritesheet(outfit.textureKey, outfit.url, { frameWidth: character.frameWidth, frameHeight: character.frameHeight })
}

export function getOutfit(role: Role, slot: OutfitSlot): OutfitAsset | null { return characterAssets[role].outfits[slot] }

/** Existing behavior code continues to use role IDs; missing outfits leave appearance unchanged. */
export function selectOutfit(sprite: Phaser.GameObjects.Sprite, role: Role, slot: OutfitSlot): boolean {
  const outfit = getOutfit(role, slot)
  if (!outfit || !sprite.scene.textures.exists(outfit.textureKey)) return false
  sprite.setTexture(outfit.textureKey, 1).setOrigin(FOOT_ORIGIN.x, FOOT_ORIGIN.y)
  return true
}

export function textureForAnimation(sprite: Phaser.GameObjects.Sprite, role: Role): string {
  const key = sprite.texture.key
  return Object.values(characterAssets[role].outfits).some(outfit => outfit?.textureKey === key) ? key : role
}

function fallbackSheet(role: Role): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_WIDTH * FRAME_COLUMNS
  canvas.height = FRAME_HEIGHT * FRAME_ROWS
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
