import Phaser from 'phaser'
import type {Role} from './characterAssets'
import type {Direction} from './input'
import {directions,cradleAnchors,attach} from './interactionAnchors'
export class HumanPetAnimator {
 private arms:Record<Role,Phaser.GameObjects.Sprite>
 private saved:Partial<Record<Role,string>>={}
 private active:Partial<Record<Role,{direction:Direction;column:number;walk:boolean;moving:boolean;stroke:boolean}>>={}
 constructor(private scene:Phaser.Scene,private actors:Record<Role,Phaser.GameObjects.Sprite>){
  this.arms={mashuo:scene.add.sprite(0,0,'pet-arms-mashuo').setOrigin(.5,1).setVisible(false),mendu:scene.add.sprite(0,0,'pet-arms-mendu').setOrigin(.5,1).setVisible(false)}
 }
 pose(role:Role,direction:Direction,column:number,stroke=false){
  if(!this.saved[role])this.saved[role]=this.actors[role].texture.key
  this.active[role]={direction,column,walk:false,moving:false,stroke};this.update(this.scene.time.now)
 }
 carry(role:Role,direction:Direction,moving:boolean){
  if(!this.saved[role])this.saved[role]=this.actors[role].texture.key
  this.active[role]={direction,column:2,walk:moving,moving,stroke:false};this.update(this.scene.time.now)
 }
 direction(role:Role){return this.active[role]?.direction??'down'}
 cradle(role:Role){
  const state=this.active[role],phase=state?.walk?Math.floor(this.scene.time.now/125)%4:0
  const base=cradleAnchors[state?.direction??'down']
  return attach(this.actors[role],{x:base.x,y:base.y+([0,-1,0,1][phase])})
 }
 update(time:number){for(const role of ['mashuo','mendu']as const){const state=this.active[role];if(!state)continue
  const actor=this.actors[role],row=directions.indexOf(state.direction),phase=state.walk?Math.floor(time/125)%4:state.column
  const frame=state.walk?16+row*4+phase:row*4+phase
  actor.anims.stop();actor.setFlipX(false).setTexture(`pet-human-${role}`,frame)
  this.arms[role].setTexture(`pet-arms-${role}`,frame).setPosition(actor.x,actor.y+(state.stroke?Math.round(Math.sin(time/130)):0)).setDepth(actor.depth+.008).setVisible(true)
 }}
 restore(role:Role){if(this.saved[role]){const key=this.saved[role]!;this.actors[role].setTexture(key,1).setFlipX(false).play(`${key}-idle-down`)}delete this.saved[role];delete this.active[role];this.arms[role].setVisible(false)}
 restoreAll(){this.restore('mashuo');this.restore('mendu')}
 dispose(){this.restoreAll();this.arms.mashuo.destroy();this.arms.mendu.destroy()}
}
