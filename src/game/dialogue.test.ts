import { describe, expect, it } from 'vitest'
import { DialogueBook } from './dialogue'
import { getEnvironment } from './environment'

describe('preset dialogue', () => {
  it('rotates lines and responds to the last interaction', () => {
    const book = new DialogueBook()
    const context = { location: 'home' as const, environment: getEnvironment(new Date('2026-06-01T04:00:00Z')), state: 'TALKING' as const, lastInteraction: 'hand' as const }
    const lines = Array.from({ length: 5 }, () => book.next(context))
    expect(new Set(lines).size).toBe(5)
    expect(lines[0]).toContain('旁边')
  })
})
