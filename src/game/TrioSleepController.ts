import Phaser from 'phaser'
import {ActionScope} from './ActionScope'
import {TrioState} from './trioState'
import type {LuckyController} from './LuckyController'
import type {PetActionDirector} from './PetActionDirector'
import type {CompanionController} from './CompanionController'
import {luckyMotion} from './luckyAssets'
import {trioAllowed} from './access'
import {luckyBedAssetsReady} from './luckyBedFrames'
export class TrioSleepController {
 readonly state=new TrioState()
 readonly scope:ActionScope
 transfer=false
 private onBed=false
 private burrowed=false
 private lift=0
 private tuck=0
 private reveal=0
 private head:Phaser.GameObjects.Sprite
 private above:Phaser.GameObjects.Sprite
 private bodyMask:Phaser.GameObjects.Graphics
 private bodyGeometry:Phaser.Display.Masks.GeometryMask
 private frontMask:Phaser.GameObjects.Graphics
 private headMask:Phaser.GameObjects.Graphics
 private frontGeometry:Phaser.Display.Masks.GeometryMask
 private headGeometry:Phaser.Display.Masks.GeometryMask
 private shadow:Phaser.GameObjects.Ellipse
 private lamp:Phaser.GameObjects.Graphics
 private lampShade={alpha:0}
 private recovery?:Promise<void>
 private priorIntent:'free'|'follow'|'follow-mendu'='free'
 constructor(private scene:Phaser.Scene,private lucky:LuckyController,private director:PetActionDirector,private companion:CompanionController,
  private getLocation:()=> 'home'|'yard',private travelHome:(valid:()=>boolean)=>Promise<boolean>,private notice:(message:string)=>void){
  this.scope=new ActionScope(scene)
  this.head=scene.add.sprite(96,88,'lucky-performance',49).setOrigin(.5,1).setCrop(0,0,40,26).setDepth(12.18).setVisible(false)
  this.above=scene.add.sprite(0,0,'lucky-performance').setOrigin(.5,1).setDepth(12.19).setVisible(false)
  this.frontMask=scene.make.graphics({}, false);this.frontMask.fillStyle(0xffffff).fillRect(75,132,42,70);this.frontGeometry=this.frontMask.createGeometryMask();this.above.setMask(this.frontGeometry)
  // The submerged copy cannot leak through the top edge when the head
  // crosses from below the blanket to the separately revealed pillow layer.
  this.bodyMask=scene.make.graphics({}, false)
  this.bodyMask.fillStyle(0xffffff).fillRect(74,78,44,72)
  this.bodyGeometry=this.bodyMask.createGeometryMask()
  this.headMask=scene.make.graphics({}, false);this.headGeometry=this.headMask.createGeometryMask();this.head.setMask(this.headGeometry)
  this.shadow=scene.add.ellipse(0,0,16,5,0x47372a,.22).setDepth(3.5).setVisible(false)
  this.lamp=scene.add.graphics().setDepth(14)
 }
 get active(){return this.state.active}
 private frame(index:number,flip=false){this.lucky.sprite.anims.stop();this.lucky.sprite.setTexture('lucky-performance',index).setFlipX(flip)}
 private updateQuilt(){
  const quilt=this.companion.bed.quilt
  if (this.burrowed && !this.head.visible && this.lucky.sprite.y > 94) {
   quilt.raiseAt(this.lucky.sprite.y - 12)
  } else quilt.liftCenter(this.burrowed ? this.lift / 10 : null)
  const top = this.lucky.sprite.y - 41 + Math.round(this.tuck * 48)
  const center = this.lucky.sprite.x
  // Paint only Lucky's portion in front of the quilt. An arched lip covers
  // the head first, then the shoulders and finally the rear paws.
  this.frontMask.clear().fillStyle(0xffffff)
    .beginPath().moveTo(center - 22, top - 4)
    .lineTo(center - 12, top).lineTo(center - 5, top + 2)
    .lineTo(center + 5, top + 2).lineTo(center + 12, top)
    .lineTo(center + 22, top - 4).lineTo(center + 22, top + 55)
    .lineTo(center - 22, top + 55).closePath().fillPath()
  this.headMask.clear().fillStyle(0xffffff).fillRect(75,78-this.reveal,42,this.reveal)
 }
 private async cover(token:number,lift:number,duration=400){return this.scope.tween(token,{targets:this,lift,duration,onUpdate:()=>this.updateQuilt()})}
 private phase(token:number,phase:Parameters<TrioState['advance']>[1]){return this.state.advance(token,phase)}
 async start(){
  if(trioAllowed && !luckyBedAssetsReady(this.scene.textures)){
   this.notice('Lucky 的床铺动作素材未加载，请刷新页面后再试。')
   return
  }
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
   if(!await this.prepareJump(token,true))return
   this.phase(revision,'JUMP');this.onBed=true;this.lucky.setAirborne(true);this.shadow.setVisible(true)
   if(!await this.jump(token,{x:126,y:125},true))return
   this.phase(revision,'LAND')
   if(!await this.land(token,true,true))return
   this.phase(revision,'WALK_BED')
   const dog = this.lucky.sprite
   dog.setFlipX(false)
   luckyMotion(dog,'left','walk')
   if(!await this.scope.tween(token,{targets:dog,x:96,y:125,duration:425}))return
   luckyMotion(dog,'down','walk')
   if(!await this.scope.tween(token,{targets:dog,y:133,duration:220}))return
   luckyMotion(dog,'up','idle')
   if(!await this.scope.wait(token,125))return

   this.phase(revision,'BURROW')
   this.burrowed=true
   dog.setMask(this.bodyGeometry)
   this.tuck=0
   this.lift=9
   this.shadow.setVisible(false)
   this.frame(21)
   this.updateExposedSprite()
   this.updateQuilt()
   this.above.setVisible(true)
   for(const [frame,y,tuck] of [[21,129,.30],[22,121,.68],[23,109,1]] as const){
    this.frame(frame)
    const from=this.tuck
    if(!await this.scope.tween(token,{
     targets:dog,y,duration:280,onUpdate:tween=>{ this.tuck=from+(tuck-from)*tween.progress },
    }))return
    this.tuck=tuck
   }
   this.above.setVisible(false)
   this.frame(26);if(!await this.scope.tween(token,{targets:this.lucky.sprite,y:88,duration:750}))return
   this.frame(48);this.head.setVisible(true);if(!await this.scope.tween(token,{targets:this,reveal:25,duration:550,onUpdate:()=>this.updateQuilt()}))return
   if(!await this.cover(token,1.5))return
   this.phase(revision,'SLEEP');this.lucky.machine.state='SLEEPING';this.shadow.setVisible(false)
   await this.scope.tween(token,{targets:this.lampShade,alpha:.17,duration:1400})
   this.notice('我们三个都睡着了。选择「一起起床」或移动即可起床。')
  }catch(error){if(this.scope.valid(token)){this.notice('这次没能走到合适的位置，正在安全恢复。');await this.stop()}console.info('Trio recovered:',String(error))}
 }
 private jumpPose(frame:number,flip:boolean){
  this.lucky.sprite.anims.stop()
  this.lucky.sprite.setTexture('lucky-jump',frame).setFlipX(flip)
 }
 private async prepareJump(token:number,flip:boolean){
  for(const [frame,duration] of [[0,160],[1,115],[2,175]]){
   this.jumpPose(frame,flip)
   if(!await this.scope.wait(token,duration))return false
  }
  return true
 }
 private async jump(token:number,target:{x:number;y:number},flip:boolean){
  const dog=this.lucky.sprite, start={x:dog.x,y:dog.y}, progress={t:0}
  const update=()=>{
   const t=progress.t
   const groundX=start.x+(target.x-start.x)*t
   const groundY=start.y+(target.y-start.y)*t
   dog.setPosition(groundX,groundY-4*15*t*(1-t))
   this.shadow.setPosition(groundX,groundY+2).setScale(1-.28*Math.sin(Math.PI*t),1)
  }
  // Separate the pose holds so even a delayed render does not skip the apex.
  // All three segments still sample the same continuous arc.
  for(const [frame,end,duration] of [[3,.23,110],[4,.58,170],[5,1,200]] as const){
   this.jumpPose(frame,flip)
   if(!await this.scope.tween(token,{
    targets:progress,t:end,duration,ease:'Linear',onUpdate:update,
   }))return false
  }
  return true
 }
 private async land(token:number,flip:boolean,onMattress:boolean){
  for(const [frame,duration,compression] of [[6,115,1],[7,150,2],[0,145,0]]){
   this.jumpPose(frame,flip)
   if(onMattress)this.companion.bed.setMattressOffset(compression)
   if(!await this.scope.wait(token,duration))return false
  }
  return true
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
   if(!await this.cover(token,9))return false
   if(!await this.scope.tween(token,{targets:this,reveal:0,duration:400,onUpdate:()=>this.updateQuilt()}))return false
   this.head.setVisible(false);this.frame(29)
   this.updateExposedSprite()
   this.above.setVisible(true)
   const from=this.tuck
   if(!await this.scope.tween(token,{
    targets:this.lucky.sprite,y:128,duration:760,
    onUpdate:tween=>{ this.tuck=from*(1-tween.progress) },
   }))return false
   this.tuck=0
   this.frame(28);if(!await this.scope.tween(token,{targets:this.lucky.sprite,y:134,duration:260}))return false
   this.lucky.sprite.clearMask()
   this.above.setVisible(false);this.burrowed=false
   this.frame(30);if(!await this.scope.wait(token,550))return false
  }
  if(!await this.prepareJump(token,false))return false
  this.shadow.setVisible(true)
  if(!await this.jump(token,{x:168,y:144},false)||!await this.land(token,false,false))return false
  this.onBed=false;this.lucky.setAirborne(false);this.shadow.setVisible(false);this.companion.bed.quilt.liftCenter(null);this.head.setVisible(false);this.above.setVisible(false)
  // Keep Lucky grounded but coordinated until BOTH humans finish leaving bed.
  this.lucky.setExternal(true);this.lucky.machine.state='IDLE';luckyMotion(this.lucky.sprite,'down','idle');return true
 }
 private cleanup(resumeLucky=true){this.onBed=false;this.burrowed=false;this.lucky.sprite.clearMask();this.tuck=0;this.reveal=0;this.lift=0;this.lampShade.alpha=0;this.lamp.clear();this.head.setVisible(false);this.above.setVisible(false);this.companion.bed.quilt.liftCenter(null);this.shadow.setVisible(false);this.companion.bed.setMattressOffset(0);this.companion.bed.setHeadLayerEnabled(false);this.companion.lockRole('mashuo',false);this.companion.lockRole('mendu',false);if(resumeLucky){this.lucky.setExternal(false);this.lucky.legacyRequest(this.priorIntent)}}
 private updateExposedSprite(){
  const body=this.lucky.sprite
  this.above.setPosition(body.x,body.y).setTexture(body.texture.key,body.frame.name).setFlipX(body.flipX)
 }
 update(time:number){
  if(!this.active)return
  if(this.onBed){
   this.lucky.sprite.setDepth(this.burrowed?11:12.15)
   if(this.above.visible)this.updateExposedSprite()
   if(this.state.phase==='LAND'||this.state.phase==='WALK_BED'){
    this.shadow.setPosition(this.lucky.sprite.x,this.lucky.sprite.y+2).setScale(1)
   }
  }
  if(this.state.phase==='SLEEP'){
   this.frame(49+Math.floor(time/1500)%2);this.head.setTexture('lucky-performance',this.lucky.sprite.frame.name).setPosition(96,88);this.lift=1.5+Math.sin(time/1700)*.7;this.updateQuilt()
  }else if(this.head.visible)this.head.setTexture(this.lucky.sprite.texture.key,this.lucky.sprite.frame.name).setPosition(this.lucky.sprite.x,this.lucky.sprite.y)
  if(this.burrowed&&this.state.phase!=='SLEEP')this.updateQuilt()
  this.lamp.clear();if(this.lampShade.alpha>0)this.lamp.fillStyle(0x3e3024,this.lampShade.alpha).fillRoundedRect(162,115,13,20,3)
 }
 resetScene(){if(this.transfer||!this.active)return;this.scope.cancel();const rev=this.state.cancel();this.state.recovered(rev);this.cleanup()}
 dispose(){this.scope.dispose();this.lucky.sprite.clearMask();this.bodyGeometry.destroy();this.bodyMask.destroy();this.head.destroy();this.above.destroy();this.shadow.destroy();this.lamp.destroy();this.frontGeometry.destroy();this.headGeometry.destroy();this.frontMask.destroy();this.headMask.destroy()}
}
