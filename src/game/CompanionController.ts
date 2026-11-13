import Phaser from 'phaser'
import { activityAnchors, bedSeat, benchSeat, sofaSeat, type DuoSeat } from './anchors'
import { BehaviorMachine, type BehaviorState, type InteractionAction, type Intent } from './behavior'
import { showIdle, showPose, showWalk, type Role } from './characterAnimations'
import { DialogueBook } from './dialogue'
import { DialogueBubble } from './DialogueBubble'
import type { Environment } from './environment'
import type { Direction } from './input'
import type { MapKind, WorldMap } from './maps'
import { findPath, reachableNear, type Point } from './pathfinding'
import { findHugSpot, formationTarget } from './interactionPositions'
import { RouteFollower } from './routeFollower'

export interface CompanionStatus { state: BehaviorState; intent: Intent }
const apart = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export class CompanionController {
  readonly npc: Phaser.GameObjects.Sprite
  readonly machine = new BehaviorMachine()
  private route: RouteFollower
  private dialogue = new DialogueBook()
  private name: Phaser.GameObjects.Text
  private facing: Record<Role, Direction> = { sister: 'down', mendu: 'down' }
  private autonomyDue: number
  private lastAnchor = ''
  private anchorCursor = 0
  private followDue = 0
  private followGoal?: Point
  private followFailures = 0
  private poseSpot?: DuoSeat
  private exitPromise?: Promise<void>
  private entryTweens = new Set<Phaser.Tweens.Tween>()
  private exitTweens = new Set<Phaser.Tweens.Tween>()
  private waits = new Set<{ event: Phaser.Time.TimerEvent; done: (ok: boolean) => void }>()
  private bubble: DialogueBubble
  private noticeEvent?: Phaser.Time.TimerEvent

  constructor(
    private scene: Phaser.Scene,
    readonly player: Phaser.GameObjects.Sprite,
    private world: WorldMap,
    private location: MapKind,
    private environment: Environment,
    private onStatus: (status: CompanionStatus) => void,
    private onMessage: (message: string) => void,
    onOpenMenu: () => void,
  ) {
    this.npc = scene.add.sprite(25.5 * 16, 28.5 * 16, 'mendu', 1).setOrigin(0.5, 1).setDepth(11)
    this.npc.setInteractive(new Phaser.Geom.Rectangle(-8, -6, 32, 36), Phaser.Geom.Rectangle.Contains)
    this.npc.on('pointerdown', () => onOpenMenu())
    this.name = scene.add.text(this.npc.x, this.npc.y - 30, '门都', {
      fontFamily: 'monospace', fontSize: '9px', color: '#fff3d5', backgroundColor: '#284137', padding: { x: 3, y: 2 },
    }).setOrigin(0.5, 1).setDepth(20)
    this.bubble = new DialogueBubble(scene, this.npc)
    this.route = new RouteFollower(() => this.world, (role, direction, moving) => this.motion(role, direction, moving))
    this.autonomyDue = scene.time.now + 5500
    this.publish()
  }

  get status(): CompanionStatus { return { state: this.machine.state, intent: this.machine.intent } }
  get proximity() { return apart(this.player, this.npc) }
  isPlayerLocked() { return this.route.busy('sister') || ['TRANSITIONING', 'SITTING', 'SLEEPING', 'HUGGING', 'TALKING'].includes(this.machine.state) }
  canPlayerOccupy(x: number, y: number) { return this.machine.intent !== 'hand' || apart({ x, y }, this.npc) >= 10 }

  setPlayerFacing(direction: Direction, moving: boolean) { this.motion('sister', direction, moving) }
  setMenuOpen(open: boolean) {
    this.bubble.setMenuOpen(open)
  }

  playerMovementRequested() {
    if (this.isPlayerLocked() && !this.route.busy('sister') && this.machine.state !== 'TRANSITIONING') void this.request('free')
    else if (this.route.busy('sister')) void this.request('free')
  }

  async request(action: InteractionAction) {
    const previous = this.machine.state
    const token = this.machine.begin(action)
    this.cancelWork()
    this.followGoal = undefined
    this.publish()
    if (previous === 'HOLDING_HANDS') {
      showPose(this.player, 'sister', 'hand-end')
      showPose(this.npc, 'mendu', 'hand-end')
      if (!await this.wait(230) || !this.machine.valid(token)) return
    }
    if (this.poseSpot) {
      await this.exitPose()
      if (!this.machine.valid(token)) return
    }
    this.motion('sister', this.facing.sister, false)
    this.motion('mendu', this.facing.mendu, false)
    switch (action) {
      case 'free':
        this.machine.finish(token, 'IDLE')
        this.autonomyDue = this.scene.time.now + 5000
        this.notice('门都去自由活动了。')
        break
      case 'follow':
        this.machine.finish(token, 'FOLLOWING', 'follow')
        this.followDue = 0
        this.followFailures = 0
        this.notice('门都会跟着姐姐。')
        break
      case 'hand': await this.startHand(token); break
      case 'hug': await this.startHug(token); break
      case 'sit': await this.startSeat(token, this.location === 'home' ? sofaSeat : benchSeat, 'SITTING'); break
      case 'sleep':
        if (this.location !== 'home') this.fail(token, '双人床在小屋里，先回家吧。')
        else await this.startSeat(token, bedSeat, 'SLEEPING')
        break
      case 'talk': await this.startTalk(token); break
    }
    this.publish()
  }

  private async startTalk(token: number) {
    if (this.proximity > 62) {
      const desired = reachableNear(this.world, this.npc, { x: this.player.x + 24, y: this.player.y }, 2)
      if (!desired || !await this.route.navigate(this.npc, 'mendu', desired)) return this.fail(token, '门都暂时走不过来，换个地方试试。')
    }
    if (!this.machine.valid(token)) return
    this.faceEachOther()
    this.machine.finish(token, 'TALKING')
    showPose(this.npc, 'mendu', 'talk')
    const line = this.dialogue.next({ location: this.location, environment: this.environment, state: this.machine.state, lastInteraction: this.machine.lastInteraction })
    this.bubble.show(line)
    this.publish()
    if (!await this.wait(3900) || !this.machine.valid(token)) return
    this.bubble.hide()
    this.machine.finish(token, 'IDLE')
    this.autonomyDue = this.scene.time.now + 5000
    this.motion('mendu', this.facing.mendu, false)
  }

  private async startHand(token: number) {
    const goal = formationTarget(this.world, this.player, this.npc, this.facing.sister, true)
    if (!goal || !await this.route.navigate(this.npc, 'mendu', goal)) return this.fail(token, '门都暂时无法走到身旁。')
    if (!this.machine.valid(token)) return
    this.faceEachOther()
    showPose(this.player, 'sister', 'hand-start')
    showPose(this.npc, 'mendu', 'hand-start')
    if (!await this.wait(320) || !this.machine.valid(token)) return
    this.machine.finish(token, 'HOLDING_HANDS', 'hand')
    showPose(this.player, 'sister', 'hand')
    showPose(this.npc, 'mendu', 'hand')
    this.followDue = 0
    this.followFailures = 0
    this.notice('牵好手啦，慢慢走。')
  }

  private async startHug(token: number) {
    const spot = findHugSpot(this.world, this.player, this.npc)
    if (!spot) return this.fail(token, '这里空间有点小，换个位置再抱抱。')
    const [a, b] = await Promise.all([
      this.route.navigate(this.player, 'sister', spot[0]),
      this.route.navigate(this.npc, 'mendu', spot[1]),
    ])
    if (!this.machine.valid(token)) return
    if (!a || !b) return this.fail(token, '走不到合适的位置，先停一下。')
    this.faceEachOther()
    showPose(this.player, 'sister', 'hug-start')
    showPose(this.npc, 'mendu', 'hug-start')
    if (!await this.wait(350) || !this.machine.valid(token)) return
    this.machine.finish(token, 'HUGGING')
    showPose(this.player, 'sister', 'hug')
    showPose(this.npc, 'mendu', 'hug')
    this.notice('抱一下，再慢慢出发。')
  }

  private async startSeat(token: number, seat: DuoSeat, state: 'SITTING' | 'SLEEPING') {
    const playerRoute = findPath(this.world, this.player, seat.approach[0])
    const npcRoute = findPath(this.world, this.npc, seat.approach[1])
    if (!playerRoute || !npcRoute) return this.fail(token, state === 'SITTING' ? '座位暂时走不到。' : '床边暂时走不到。')
    const [a, b] = await Promise.all([
      this.route.navigate(this.player, 'sister', seat.approach[0]),
      this.route.navigate(this.npc, 'mendu', seat.approach[1]),
    ])
    if (!this.machine.valid(token)) return
    if (!a || !b) return this.fail(token, '前往互动位置时遇到阻碍。')
    this.poseSpot = seat
    const pose = state === 'SITTING' ? 'sit' : 'lie'
    showPose(this.player, 'sister', pose)
    showPose(this.npc, 'mendu', pose)
    const entered = await Promise.all([
      this.tweenTo(this.player, seat.pose[0], 390, 'entry'),
      this.tweenTo(this.npc, seat.pose[1], 390, 'entry'),
    ])
    if (!this.machine.valid(token)) return
    if (entered.includes(false)) { await this.exitPose(); return this.fail(token, '互动被中断，已经回到安全位置。') }
    this.machine.finish(token, state)
    if (state === 'SLEEPING') {
      showPose(this.player, 'sister', 'sleep')
      showPose(this.npc, 'mendu', 'sleep')
    }
    this.notice(state === 'SITTING' ? '一起坐一会儿。移动即可起身。' : '晚安，移动即可起床。')
  }

  private updateFollowing() {
    if (this.scene.time.now < this.followDue) return
    this.followDue = this.scene.time.now + (this.machine.intent === 'hand' ? 360 : 470)
    const goal = formationTarget(this.world, this.player, this.npc, this.facing.sister, this.machine.intent === 'hand')
    if (!goal) {
      if (++this.followFailures >= 4) this.lostFollow()
      return
    }
    if (apart(this.npc, goal) < (this.machine.intent === 'hand' ? 8 : 13)) {
      this.route.cancel('mendu')
      this.followGoal = undefined
      if (this.machine.intent === 'hand') showPose(this.npc, 'mendu', 'hand')
      return
    }
    this.followFailures = 0
    if (this.route.busy('mendu') && this.followGoal && apart(goal, this.followGoal) < 12) return
    this.followGoal = goal
    void this.route.navigate(this.npc, 'mendu', goal).then(success => {
      if (!success && this.machine.intent !== 'free' && this.scene.time.now >= this.followDue) this.followFailures++
    })
  }

  private lostFollow() {
    this.cancelWork()
    this.machine.cancel()
    this.autonomyDue = this.scene.time.now + 5000
    this.notice('门都暂时找不到路，先在原地等你。')
    this.publish()
  }

  private updateAutonomy() {
    if (this.machine.intent !== 'free' || this.machine.state === 'TRANSITIONING') return
    if (this.scene.time.now < this.autonomyDue) return
    if (this.machine.state !== 'IDLE') {
      this.machine.autonomous('IDLE')
      this.motion('mendu', this.facing.mendu, false)
      this.autonomyDue = this.scene.time.now + 3500
      this.publish()
      return
    }
    const anchors = activityAnchors[this.location]
    const nightRest = this.environment.phase === 'night' && this.location === 'home' && this.anchorCursor % 2 === 0
    const anchor = nightRest ? anchors[0] : anchors[this.anchorCursor % anchors.length]
    this.anchorCursor++
    if (anchor.id === this.lastAnchor || !findPath(this.world, this.npc, anchor.position)) {
      this.autonomyDue = this.scene.time.now + 2200
      return
    }
    this.lastAnchor = anchor.id
    this.machine.autonomous('WANDER')
    this.autonomyDue = this.scene.time.now + 30000
    this.publish()
    void this.route.navigate(this.npc, 'mendu', anchor.position).then(success => {
      if (this.machine.intent !== 'free' || this.machine.state !== 'WANDER') return
      if (!success) {
        this.machine.autonomous('IDLE')
        this.autonomyDue = this.scene.time.now + 5500
      } else {
        this.machine.autonomous(anchor.activity)
        if (anchor.activity === 'SITTING' || anchor.activity === 'RESTING') showPose(this.npc, 'mendu', 'sit')
        this.autonomyDue = this.scene.time.now + anchor.dwellMs
      }
      this.publish()
    })
  }

  update(delta: number) {
    this.route.update(delta)
    if (this.machine.intent === 'follow' || this.machine.intent === 'hand') this.updateFollowing()
    else this.updateAutonomy()
    this.name.setPosition(this.npc.x, this.npc.y - 27)
    this.bubble.update()
  }

  beginSceneChange() {
    this.cancelWork()
    this.machine.beginSceneChange()
    this.bubble.hide()
    this.publish()
  }

  onMapChanged(world: WorldMap, location: MapKind, environment: Environment) {
    this.world = world
    this.location = location
    this.environment = environment
    this.poseSpot = undefined
    this.exitPromise = undefined
    this.npc.setPosition(location === 'home' ? 18.5 * 16 : 25.5 * 16, location === 'home' ? 20.5 * 16 : 17.5 * 16)
    this.machine.sceneChanged()
    this.autonomyDue = this.scene.time.now + 6000
    this.followDue = this.scene.time.now + 500
    this.followGoal = undefined
    this.motion('mendu', 'down', false)
    this.publish()
  }

  refreshWorld(world: WorldMap, environment: Environment) {
    this.world = world
    this.environment = environment
  }

  private faceEachOther() {
    const direction: Direction = this.player.x < this.npc.x ? 'right' : 'left'
    this.motion('sister', direction, false)
    this.motion('mendu', direction === 'right' ? 'left' : 'right', false)
  }

  private motion(role: Role, direction: Direction, moving: boolean) {
    const sprite = role === 'sister' ? this.player : this.npc
    if (moving) this.facing[role] = direction
    if (moving) showWalk(sprite, role, direction)
    else showIdle(sprite, role, this.facing[role])
  }

  private async exitPose() {
    if (!this.poseSpot) return
    if (this.exitPromise) return this.exitPromise
    const seat = this.poseSpot
    showPose(this.player, 'sister', seat.kind === 'sleep' ? 'wake' : 'stand')
    showPose(this.npc, 'mendu', seat.kind === 'sleep' ? 'wake' : 'stand')
    this.exitPromise = Promise.all([
      this.tweenTo(this.player, seat.approach[0], 320, 'exit'),
      this.tweenTo(this.npc, seat.approach[1], 320, 'exit'),
    ]).then(() => {
      this.player.setPosition(seat.approach[0].x, seat.approach[0].y)
      this.npc.setPosition(seat.approach[1].x, seat.approach[1].y)
      this.poseSpot = undefined
      this.exitPromise = undefined
      this.motion('sister', this.facing.sister, false)
      this.motion('mendu', this.facing.mendu, false)
    })
    return this.exitPromise
  }

  private tweenTo(sprite: Phaser.GameObjects.Sprite, target: Point, duration: number, category: 'entry' | 'exit'): Promise<boolean> {
    return new Promise(resolve => {
      const collection = category === 'entry' ? this.entryTweens : this.exitTweens
      const tween = this.scene.tweens.add({
        targets: sprite, x: target.x, y: target.y, duration, ease: 'Sine.easeInOut',
        onComplete: () => { collection.delete(tween); resolve(true) },
        onStop: () => { collection.delete(tween); resolve(false) },
      })
      collection.add(tween)
    })
  }

  private wait(ms: number): Promise<boolean> {
    return new Promise(resolve => {
      const waiter = { event: undefined as unknown as Phaser.Time.TimerEvent, done: resolve }
      waiter.event = this.scene.time.delayedCall(ms, () => { this.waits.delete(waiter); resolve(true) })
      this.waits.add(waiter)
    })
  }

  private cancelWork() {
    this.route.cancel()
    for (const tween of [...this.entryTweens]) tween.stop()
    for (const waiter of this.waits) { waiter.event.remove(false); waiter.done(false) }
    this.waits.clear()
    this.bubble.hide()
  }

  private fail(token: number, message: string) {
    if (!this.machine.fail(token)) return
    this.autonomyDue = this.scene.time.now + 6000
    this.notice(message)
    this.publish()
  }

  private notice(message: string) {
    this.noticeEvent?.remove(false)
    this.onMessage(message)
    this.noticeEvent = this.scene.time.delayedCall(3200, () => this.onMessage(''))
  }

  private publish() { this.onStatus(this.status) }

  dispose() {
    this.cancelWork()
    for (const tween of this.exitTweens) tween.stop()
    this.noticeEvent?.remove(false)
    this.bubble.hide()
    this.npc.removeAllListeners()
    this.npc.destroy()
    this.name.destroy()
  }
}
