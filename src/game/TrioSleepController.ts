import Phaser from 'phaser'
import {ActionScope} from './ActionScope'
import {TrioState} from './trioState'
import type {LuckyController} from './LuckyController'
import type {PetActionDirector} from './PetActionDirector'
import type {CompanionController} from './CompanionController'
import {luckyMotion} from './luckyAssets'
import {trioAllowed} from './access'
export class TrioSleepController {
 readonly state=new TrioState()
 readonly scope:ActionScope
 transfer=false
 private onBed=false
 private burrowed=false
 private lift=0
 private reveal=0
 private head:Phaser.GameObjects.Sprite
 private above:Phaser.GameObjects.Sprite
 private rope:Phaser.GameObjects.Rope
 private frontMask:Phaser.GameObjects.Graphics
 private bodyMask:Phaser.GameObjects.Graphics
 private headMask:Phaser.GameObjects.Graphics
 private bodyGeometry:Phaser.Display.Masks.GeometryMask
 private frontGeometry:Phaser.Display.Masks.GeometryMask
 private headGeometry:Phaser.Display.Masks.GeometryMask
 private shadow:Phaser.GameObjects.Ellipse
 private lamp:Phaser.GameObjects.Graphics
 private lampShade={alpha:0}
 private recovery?:Promise<void>
 private priorIntent:'free'|'follow'|'follow-mendu'='free'
 constructor(scene:Phaser.Scene,private lucky:LuckyController,private director:PetActionDirector,private companion:CompanionController,
  private getLocation:()=> 'home'|'yard',private travelHome:(valid:()=>boolean)=>Promise<boolean>,private notice:(message:string)=>void){
  this.scope=new ActionScope(scene)
  this.head=scene.add.sprite(96,88,'lucky-performance',49).setOrigin(.5,1).setCrop(0,0,40,26).setDepth(12.18).setVisible(false)
  this.above=scene.add.sprite(0,0,'lucky-performance').setOrigin(.5,1).setDepth(12.25).setVisible(false)
  this.frontMask=scene.make.graphics({x:0,y:0});this.frontMask.fillStyle(0xffffff).fillRect(75,132,42,70);this.frontGeometry=this.frontMask.createGeometryMask();this.above.setMask(this.frontGeometry)
  this.bodyMask=scene.make.graphics({x:0,y:0});this.bodyMask.fillStyle(0xffffff).fillRect(75,78,42,90);this.bodyGeometry=this.bodyMask.createGeometryMask()
  this.headMask=scene.make.graphics({x:0,y:0});this.headGeometry=this.headMask.createGeometryMask();this.head.setMask(this.headGeometry)
  this.rope=scene.add.rope(96,109,'quilt-center',undefined,[{x:-16,y:0},{x:-8,y:0},{x:0,y:0},{x:8,y:0},{x:16,y:0}],true).setDepth(12.15).setVisible(false)
  this.shadow=scene.add.ellipse(0,0,16,5,0x47372a,.22).setDepth(3.5).setVisible(false)
  this.lamp=scene.add.graphics().setDepth(14)
 }
 get active(){return this.state.active}
 private frame(index:number,flip=false){this.lucky.sprite.anims.stop();this.lucky.sprite.setTexture('lucky-performance',index).setFlipX(flip)}
 private updateQuilt(){for(let i=0;i<this.rope.points.length;i++){const point=this.rope.points[i];point.y=-this.lift*Math.sin(Math.PI*i/(this.rope.points.length-1))}this.rope.setDirty();this.headMask.clear().fillStyle(0xffffff).fillRect(75,78-this.reveal,42,this.reveal)}
 private async cover(token:number,lift:number,duration=400){return this.scope.tween(token,{targets:this,lift,duration,onUpdate:()=>this.updateQuilt()})}
 private phase(token:number,phase:Parameters<TrioState['advance']>[1]){return this.state.advance(token,phase)}
 async start(){
  const revision=this.state.begin(trioAllowed)
  if(revision===null){this.notice(trioAllowed?'三人睡眠正在进行。':'三人睡眠仅在授权的私有试玩中开放。');return}
  this.revision=revision
  const token=this.scope.begin();this.priorIntent=this.lucky.machine.intent
  try{
   this.notice('准备一起休息。');await this.companion.request('free')
   if(!await this.director.prepareTrio())throw Error('Lucky cannot safely end previous action')
   if(!this.scope.valid(token))return
   this.companion.lockRole('mashuo',true);this.companion.lockRole('mendu',true)
   if(this.getLocation()==='yard'){
    if(!await this.director.wakeForTrio())throw Error('Lucky cannot leave kennel')
    this.transfer=true;const arrived=await this.travelHome(()=>this.scope.valid(token));this.transfer=false
    if(!arrived||!this.scope.valid(token))throw Error('door route unavailable')
    this.lucky.setExternal(true)
   }
   if(!this.phase(revision,'PEOPLE_ENTER'))return
   this.companion.bed.setHeadLayerEnabled(true)
   await this.companion.request('sleep')
   if(!this.scope.valid(token))return
   if(this.companion.bed.state.phase('mashuo')!=='asleep'||this.companion.bed.state.phase('mendu')!=='asleep')throw Error('bed entry failed')
   this.phase(revision,'LUCKY_APPROACH');if(!await this.director.wakeForTrio()||!this.scope.valid(token))throw Error('Lucky could not wake safely');this.notice('两个人已经躺好，Lucky 正跑向床边。')
   if(!await this.lucky.navigateTo({x:168,y:144},true)||!this.scope.valid(token))throw Error('Lucky cannot reach bed')
   this.frame(16,true);if(!await this.scope.wait(token,350))return
   this.phase(revision,'JUMP');this.onBed=true;this.lucky.setAirborne(true);this.shadow.setVisible(true)
   if(!await this.jump(token,{x:126,y:125},true))return
   this.phase(revision,'LAND');this.frame(18,true);this.companion.bed.setMattressOffset(1)
   if(!await this.scope.wait(token,180))return
   this.companion.bed.setMattressOffset(0);this.frame(19,true);if(!await this.scope.wait(token,250))return
   luckyMotion(this.lucky.sprite,'left','walk')
   if(!await this.scope.tween(token,{targets:this.lucky.sprite,x:96,y:151,duration:800}))return
   this.phase(revision,'BURROW');this.burrowed=true;this.rope.setVisible(true);this.frame(20);this.lucky.sprite.setMask(this.bodyGeometry);this.above.setVisible(true)
   if(!await this.cover(token,5))return
   for(const [frame,y]of [[20,148],[21,140],[22,132],[23,124]]as const){this.frame(frame);if(!await this.scope.tween(token,{targets:this.lucky.sprite,y,duration:350}))return}
   this.frame(26);if(!await this.scope.tween(token,{targets:this.lucky.sprite,y:88,duration:750}))return
   this.frame(48);this.head.setVisible(true);if(!await this.scope.tween(token,{targets:this,reveal:25,duration:550,onUpdate:()=>this.updateQuilt()}))return
   if(!await this.cover(token,1.5))return
   this.phase(revision,'SLEEP');this.lucky.machine.state='SLEEPING';this.shadow.setVisible(false)
   await this.scope.tween(token,{targets:this.lampShade,alpha:.17,duration:1400})
   this.notice('我们三个都睡着了。选择「一起起床」或移动即可起床。')
  }catch(error){if(this.scope.valid(token)){this.notice('这次没能走到合适的位置，正在安全恢复。');await this.stop()}console.info('Trio recovered:',String(error))}
 }
 private async jump(token:number,target:{x:number;y:number},flip:boolean){
  const sprite=this.lucky.sprite,start={x:sprite.x,y:sprite.y},progress={t:0};this.frame(17,flip)
  const ok=await this.scope.tween(token,{targets:progress,t:1,duration:650,ease:'Sine.easeInOut',onUpdate:()=>{sprite.setPosition(start.x+(target.x-start.x)*progress.t,start.y+(target.y-start.y)*progress.t-Math.sin(Math.PI*progress.t)*22);this.shadow.setPosition(start.x+(target.x-start.x)*progress.t,start.y+(target.y-start.y)*progress.t+2)}})
  if(ok)this.frame(18,flip)
  return ok
 }
 async wake(){
  if(!this.active||['LUCKY_WAKE','PEOPLE_WAKE','RECOVER'].includes(this.state.phase))return
  if(this.state.phase!=='SLEEP'){await this.stop();return}
  const token=this.scope.begin(),revision=this.stateToken()
  this.phase(revision,'LUCKY_WAKE');this.notice('Lucky 先醒来，再一起起床。')
  if(!await this.exitLucky(token))return
  this.phase(revision,'PEOPLE_WAKE');await this.companion.request('wake')
  if(!this.scope.valid(token))return
  this.phase(revision,'IDLE');this.cleanup();this.notice('都起床啦。')
 }
 // The FSM revision is independent of the animation cancellation scope.
 private revision=0
 private stateToken(){return this.revision}
 async stop(){
  if(!this.active)return
  if(this.recovery)return this.recovery
  const interrupted=this.state.phase,recoveryRevision=this.state.cancel(),token=this.scope.begin();this.transfer=false;this.lucky.stopRoute();this.companion.stopRole('mashuo');this.companion.stopRole('mendu');this.director.scope.cancel()
  this.recovery=(async()=>{try{
   let safe=true
   if(this.onBed){
    if(interrupted==='JUMP'){this.frame(18,true);await this.scope.tween(token,{targets:this.lucky.sprite,x:126,y:125,duration:220})}
    safe=await this.exitLucky(token)
   }else safe=await this.director.clearForHuman()
   await this.companion.request('wake')
   if(this.scope.valid(token)){this.state.recovered(recoveryRevision);this.cleanup(safe)}
  }finally{this.recovery=undefined}})()
  return this.recovery
 }
 private async exitLucky(token:number){
  this.lucky.stopRoute();this.frame(this.burrowed?51:19);if(!await this.scope.wait(token,this.burrowed?450:150))return false
  if(this.burrowed){
   if(!await this.cover(token,5))return false
   if(!await this.scope.tween(token,{targets:this,reveal:0,duration:400,onUpdate:()=>this.updateQuilt()}))return false
   this.head.setVisible(false);this.frame(29)
   if(!await this.scope.tween(token,{targets:this.lucky.sprite,y:145,duration:1000}))return false
   this.frame(28);if(!await this.scope.tween(token,{targets:this.lucky.sprite,y:160,duration:400}))return false
   this.lucky.sprite.clearMask();this.above.setVisible(false);this.burrowed=false
   this.frame(30);if(!await this.scope.wait(token,550))return false
  }
  this.frame(16);if(!await this.scope.wait(token,250))return false
  if(!await this.jump(token,{x:168,y:144},false))return false
  if(!await this.scope.wait(token,200))return false
  this.onBed=false;this.lucky.setAirborne(false);this.lucky.sprite.clearMask();this.shadow.setVisible(false);this.rope.setVisible(false);this.head.setVisible(false);this.above.setVisible(false)
  // Keep Lucky grounded but coordinated until BOTH humans finish leaving bed.
  this.lucky.setExternal(true);this.lucky.machine.state='IDLE';luckyMotion(this.lucky.sprite,'down','idle');return true
 }
 private cleanup(resumeLucky=true){this.onBed=false;this.burrowed=false;this.reveal=0;this.lift=0;this.lampShade.alpha=0;this.lamp.clear();this.lucky.sprite.clearMask();this.head.setVisible(false);this.above.setVisible(false);this.rope.setVisible(false);this.shadow.setVisible(false);this.companion.bed.setMattressOffset(0);this.companion.bed.setHeadLayerEnabled(false);this.companion.lockRole('mashuo',false);this.companion.lockRole('mendu',false);if(resumeLucky){this.lucky.setExternal(false);this.lucky.legacyRequest(this.priorIntent)}}
 update(time:number){
  if(!this.active)return
  if(this.onBed){this.lucky.sprite.setDepth(this.burrowed?11:12.3);this.above.setPosition(this.lucky.sprite.x,this.lucky.sprite.y).setTexture(this.lucky.sprite.texture.key,this.lucky.sprite.frame.name).setFlipX(this.lucky.sprite.flipX)}
  if(this.state.phase==='SLEEP'){
   this.frame(49+Math.floor(time/1500)%2);this.head.setTexture('lucky-performance',this.lucky.sprite.frame.name).setPosition(96,88);this.lift=1.5+Math.sin(time/1700)*.4;this.updateQuilt()
  }else if(this.head.visible)this.head.setTexture(this.lucky.sprite.texture.key,this.lucky.sprite.frame.name).setPosition(this.lucky.sprite.x,this.lucky.sprite.y)
  this.lamp.clear();if(this.lampShade.alpha>0)this.lamp.fillStyle(0x3e3024,this.lampShade.alpha).fillRoundedRect(162,115,13,20,3)
 }
 resetScene(){if(this.transfer||!this.active)return;this.scope.cancel();const rev=this.state.cancel();this.state.recovered(rev);this.cleanup()}
 dispose(){this.scope.dispose();this.lucky.sprite.clearMask();this.head.destroy();this.above.destroy();this.rope.destroy();this.shadow.destroy();this.lamp.destroy();this.frontGeometry.destroy();this.bodyGeometry.destroy();this.headGeometry.destroy();this.frontMask.destroy();this.bodyMask.destroy();this.headMask.destroy()}
}
