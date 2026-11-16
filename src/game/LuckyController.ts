import Phaser from 'phaser'
import { PetBehavior, type PetAction } from './petBehavior'
import { petCanStand, petDistance, petNear, petPath } from './petNavigation'
import { canStand } from './collision'
import type { MapKind, WorldMap } from './maps'
import type { Point } from './pathfinding'
import type { Direction } from './input'
import { luckyPose, luckyMotion } from './luckyAssets'
export class LuckyController {
  readonly sprite: Phaser.GameObjects.Sprite
  readonly machine = new PetBehavior()
  private shadow: Phaser.GameObjects.Ellipse
  private label: Phaser.GameObjects.Text
  private bed: Phaser.GameObjects.Image
  private bedFront: Phaser.GameObjects.Image
  private ball: Phaser.GameObjects.Arc
  private bowl: Phaser.GameObjects.Graphics
  private path: Point[] = []
  private goal?: Point
  private routePurpose: 'wander' | 'follow' | 'approach' | 'ball' | 'return' | 'bed' | 'yield' = 'wander'
  private pending: PetAction = 'free'
  private due = 0
  private planDue = 0
  private timeout = 0
  private stuck = 0
  private lastObstaclePlan = 0
  private cursor = 0
  private facing: Direction = 'down'
  private enteringBed = false
  private paused = false
  private yieldDone?: (ok: boolean) => void
  private noticeDue = 0
  private throwTween?: Phaser.Tweens.Tween
  private heart: Phaser.GameObjects.Text
  constructor(private scene: Phaser.Scene, private world: WorldMap, private kind: MapKind,
    private player: Phaser.GameObjects.Sprite, private npc: Phaser.GameObjects.Sprite,
    private onMessage: (message: string) => void, onMenu: () => void) {
    this.sprite = scene.add.sprite(kind === 'home' ? 280 : 330, kind === 'home' ? 344 : 480, 'lucky', 1).setOrigin(.5,1).setInteractive()
    this.sprite.on('pointerdown', () => onMenu())
    this.shadow = scene.add.ellipse(this.sprite.x,this.sprite.y-2,19,5,0x40352b,.22).setDepth(9)
    this.label = scene.add.text(0,0,'Lucky',{fontFamily:'monospace',fontSize:'8px',color:'#fff4db',backgroundColor:'#785d40',padding:{x:2,y:1}}).setOrigin(.5,1).setDepth(20)
    this.bed = scene.add.image(0,0,'lucky-bed').setDisplaySize(46,30).setOrigin(.5,.5).setDepth(1)
    this.bedFront = scene.add.image(0,0,'lucky-bed-front').setDisplaySize(46,10).setOrigin(.5,0)
    this.ball = scene.add.circle(0,0,4,0xc95740).setStrokeStyle(1,0x813e31).setDepth(10).setVisible(false)
    this.bowl = scene.add.graphics().setDepth(9).setVisible(false)
    this.heart = scene.add.text(0,0,'♥',{fontFamily:'monospace',fontSize:'12px',color:'#dc7f76'}).setOrigin(.5).setDepth(21).setVisible(false)
    this.placeBed(); this.due = scene.time.now + 4000
    luckyMotion(this.sprite,'down','idle')
  }
  private actors() { return [this.player,this.npc] }
  private home(): Point { return this.kind === 'home' ? {x:312,y:352} : {x:408,y:472} }
  private placeBed() { const b=this.home();this.bed.setPosition(b.x,b.y);this.bedFront.setPosition(b.x,b.y+5).setDepth(10+(b.y+20)/1000+.003) }
  blocks(point: Point) {
    if(this.paused)return false
    const bed=this.home()
    return (Math.abs(point.x-bed.x)<23&&Math.abs(point.y-bed.y)<12) || (this.machine.state!=='CARRIED'&&petDistance(point,this.sprite)<15)
  }
  private announce(message: string) { this.onMessage(message); this.noticeDue=this.scene.time.now+4000 }
  request(action: PetAction) {
    if (action==='carry' && this.machine.state==='CARRIED') { this.announce('Lucky 已经在马硕怀里啦。'); return }
    if (this.machine.state === 'CARRIED' && action !== 'carry') {
      if (!this.drop()) return
    }
    this.yieldDone?.(false);this.yieldDone=undefined
    this.throwTween?.stop(); this.throwTween=undefined
    this.machine.command(action); this.path=[];this.goal=undefined;this.enteringBed=false
    this.ball.setVisible(false);this.bowl.setVisible(false);this.sprite.setRotation(0)
    this.pending=action;this.due=this.scene.time.now+6500;this.planDue=0
    if (action==='free'||action==='release') { luckyPose(this.sprite,'tilt');this.announce('Lucky 去自由活动啦。');return }
    if (action==='follow'||action==='follow-mendu') { this.announce(action==='follow'?'Lucky 跟着马硕。':'Lucky 跟着门都。');return }
    if (action==='sleep') {
      if (!this.navigate(this.home(),'bed')) this.fail('Lucky 暂时走不到狗窝。')
      else this.announce('Lucky 回自己的小窝休息。')
      return
    }
    const target=petNear(this.world,this.sprite,this.player,this.actors())
    if (!target||!this.navigate(target,'approach')) this.fail('这里走不过去，换个空一点的地方吧。')
    else this.announce('Lucky 正在靠近马硕。')
  }
  makeRoom(): Promise<boolean> {
    if(this.machine.state==='SLEEPING')return Promise.resolve(true)
    this.request('free')
    if(this.machine.state==='CARRIED')return Promise.resolve(false)
    const points=this.kind==='home'?[this.home(),{x:280,y:176},{x:200,y:176},{x:184,y:328}]:[{x:456,y:456},{x:280,y:456},{x:248,y:280},{x:472,y:312}]
    const target=points.find(p=>this.actors().every(a=>petDistance(p,a)>50)&&petPath(this.world,this.sprite,p,this.actors()))
    if(!target)return Promise.resolve(false)
    this.machine.state='WANDER'
    this.due=this.scene.time.now+20000
    return new Promise(resolve=>{this.yieldDone=resolve;if(!this.navigate(target,'yield')){this.yieldDone=undefined;resolve(false)}})
  }
  private drop() {
    const target=petNear(this.world,this.player,this.player,this.actors())
    if (!target) { this.announce('附近没有安全的落脚处，先走到空地吧。');return false }
    // Being placed down from the player's arms is an explicit carry exit.
    this.sprite.setPosition(target.x,target.y);this.machine.state='IDLE';return true
  }
  private navigate(goal:Point,purpose: typeof this.routePurpose) {
    const path=petPath(this.world,this.sprite,goal,this.actors())
    if (!path) return false
    this.path=path;this.goal=goal;this.routePurpose=purpose;this.timeout=this.scene.time.now+20000;this.stuck=0
    return true
  }
  private fail(message:string) {
    this.path=[];this.goal=undefined;this.enteringBed=false;this.ball.setVisible(false);this.bowl.setVisible(false)
    this.yieldDone?.(false);this.yieldDone=undefined
    this.machine.fail(this.machine.revision);this.due=this.scene.time.now+7000;luckyPose(this.sprite,'tilt');this.announce(message)
  }
  private arrived() {
    this.path=[];this.goal=undefined
    if(this.routePurpose==='yield'){this.machine.state='IDLE';luckyPose(this.sprite,'sit');this.due=this.scene.time.now+12000;this.yieldDone?.(true);this.yieldDone=undefined;return}
    const state=this.machine.state
    if (this.routePurpose==='bed') {
      this.enteringBed=true;this.due=this.scene.time.now+650;luckyPose(this.sprite,'lie');return
    }
    if (this.routePurpose==='ball') {
      this.machine.state='RETURNING'
      const target=petNear(this.world,this.sprite,this.player,this.actors())
      if (!target||!this.navigate(target,'return')) this.fail('球找到了，Lucky 在这里等你。')
      return
    }
    if (this.routePurpose==='return') {
      this.ball.setVisible(false);this.machine.state='IDLE';luckyPose(this.sprite,'paw');this.due=this.scene.time.now+6500;this.announce('Lucky 把球带回来了！');return
    }
    if (this.routePurpose==='approach') {
      if (this.pending==='carry') {this.machine.state='CARRIED';luckyPose(this.sprite,'paw');this.announce('抱起 Lucky 啦，选择「放下」回到地面。')}
      else if (this.pending==='pet') {this.machine.state='PETTED';luckyPose(this.sprite,'wag');this.due=this.scene.time.now+3000;this.announce('Lucky 摇着尾巴，蹭了蹭马硕的手。')}
      else if (this.pending==='feed') {
        this.machine.state='EATING';luckyPose(this.sprite,'lie');this.due=this.scene.time.now+3500
        this.bowl.clear().fillStyle(0x92653d).fillRect(this.sprite.x-7,this.sprite.y+1,14,5).fillStyle(0xe3cba3).fillRect(this.sprite.x-6,this.sprite.y,12,3).fillStyle(0x795032).fillRect(this.sprite.x-3,this.sprite.y,6,2).setVisible(true)
        this.announce('Lucky 在认真吃点心。')
      } else this.throwBall()
      return
    }
    if (state==='WANDER') {this.machine.state='IDLE';luckyPose(this.sprite,this.cursor%2?'sit':'tilt');this.due=this.scene.time.now+6000}
    else luckyMotion(this.sprite,this.facing,'idle')
  }
  private throwBall() {
    let target:Point|undefined
    for (const [dx,dy] of [[128,0],[-128,0],[0,128],[0,-128],[80,0],[-80,0],[64,48],[-64,48]]) {
      const p={x:this.player.x+dx,y:this.player.y+dy}
      if(petPath(this.world,this.sprite,p,this.actors())){target=p;break}
    }
    if(!target){this.fail('附近空间太小，带 Lucky 到空地玩球吧。');return}
    const goal=target, token=this.machine.revision, start={x:this.player.x,y:this.player.y-20}, progress={t:0}
    this.ball.setPosition(start.x,start.y).setVisible(true)
    this.machine.state='FETCHING';luckyPose(this.sprite,'wag')
    this.throwTween=this.scene.tweens.add({targets:progress,t:1,duration:550,
      onUpdate:()=>this.ball.setPosition(start.x+(goal.x-start.x)*progress.t,start.y+(goal.y-start.y)*progress.t-Math.sin(progress.t*Math.PI)*22),
      onComplete:()=>{this.throwTween=undefined;if(this.machine.revision===token&&!this.navigate(goal,'ball'))this.fail('Lucky 暂时走不到球旁边。')},
    })
    this.announce('球扔出去啦，Lucky 快去找！')
  }
  private advance(delta:number) {
    if(!this.path.length)return
    if(this.scene.time.now>this.timeout){this.fail('Lucky 暂时找不到路，先休息一下。');return}
    const run=this.machine.state==='FETCHING'||this.machine.state==='RETURNING'
    let budget=(run?145:this.machine.intent!=='free'?112:78)*Math.min(delta,100)/1000
    while(budget>0&&this.path.length){
      const goal=this.path[0],dx=goal.x-this.sprite.x,dy=goal.y-this.sprite.y,dist=Math.hypot(dx,dy)
      if(dist<1){this.path.shift();continue}
      const step=Math.min(dist,budget,3),p={x:this.sprite.x+dx/dist*step,y:this.sprite.y+dy/dist*step}
      if(!petCanStand(this.world,p,this.actors())){
        this.stuck+=delta
        if(this.stuck>400&&this.goal&&this.scene.time.now-this.lastObstaclePlan>400){const path=petPath(this.world,this.sprite,this.goal,this.actors());this.lastObstaclePlan=this.scene.time.now;if(path)this.path=path}
        if(this.stuck>1600)this.fail('Lucky 在旁边等一等。')
        return
      }
      this.sprite.setPosition(p.x,p.y);budget-=step;this.stuck=0
      this.facing=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up'
      luckyMotion(this.sprite,this.facing,run?'run':'walk')
    }
    if(!this.path.length)this.arrived()
  }
  update(delta:number) {
    if(this.paused)return
    const now=this.scene.time.now
    if(this.noticeDue&&now>this.noticeDue){this.noticeDue=0;this.onMessage('')}
    if(this.machine.state==='CARRIED'){
      this.sprite.setPosition(this.player.x+12,this.player.y-10).setDepth(10+this.player.y/1000+.002)
    } else {
      this.advance(delta)
      if(this.enteringBed) this.sprite.y=this.home().y+14*(1-Math.max(0,this.due-now)/650)
      if(this.enteringBed&&now>this.due){this.enteringBed=false;this.machine.state='SLEEPING';luckyPose(this.sprite,'sleep')}
      if(this.machine.intent!=='free'&&now>this.planDue){
        this.planDue=now+200
        const actor=this.machine.intent==='follow-mendu'?this.npc:this.player
        const target=petNear(this.world,this.sprite,actor,this.actors())
        if(target&&petDistance(this.sprite,target)>10&&(!this.goal||petDistance(this.goal,target)>16))this.navigate(target,'follow')
      } else if(this.machine.intent==='free'&&now>this.due&&!this.path.length&&!this.enteringBed&&!['SLEEPING','GOING_HOME','CARRIED'].includes(this.machine.state)){
        this.bowl.setVisible(false)
        this.machine.state='WANDER';this.cursor++;this.due=now+16000
        const actor=this.cursor%2?this.player:this.npc
        const target=petNear(this.world,this.sprite,actor,this.actors())
        if(!target||!this.navigate(target,'wander')){this.machine.state='IDLE';this.due=now+5000;luckyPose(this.sprite,'tilt')}
      }
      this.sprite.setDepth(10+this.sprite.y/1000)
    }
    if(this.machine.state==='RETURNING')this.ball.setPosition(this.sprite.x+4,this.sprite.y-8).setDepth(this.sprite.depth+.001)
    this.shadow.setVisible(this.machine.state!=='CARRIED'&&this.machine.state!=='SLEEPING').setPosition(this.sprite.x,this.sprite.y-2)
    this.heart.setVisible(this.machine.state==='PETTED').setPosition(this.sprite.x,this.sprite.y-42+Math.sin(now/200)*2)
    this.label.setVisible(this.machine.state!=='CARRIED').setPosition(this.sprite.x,this.sprite.y-38)
  }
  beginSceneChange(){this.yieldDone?.(false);this.yieldDone=undefined;this.throwTween?.stop();this.paused=true;this.path=[];this.goal=undefined;this.ball.setVisible(false);this.bowl.setVisible(false)}
  onMapChanged(world:WorldMap,kind:MapKind){
    const carried=this.machine.state==='CARRIED',intent=this.machine.intent
    this.world=world;this.kind=kind;this.placeBed();this.path=[];this.goal=undefined;this.enteringBed=false;this.paused=false
    const spawn=kind==='home'?{x:280,y:344}:{x:328,y:288}
    if(canStand(world,spawn.x,spawn.y))this.sprite.setPosition(spawn.x,spawn.y)
    this.machine.command(carried?'carry':intent==='free'?'free':intent)
    if(carried)this.machine.state='CARRIED'
    else luckyMotion(this.sprite,'down','idle')
    this.due=this.scene.time.now+5000;this.planDue=0
  }
  dispose(){this.yieldDone?.(false);this.yieldDone=undefined;this.throwTween?.stop();this.heart.destroy();this.sprite.removeAllListeners();this.sprite.destroy();this.label.destroy();this.shadow.destroy();this.bed.destroy();this.bedFront.destroy();this.ball.destroy();this.bowl.destroy()}
}
