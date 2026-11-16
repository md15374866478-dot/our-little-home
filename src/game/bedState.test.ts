import { describe, expect, it } from 'vitest'
import { BedState } from './bedState'

describe('independent bed occupancy', () => {
  it('lets one person wake while the other remains asleep', () => {
    const bed = new BedState()
    for (const person of ['mashuo', 'mendu'] as const) {
      const token = bed.begin(person)!
      for (const phase of ['uncovering', 'entering', 'covering', 'asleep'] as const)
        expect(bed.advance(person, token, phase)).toBe(true)
    }
    const exit = bed.cancel('mashuo')
    expect(exit.phase).toBe('waking')
    expect(bed.phase('mendu')).toBe('asleep')
    expect(bed.advance('mashuo', exit.revision, 'leaving')).toBe(true)
    expect(bed.advance('mashuo', exit.revision, 'awake')).toBe(true)
  })

  it('rejects stale callbacks after cancelling entry', () => {
    const bed = new BedState()
    const token = bed.begin('mendu')!
    expect(bed.advance('mendu', token, 'uncovering')).toBe(true)
    const exit = bed.cancel('mendu')
    expect(bed.advance('mendu', token, 'entering')).toBe(false)
    expect(bed.advance('mendu', exit.revision, 'awake')).toBe(true)
    expect(bed.phase('mashuo')).toBe('awake')
  })
})
