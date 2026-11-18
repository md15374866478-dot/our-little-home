import type Phaser from 'phaser'

/** Frames used by the bed choreography. Floor walking is also used on the mattress. */
export const luckyBedFrames = {
  lucky: [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, ...Array.from({ length: 16 }, (_, i) => i + 16)],
  'lucky-jump': [0, 1, 2, 3, 4, 5, 6, 7],
  'lucky-performance': [18, 19, 20, 21, 22, 23, 26, 28, 29, 30, 48, 49, 50, 51],
} as const

export function luckyBedAssetsReady(textures: Phaser.Textures.TextureManager) {
  return Object.entries(luckyBedFrames).every(([key, frames]) => {
    if (!textures.exists(key)) return false
    const texture = textures.get(key)
    return frames.every(index => {
      if (!texture.has(String(index))) return false
      const frame = texture.get(index)
      return frame.cutWidth === 40 && frame.cutHeight === 40
        && frame.cutX >= 0 && frame.cutY >= 0
        && frame.cutX + frame.cutWidth <= frame.source.width
        && frame.cutY + frame.cutHeight <= frame.source.height
    })
  })
}
