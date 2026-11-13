import { describe, expect, it } from 'vitest'
import { getEnvironment } from './environment'

describe('Beijing environment', () => {
  it('uses Beijing date across the UTC boundary', () => {
    const env = getEnvironment(new Date('2026-03-01T17:00:00Z'))
    expect(env.dateKey).toBe('2026-03-02')
    expect(env.hour).toBe(1)
    expect(env.season).toBe('spring')
    expect(env.phase).toBe('night')
  })

  it('keeps simulated weather stable for the same Beijing day', () => {
    expect(getEnvironment(new Date('2026-07-12T01:00:00Z')).weather)
      .toBe(getEnvironment(new Date('2026-07-12T12:00:00Z')).weather)
  })
})
