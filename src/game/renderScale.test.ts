import { describe, expect, it } from 'vitest'
import { renderDensity, roomZoom } from './renderScale'

describe('Retina rendering budget and full-room framing', () => {
  it('uses Retina backing pixels without unbounded phone allocations', () => {
    expect(renderDensity(1)).toBe(1)
    expect(renderDensity(2)).toBe(2)
    expect(renderDensity(3)).toBe(2)
    expect(renderDensity(0)).toBe(1)
  })
  it('keeps the complete room inside the physical viewport at integer zoom', () => {
    for (const [width, height] of [[2300, 1468], [1960, 1448], [1150, 734]]) {
      const zoom = roomZoom(width, height)
      expect(Number.isInteger(zoom)).toBe(true)
      expect(480 * zoom).toBeLessThanOrEqual(width)
      expect(384 * zoom).toBeLessThanOrEqual(height)
    }
  })
})
