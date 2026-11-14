import { readFileSync } from 'node:fs'
import type Phaser from 'phaser'
import { describe, expect, it, vi } from 'vitest'
import { FRAME_HEIGHT, FRAME_WIDTH, getOutfit, normalizeRole, selectOutfit } from './characterAssets'
import { homeFurniture, homeSampleLayers } from './artCatalog'
import { migratePlayerProfile } from './contracts'
import { getEnvironment } from './environment'
import { createMap } from './maps'

function pngHeader(path: string) {
  const bytes = readFileSync(`src/assets/${path}`)
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] }
}

describe('replaceable character and map art', () => {
  it('keeps both character atlases on the same transparent frame grid', () => {
    for (const role of ['mashuo', 'mendu']) {
      expect(pngHeader(`characters/${role}.png`)).toEqual({
        width: FRAME_WIDTH * 8, height: FRAME_HEIGHT * 4, colorType: 6,
      })
      expect(readFileSync(`public/art-review/${role}-atlas.png`)).toEqual(readFileSync(`src/assets/characters/${role}.png`))
    }
  })

  it('matches raster map dimensions to the existing collision maps', () => {
    expect(pngHeader('maps/home.png')).toMatchObject({ width: 30 * 16, height: 24 * 16 })
    for (const season of ['spring', 'summer', 'autumn', 'winter'])
      expect(pngHeader(`maps/yard-${season}.png`)).toMatchObject({ width: 44 * 16, height: 34 * 16 })
  })

  it('keeps the indoor bed sample as a separate transparent layer at its declared size', () => {
    const bed = homeSampleLayers.find(layer => layer.id === 'bed')!
    expect(bed.status).toBe('review-sample')
    expect(pngHeader('maps/home-bed-sample.png')).toEqual({ width: bed.pixelWidth, height: bed.pixelHeight, colorType: 6 })
    expect({ x: bed.x, y: bed.y }).toEqual({ x: 30, y: 33 })
    expect(homeFurniture.find(item => item.id === 'bed')?.footprint).toEqual({ x: 2, y: 2, width: 8, height: 7 })
  })

  it('reserves an unavailable second outfit without implying it has art', () => {
    for (const role of ['mashuo', 'mendu'] as const) {
      expect(getOutfit(role, 'default')?.walkFrames).toBe(16)
      expect(getOutfit(role, 'default')?.interactionFrames).toBe('temporary')
      expect(getOutfit(role, 'alternate')).toBeNull()
    }
    const setTexture = vi.fn()
    const sprite = { scene: { textures: { exists: () => true } }, setTexture } as unknown as Phaser.GameObjects.Sprite
    expect(selectOutfit(sprite, 'mashuo', 'alternate')).toBe(false)
    expect(setTexture).not.toHaveBeenCalled()
  })

  it('falls back to the previous complete room when a sample layer is missing', () => {
    const keys: string[] = []
    const image = { setOrigin() { return this }, setDepth() { return this } }
    const scene = {
      textures: { exists: (key: string) => !key.startsWith('home-sample') },
      add: { image: (_x: number, _y: number, key: string) => { keys.push(key); return image } },
    } as unknown as Phaser.Scene
    createMap(scene, 'home', getEnvironment(new Date('2026-06-01T04:00:00Z')))
    expect(keys).toEqual(['home-legacy-art', 'home-legacy-front'])
  })

  it('migrates the legacy player role without changing the displayed name', () => {
    expect(normalizeRole('sister')).toBe('mashuo')
    expect(migratePlayerProfile({ id: 'a', role: 'sister', displayName: '马硕' })).toEqual({
      id: 'a', role: 'mashuo', displayName: '马硕',
    })
  })
})
