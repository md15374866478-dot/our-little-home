import type Phaser from 'phaser'
import {describe,it,expect} from 'vitest'
import {BallAttachment} from './BallAttachment'
import type {ActionScope} from './ActionScope'
const shape=()=>({setStrokeStyle(){return this},setDepth(){return this},setVisible(){return this},setPosition(){return this},destroy(){}})
describe('ball attachment collision lifecycle',()=>{
 it('restores ground collision after placement and removes it while held or on scene cleanup',async()=>{
  const scene={add:{circle:shape,ellipse:shape}} as unknown as Phaser.Scene
  const ball=new BallAttachment(scene),scope={tween:()=>Promise.resolve(true)} as unknown as ActionScope
  expect(ball.blocks({x:80,y:80})).toBe(false)
  expect(await ball.place(scope,1,{x:80,y:80})).toBe(true)
  expect(ball.blocks({x:80,y:80})).toBe(true);expect(ball.blocks({x:100,y:80})).toBe(false)
  const pickup=ball.take(scope,1,{x:80,y:80} as Phaser.GameObjects.Sprite,'left');expect(ball.phase).toBe('FLYING');expect(ball.blocks({x:80,y:80})).toBe(false);await pickup;expect(ball.phase).toBe('MOUTH')
  ball.phase='FLYING';expect(ball.blocks({x:80,y:80})).toBe(false)
  await ball.place(scope,1,{x:120,y:80});ball.clear();expect(ball.blocks({x:120,y:80})).toBe(false)
 })
})
