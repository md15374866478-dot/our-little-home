import {describe,it,expect} from 'vitest'
import type Phaser from 'phaser'
import {ActionScope} from './ActionScope'
function fixture(){
 const timers=new Set<()=>void>(),tweens=new Set<()=>void>()
 const scene={time:{delayedCall:(_ms:number,done:()=>void)=>{timers.add(done);return{remove:()=>timers.delete(done)}}},tweens:{add:(config:{onComplete:()=>void;onStop:()=>void})=>{tweens.add(config.onComplete);return{stop:()=>{tweens.delete(config.onComplete);config.onStop()}}}}} as unknown as Phaser.Scene
 return{scope:new ActionScope(scene),timers,tweens}
}
describe('animation cancellation and cleanup',()=>{
 it('settles pending waits and tweens on interruption and rejects stale work',async()=>{
  const {scope,timers,tweens}=fixture(),old=scope.begin()
  const waiting=scope.wait(old,500),moving=scope.tween(old,{targets:{x:0},x:10,duration:500})
  const current=scope.begin()
  expect(await waiting).toBe(false);expect(await moving).toBe(false)
  expect(timers.size+tweens.size).toBe(0);expect(scope.valid(old)).toBe(false);expect(scope.valid(current)).toBe(true)
  expect(await scope.wait(old,0)).toBe(false)
 })
 it('completes current work and permanently rejects work after scene disposal',async()=>{
  const {scope,timers}=fixture(),token=scope.begin(),task=scope.wait(token,10)
  for(const done of [...timers])done()
  expect(await task).toBe(true)
  scope.dispose();expect(await scope.wait(scope.begin(),10)).toBe(false)
 })
})
