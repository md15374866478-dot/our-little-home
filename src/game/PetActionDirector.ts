import type Phaser from 'phaser'
import { carryContact, petContact } from './petContact'
import type {Role} from './characterAssets'
import type {Direction} from './input'
import type {Point} from './pathfinding'
import {canStand} from './collision'
import {findPath} from './pathfinding'
import {petCanStand,petDistance,petNear,petPath} from './petNavigation'
import {directions,facingToward,mouthAnchor,attach} from './interactionAnchors'
import {ActionScope} from './ActionScope'
import {HumanPetAnimator} from './HumanPetAnimator'
import {BallAttachment} from './BallAttachment'
import {luckyMotion,luckyPose} from './luckyAssets'
import type {LuckyController} from './LuckyController'
import type {CompanionController} from './CompanionController'
import type {PetAction} from './petBehavior'
export class PetActionDirector {
 readonly scope:ActionScope
 readonly humans:HumanPetAnimator
 readonly ball:BallAttachment
 phase='IDLE'
 holder?:Role
 private holdDirection:Direction='down'
 private ground?:Point
 private locked=new Set<Role>()
 private sleeping=false
 private mouthFollow=false
 private recovery=false
 private actors:Record<Role,Phaser.GameObjects.Sprite>
 constructor(scene:Phaser.Scene,readonly lucky:LuckyController,private companion:CompanionController,private notice:(message:string)=>void){
  this.actors={mashuo:companion.player,mendu:companion.npc};this.scope=new ActionScope(scene);this.humans=new HumanPetAnimator(scene,this.actors);this.ball=new BallAttachment(scene)
  this.ball.ball.setInteractive().on('pointerdown',()=>{if(this.ball.phase==='GROUND')void this.request('fetch')})
  companion.setMotionOverride((role,dir,moving)=>{if(this.holder!==role)return false;this.holdDirection=dir;this.humans.carry(role,dir,moving);return true})
 }
 get busy(){return !['IDLE','HOLD','KENNEL_SLEEP'].includes(this.phase)}
 blocksPlayer(){return this.locked.has('mashuo')}
 private lock(role:Role,value:boolean){if(value)this.locked.add(role);else this.locked.delete(role);this.companion.lockRole(role,value)}
 private unlock(){for(const role of [...this.locked])this.lock(role,false)}
 private pose(frame:number,flip=false){this.lucky.sprite.anims.stop();this.lucky.sprite.setTexture('lucky-performance',frame).setFlipX(flip)}
 private safe(point:Point){return petCanStand(this.lucky.map,point,Object.values(this.actors))}
 private nearGround(point:Point){for(const radius of [0,16,32,48])for(const [x,y]of [[1,0],[-1,0],[0,1],[0,-1]]){const p={x:point.x+x*radius,y:point.y+y*radius};if(this.safe(p))return p}return null}
 async request(action:PetAction){
  const token=this.scope.begin();this.lucky.stopRoute();for(const role of this.locked)this.companion.stopRole(role);this.mouthFollow=false;this.recovery=true
  if(!await this.recover(token)){this.recovery=false;return}
  this.recovery=false;if(!this.scope.valid(token))return
  if(action==='release'||action==='free'||action==='wake'){this.phase='IDLE';this.lucky.groundIdle();return}
  if(action==='follow'||action==='follow-mendu'||action==='feed'){this.phase='IDLE';this.lucky.setExternal(false);this.lucky.legacyRequest(action);return}
  this.lucky.setExternal(true)
  try{
   if(action==='carry'||action==='carry-mendu')await this.pickup(token,action==='carry'?'mashuo':'mendu')
   else if(action==='pet'||action==='pet-mendu')await this.pet(token,action==='pet'?'mashuo':'mendu')
   else if(action==='sleep')await this.sleep(token)
   else if(action==='ball'||action==='fetch')await this.playBall(token,action==='fetch')
  }catch(error){if(this.scope.valid(token)){this.notice('动作遇到阻碍，已安全恢复。');await this.recover(token);this.lucky.groundIdle();this.phase='IDLE'}console.error('Pet action failed',error)}
 }
 async clearForHuman(){const token=this.scope.begin();this.lucky.stopRoute();for(const role of this.locked)this.companion.stopRole(role);this.mouthFollow=false;this.recovery=true;const ok=await this.recover(token);this.recovery=false;if(ok){this.phase='IDLE';this.lucky.groundIdle()}return ok}
 private async recover(token:number){
  if(this.holder&&!await this.releaseCarry(token))return false
  if(this.sleeping&&!await this.wakeKennel(token))return false
  if(this.ball.phase==='MOUTH'||this.ball.phase==='FLYING'){
   const p=this.nearGround(this.lucky.sprite)??this.ground
   if(p&&!await this.ball.place(this.scope,token,p))return false
  }
  if(!this.scope.valid(token))return false
  this.humans.restoreAll();this.unlock();this.lucky.setAirborne(false);return true
 }
 private async pair(token:number,role:Role,kind:'pickup'|'pet'){
  this.phase='APPROACH';this.lock('mashuo',true);this.lock('mendu',true)
  await this.companion.request('free');if(!this.scope.valid(token))return null
  const actor=this.actors[role],other=this.actors[role==='mashuo'?'mendu':'mashuo'],dog=this.lucky.sprite
  const standOptions=(position:Point)=>{
   const preferred=facingToward(actor,position)
   return [preferred,...directions.filter(direction=>direction!==preferred)].flatMap(direction=>{
    const contact=kind==='pickup'?carryContact[role][direction]:petContact[role][direction]
    const goal={x:position.x-contact.x,y:position.y-contact.y}
    if(!canStand(this.lucky.map,goal.x,goal.y)||petDistance(goal,other)<19||!findPath(this.lucky.map,actor,goal))return []
    return [{ direction, goal }]
   })
  }
  for(let attempt=0;attempt<2;attempt++){
   for(const {direction,goal} of standOptions(dog)){
    const arrived=await this.companion.navigateRole(role,goal)
    if(!this.scope.valid(token))return null
    if(!arrived)continue
    const canineDirection=facingToward(dog,actor)
    luckyMotion(dog,canineDirection,'idle')
    return {direction,canineDirection,ground:{x:dog.x,y:dog.y}}
   }
   if(attempt!==0)break
   // If the other person or furniture occupies the contact spot, let Lucky
   // take a few real steps into a clearer position before the actor reaches.
   const space=[[28,0],[-28,0],[0,-28],[0,28],[32,-16],[-32,-16]].map(([x,y])=>({x:dog.x+x,y:dog.y+y}))
    .find(point=>standOptions(point).length&&petPath(this.lucky.map,dog,point,Object.values(this.actors)))
   if(!space||!await this.lucky.navigateTo(space)||!this.scope.valid(token))return null
  }
  return null
 }
 private async pickup(token:number,role:Role){
  const pair=await this.pair(token,role,'pickup')
  if(!pair){if(this.scope.valid(token)){this.unlock();this.lucky.groundIdle();this.phase='IDLE';this.notice('这里没有足够的抱起空间，请换个位置。')}return}
  this.holdDirection=pair.direction;this.ground=pair.ground;this.phase='BEND'
  this.humans.pose(role,pair.direction,0);luckyPose(this.lucky.sprite,'tilt')
  if(!await this.scope.wait(token,380))return
  this.holder=role
  this.lucky.setAirborne(true)
  this.phase='LIFT'
  if(!await this.carryGesture(token,role,pair.direction,pair.ground,false))return
  this.humans.carry(role,pair.direction,false);this.phase='HOLD';this.lucky.machine.state='CARRIED'
  this.lock('mashuo',false);this.lock('mendu',role==='mendu')
  if(role==='mendu')await this.companion.request('follow')
  this.notice(role==='mashuo'?'马硕把 Lucky 托在怀里了。':'门都抱着 Lucky 跟着马硕走。')
 }
 private async carryGesture(token:number,role:Role,direction:Direction,ground:Point,lowering:boolean){
  const dog=this.lucky.sprite,actor=this.actors[role]
  const start={x:dog.x,y:dog.y},supported=this.humans.cradle(role),progress={t:0}
  const end=lowering?ground:supported
  const frame=directions.indexOf(direction)
  const initialDirection=lowering?direction:facingToward(dog,actor)
  const apply=()=>{
   const amount=lowering?1-progress.t:progress.t
   this.humans.pose(role,direction,amount<.27?0:amount<.76?1:2)
   if(amount>.23)this.pose(frame,direction==='down')
   else luckyMotion(dog,initialDirection,'idle')
   dog.setPosition(start.x+(end.x-start.x)*progress.t,start.y+(end.y-start.y)*progress.t)
  }
  apply()
  if(!await this.scope.tween(token,{targets:progress,t:1,duration:680,ease:'Sine.easeInOut',onUpdate:apply}))return false
  if(lowering)this.lucky.setAirborne(false)
  return this.scope.wait(token,lowering?120:90)
 }
 private async releaseCarry(token:number){
  const role=this.holder!;this.lock('mashuo',true);this.lock('mendu',true)
  if(role==='mendu')await this.companion.request('free')
  if(!this.scope.valid(token))return false
  const actor=this.actors[role]
  const options=[this.holdDirection,...directions.filter(direction=>direction!==this.holdDirection)]
  const drop=options.map(direction=>({ direction, point:attach(actor,carryContact[role][direction]) }))
   .find(option=>this.safe(option.point))
  if(!drop){
   this.phase='HOLD'
   this.lock('mashuo',false)
   this.lock('mendu',role==='mendu')
   if(role==='mendu')await this.companion.request('follow')
   this.notice('先走到空地，再把 Lucky 放下。')
   return false
  }
  if(drop.direction!==this.holdDirection){
   this.holdDirection=drop.direction
   this.humans.carry(role,drop.direction,false)
   if(!await this.scope.wait(token,150))return false
  }
  const {direction,point:ground}=drop
  this.phase='LOWER'
  this.companion.stopRole(role)
  if(!await this.carryGesture(token,role,direction,ground,true))return false
  this.holder=undefined;this.lucky.machine.state='IDLE';this.lucky.setAirborne(false);luckyMotion(this.lucky.sprite,facingToward(this.lucky.sprite,actor),'idle');this.humans.restore(role);this.lock(role,false)
  if(role==='mendu')await this.companion.request('free')
  return this.scope.valid(token)
 }
 private async pet(token:number,role:Role){
  const pair=await this.pair(token,role,'pet')
  if(!pair){if(this.scope.valid(token)){this.unlock();this.lucky.groundIdle();this.phase='IDLE';this.notice('这里伸不开手，换个空一点的位置再摸摸。')}return}
  this.phase='PET_REACH';this.humans.pose(role,pair.direction,0)
  if(!await this.scope.wait(token,300))return
  this.humans.pose(role,pair.direction,3,true);this.lucky.machine.state='PETTED';this.phase='PET_CONTACT'
  for(let i=0;i<16;i++){this.pose(32+directions.indexOf(pair.canineDirection)*4+i%4);if(!await this.scope.wait(token,140))return}
  this.phase='PET_WITHDRAW';this.humans.pose(role,pair.direction,0);if(!await this.scope.wait(token,300))return
  this.humans.restoreAll();this.unlock();this.lucky.groundIdle();this.phase='IDLE';this.notice('Lucky 闭着眼睛，享受了一会儿摸摸头。')
 }
 private async sleep(token:number){
  this.phase='WALK_TO_BED';const bed=this.lucky.kennelPosition
  if(!await this.lucky.navigateTo({x:bed.x-32,y:bed.y+8})||!this.scope.valid(token)){if(this.scope.valid(token)){this.lucky.groundIdle();this.phase='IDLE';this.notice('Lucky 暂时走不到狗窝。')}return}
  this.sleeping=true;this.lucky.setAirborne(true);this.phase='ENTER_BED';luckyMotion(this.lucky.sprite,'right','walk')
  if(!await this.scope.tween(token,{targets:this.lucky.sprite,x:bed.x,y:bed.y+14,duration:400}))return
  this.phase='TURN_AROUND'
  for(const dir of ['left','down']as const){luckyMotion(this.lucky.sprite,dir,'idle');if(!await this.scope.wait(token,220))return}
  this.phase='LIE_DOWN';luckyPose(this.lucky.sprite,'lie');if(!await this.scope.wait(token,310))return
  this.pose(8);if(!await this.scope.wait(token,280))return
  this.phase='CURL_UP';this.pose(9);if(!await this.scope.wait(token,450))return
  this.sleeping=true;this.phase='KENNEL_SLEEP';this.lucky.machine.state='SLEEPING';this.notice('Lucky 蜷在小窝里睡着了。')
 }
 private async wakeKennel(token:number){
  this.phase='WAKE_UP';this.pose(12);if(!await this.scope.wait(token,400))return false
  this.phase='STRETCH';this.pose(13);if(!await this.scope.wait(token,550))return false
  this.phase='STAND_UP';this.pose(14);if(!await this.scope.wait(token,350))return false
  this.pose(15);this.phase='LEAVE_BED';const bed=this.lucky.kennelPosition
  let left=false
  for(const point of [{x:bed.x-32,y:bed.y+8},{x:bed.x+32,y:bed.y+8},{x:bed.x,y:bed.y-24}]){if(!this.safe(point))continue;if(await this.lucky.navigateTo(point)){left=true;break}if(!this.scope.valid(token))return false}
  if(!left){this.phase='KENNEL_SLEEP';this.pose(9);this.notice('小窝出口被挡住了，请先让开一点。');return false}
  this.sleeping=false;this.lucky.setAirborne(false);return true
 }
 private async playBall(token:number,fetchOnly:boolean){
  this.lock('mendu',true)
  try{
  const dog=this.lucky.sprite
  if(!fetchOnly||this.ball.phase!=='GROUND'){
   this.phase='THROW';let target:Point|undefined
   for(const [x,y]of [[128,0],[-128,0],[0,128],[0,-128],[80,0],[-80,0]]){const p={x:this.actors.mashuo.x+x,y:this.actors.mashuo.y+y};if(petCanStand(this.lucky.map,p,Object.values(this.actors))&&petPath(this.lucky.map,dog,p,Object.values(this.actors))){target=p;break}}
   if(!target){this.lucky.groundIdle();this.phase='IDLE';this.notice('附近空间太小，带 Lucky 去空地玩球吧。');return}
   if(this.ball.phase==='GROUND'){
    this.lock('mashuo',true);this.humans.pose('mashuo','down',0)
    if(!await this.scope.tween(token,{targets:this.ball.ball,x:this.actors.mashuo.x,y:this.actors.mashuo.y-15,duration:350}))return
    this.humans.restore('mashuo');this.lock('mashuo',false)
   }
   if(!await this.ball.toss(this.scope,token,{x:this.actors.mashuo.x,y:this.actors.mashuo.y-15},target))return
  }
  this.phase='CHASE_BALL';if(!await this.lucky.navigateTo(this.ball.position,true)||!this.scope.valid(token)){if(this.scope.valid(token)){this.phase='IDLE';this.lucky.groundIdle()}return}
  const direction=this.lucky.direction;this.phase='BITE';this.pose(4+directions.indexOf(direction))
  if(!await this.scope.wait(token,250)||!await this.ball.take(this.scope,token,dog,direction))return
  luckyMotion(dog,direction,'idle');this.ball.phase='FLYING';const raised=attach(dog,mouthAnchor(direction,0))
  if(!await this.scope.tween(token,{targets:this.ball.ball,x:raised.x,y:raised.y,duration:160}))return
  this.mouthFollow=true;this.phase='CARRY_BALL'
  const target=petNear(this.lucky.map,dog,this.actors.mashuo,Object.values(this.actors))
  if(!target||!await this.lucky.navigateTo(target,true)||!this.scope.valid(token)){if(this.scope.valid(token)){this.mouthFollow=false;await this.ball.place(this.scope,token,this.nearGround(dog)??this.ball.position);this.lucky.groundIdle();this.phase='IDLE'}return}
  this.mouthFollow=false;this.phase='PLACE_BALL'
  const facing=this.lucky.direction
  this.pose(4+directions.indexOf(facing))
  if(!await this.ball.lowerMouth(this.scope,token,dog,facing))return
  const edge=mouthAnchor(facing,Number(dog.frame.name),true)
  const point=this.nearGround({x:dog.x+edge.x,y:dog.y+5})??{x:dog.x,y:dog.y}
  if(!await this.ball.place(this.scope,token,point))return
  this.lucky.groundIdle();this.phase='IDLE';this.notice('Lucky 把球放在你身边了。')
  }finally{if(this.scope.valid(token))this.lock('mendu',false)}
 }
 onMovementRequested(){if(this.blocksPlayer()&&!this.recovery)void this.request('free')}
 async prepareTrio(){if(this.sleeping&&this.phase==='KENNEL_SLEEP')return true;return this.wakeForTrio()}
 async wakeForTrio(){const ok=await this.clearForHuman();if(ok)this.lucky.setExternal(true);return ok}
 update(time:number){
  this.humans.update(time)
  if(this.holder&&(this.phase==='HOLD'||this.phase==='LIFT'||this.phase==='LOWER')){
   if(this.phase==='HOLD'){const p=this.humans.cradle(this.holder);this.lucky.sprite.setPosition(p.x,p.y);this.pose(directions.indexOf(this.holdDirection)+(time%4200>4030?52:0),this.holdDirection==='down')}
   this.lucky.sprite.setDepth(this.actors[this.holder].depth+(this.holdDirection==='up'?-.002:.004))
  }else if(this.lucky.controlled)this.lucky.sprite.setDepth(10+this.lucky.sprite.y/1000)
  if(this.sleeping&&this.phase==='KENNEL_SLEEP')this.pose(time%4200>3850?10:9)
  if(this.mouthFollow)this.ball.attach(this.lucky.sprite,this.lucky.direction)
 }
 resetScene(){this.scope.cancel();this.lucky.stopRoute();this.ball.clear();this.humans.restoreAll();this.unlock();this.holder=undefined;this.sleeping=false;this.mouthFollow=false;this.phase='IDLE';this.lucky.setExternal(false)}
 dispose(){this.resetScene();this.scope.dispose();this.humans.dispose();this.ball.dispose()}
}
