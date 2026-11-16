import type Phaser from 'phaser'
import type { Direction } from './input'
import sheet from '../assets/lucky/lucky.png'
import bed from '../assets/lucky/bed.png'
import front from '../assets/lucky/bed-front.png'
export const luckyAssets = { frameWidth:40, frameHeight:40, columns:8, rows:6, origin:{x:.5,y:1}, sheet, bed, front }
export function preloadLucky(scene:Phaser.Scene) {
  scene.load.spritesheet('lucky',sheet,{frameWidth:40,frameHeight:40})
  scene.load.image('lucky-bed',bed);scene.load.image('lucky-bed-front',front)
}
export function registerLucky(scene:Phaser.Scene) {
  const make=(name:string,frames:number[],rate:number,repeat=-1)=>{
    if(!scene.anims.exists(`lucky-${name}`))scene.anims.create({key:`lucky-${name}`,frames:frames.map(frame=>({key:'lucky',frame})),frameRate:rate,repeat})
  }
  for(const [row,direction] of ['down','left','right','up'].entries()) {
    make(`idle-${direction}`,[row*4],1)
    make(`walk-${direction}`,[0,1,2,3].map(n=>row*4+n),8)
    make(`run-${direction}`,[0,1,2,3].map(n=>16+row*4+n),12)
  }
  make('wag',[32,33,34,35],6);make('sit',[36,37],5,0);make('lie',[38,39],5,0)
  make('sleep',[40,41,42,43],2);make('tilt',[44,45],2);make('paw',[46,47],3)
}
export function luckyMotion(sprite:Phaser.GameObjects.Sprite,direction:Direction,motion:'idle'|'walk'|'run') {sprite.play(`lucky-${motion}-${direction}`,true)}
export function luckyPose(sprite:Phaser.GameObjects.Sprite,pose:'wag'|'sit'|'lie'|'sleep'|'tilt'|'paw') {sprite.play(`lucky-${pose}`,true)}
