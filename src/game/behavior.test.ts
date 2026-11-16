import { describe, expect, it } from 'vitest'
import { BehaviorMachine } from './behavior'

describe('NPC behavior transitions', () => {
  it('cancels stale interaction work when a new action starts', () => {
    const machine = new BehaviorMachine()
    const hand = machine.begin('hand')
    expect(machine.finish(hand, 'HOLDING_HANDS', 'hand')).toBe(true)
    const sit = machine.begin('sit')
    expect(machine.state).toBe('TRANSITIONING')
    expect(machine.finish(hand, 'HOLDING_HANDS', 'hand')).toBe(false)
    expect(machine.finish(sit, 'SITTING')).toBe(true)
    expect(machine.intent).toBe('free')
  })

  it('recovers from failed routes and preserves follow intent on scene change', () => {
    const machine = new BehaviorMachine()
    const hug = machine.begin('hug')
    expect(machine.fail(hug)).toBe(true)
    expect(machine.state).toBe('IDLE')
    expect(machine.finish(hug, 'HUGGING')).toBe(false)
    const follow = machine.begin('follow')
    machine.finish(follow, 'FOLLOWING', 'follow')
    machine.sceneChanged()
    expect(machine.state).toBe('FOLLOWING')
    expect(machine.intent).toBe('follow')
  })

  it('keeps player-led poses active when an old autonomy timer expires', () => {
    const machine = new BehaviorMachine()
    for (const [action, state] of [
      ['sit', 'SITTING'], ['sleep', 'SLEEPING'], ['hug', 'HUGGING'], ['talk', 'TALKING'],
    ] as const) {
      const token = machine.begin(action)
      expect(machine.finish(token, state)).toBe(true)
      expect(machine.holdsPlayerInteraction).toBe(true)
      machine.autonomous('IDLE')
      expect(machine.state).toBe(state)
    }
    const free = machine.begin('free')
    machine.finish(free, 'IDLE')
    expect(machine.holdsPlayerInteraction).toBe(false)
    machine.autonomous('WANDER')
    expect(machine.state).toBe('WANDER')
    machine.autonomous('SITTING')
    expect(machine.holdsPlayerInteraction).toBe(false)
    machine.autonomous('IDLE')
    expect(machine.state).toBe('IDLE')
  })
})
