import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FRAME_HEIGHT, FRAME_WIDTH, normalizeRole } from './characterAssets'
import { migratePlayerProfile } from './contracts'

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
    }
  })

  it('matches raster map dimensions to the existing collision maps', () => {
    expect(pngHeader('maps/home.png')).toMatchObject({ width: 30 * 16, height: 24 * 16 })
    for (const season of ['spring', 'summer', 'autumn', 'winter'])
      expect(pngHeader(`maps/yard-${season}.png`)).toMatchObject({ width: 44 * 16, height: 34 * 16 })
  })

  it('migrates the legacy player role without changing the displayed name', () => {
    expect(normalizeRole('sister')).toBe('mashuo')
    expect(migratePlayerProfile({ id: 'a', role: 'sister', displayName: '马硕' })).toEqual({
      id: 'a', role: 'mashuo', displayName: '马硕',
    })
  })
})
