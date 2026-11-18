import type Phaser from 'phaser'
import { describe, expect, it } from 'vitest'
import { luckyBedAssetsReady, luckyBedFrames } from './luckyBedFrames'

const matchingFrame = { cutX: 40, cutY: 40, cutWidth: 40, cutHeight: 40, source: { width: 320, height: 280 } }

function textures(options: { missingSheet?: string; missingFrame?: number; badCut?: boolean } = {}) {
  return {
    exists: (key: string) => key !== options.missingSheet,
    get: (key: string) => ({
      has: (index: string) => key !== 'lucky-jump' || Number(index) !== options.missingFrame,
      get: () => options.badCut ? { ...matchingFrame, cutX: 300 } : matchingFrame,
    }),
  } as unknown as Phaser.Textures.TextureManager
}

describe('Lucky bed animation atlas contract', () => {
  it('accepts every bed pose when all loaded frames have valid 40×40 cuts', () => {
    expect(luckyBedAssetsReady(textures())).toBe(true)
    expect(luckyBedFrames['lucky-jump']).toContain(6)
    expect(luckyBedFrames.lucky).toContain(7)
  })

  it('blocks the action before taking over the scene if an atlas or a landing frame is missing', () => {
    expect(luckyBedAssetsReady(textures({ missingSheet: 'lucky-performance' }))).toBe(false)
    expect(luckyBedAssetsReady(textures({ missingFrame: 6 }))).toBe(false)
  })

  it('rejects a frame cut outside its source atlas', () => {
    expect(luckyBedAssetsReady(textures({ badCut: true }))).toBe(false)
  })
})
