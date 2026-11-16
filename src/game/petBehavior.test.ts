import { describe, expect, it } from 'vitest'
import { PetBehavior } from './petBehavior'
import { petCanStand, petNear, petPath } from './petNavigation'
import type { WorldMap } from './maps'
const map: WorldMap = { kind: 'home', width: 12, height: 12, blocked: Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>x===0||y===0||x===11||y===11||(x===5&&y<8))) }
describe('Lucky commands and recovery', () => {
  it('interrupts autonomous work and rejects its stale completion', () => {
    const pet = new PetBehavior(), old = pet.command('free'), follow = pet.command('follow')
    expect(pet.finish(old,'WANDER')).toBe(false)
    expect(pet.finish(follow,'FOLLOWING')).toBe(true)
    const sleep = pet.command('sleep'); expect(pet.fail(sleep)).toBe(true)
    expect(pet.state).toBe('IDLE'); expect(pet.intent).toBe('free')
  })
  it('routes around furniture without changing the collision map', () => {
    const before = JSON.stringify(map), path = petPath(map,{x:56,y:56},{x:136,y:56},[])
    expect(path).not.toBeNull(); expect(path!.some(p=>p.y>=128)).toBe(true)
    expect(JSON.stringify(map)).toBe(before)
  })
  it('finds a safe carry release from an owner on a grid boundary', () => {
    const owner={x:48,y:80}
    const goal=petNear(map,owner,owner,[owner])
    expect(goal).not.toBeNull()
    expect(petCanStand(map,goal!,[owner])).toBe(true)
  })
  it('rejects people and blocked destinations safely', () => {
    expect(petCanStand(map,{x:56,y:56},[{x:56,y:56}])).toBe(false)
    expect(petPath(map,{x:56,y:56},{x:88,y:56},[])).toBeNull()
    expect(petPath(map,{x:56,y:56},{x:136,y:56},[{x:136,y:56}])).toBeNull()
  })
})
