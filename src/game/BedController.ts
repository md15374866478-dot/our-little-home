import type Phaser from 'phaser'
import { ActionScope } from './ActionScope'
import { BedState, type BedPerson } from './bedState'
import { BedQuilt, preloadQuilt } from './BedQuilt'
import { showIdle } from './characterAnimations'
import type { Point } from './pathfinding'
import frame from '../assets/bed/frame.png'
import mattress from '../assets/bed/mattress.png'
import pillowLeft from '../assets/bed/pillow-left.png'
import pillowRight from '../assets/bed/pillow-right.png'
import footboard from '../assets/bed/footboard.png'
import mashuo from '../assets/bed/mashuo-bed.png'
import mendu from '../assets/bed/mendu-bed.png'

const files = { frame, mattress, pillowLeft, pillowRight, footboard }
const people = ['mashuo', 'mendu'] as const

export function preloadBed(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(files)) scene.load.image(`bed-${key}`, url)
  scene.load.spritesheet('bed-mashuo', mashuo, { frameWidth: 40, frameHeight: 60 })
  scene.load.spritesheet('bed-mendu', mendu, { frameWidth: 40, frameHeight: 60 })
  preloadQuilt(scene)
}

export const bedPositions = {
  mashuo: { edge: { x: 24, y: 120 }, seat: { x: 38, y: 115 }, inside: { x: 72, y: 108 } },
  mendu: { edge: { x: 168, y: 120 }, seat: { x: 154, y: 115 }, inside: { x: 120, y: 108 } },
}

// Frame-local palm coordinates, measured against the exported key poses.
const palms = {
  mashuo: { reach: { x: 13, y: -13 }, pull: { x: 12, y: -25 } },
  mendu: { reach: { x: -14, y: -15 }, pull: { x: -10, y: -25 } },
}

export class BedController {
  readonly state = new BedState()
  readonly quilt: BedQuilt
  private readonly layers: Phaser.GameObjects.Image[] = []
  private readonly scopes: Record<BedPerson, ActionScope>
  private readonly grips: Record<BedPerson, Phaser.GameObjects.Sprite>
  private readonly heads: Record<BedPerson, Phaser.GameObjects.Sprite>
  private readonly folds = { mashuo: 0, mendu: 0 }
  private readonly operations: Partial<Record<BedPerson, Promise<boolean>>> = {}
  private readonly awakeTextures: Partial<Record<BedPerson, string>> = {}
  private headLayers = false

  constructor(scene: Phaser.Scene, private actors: Record<BedPerson, Phaser.GameObjects.Sprite>,
    private navigate: (person: BedPerson, point: Point) => Promise<boolean>,
    private cancelRoute: (person: BedPerson) => void, private changed: () => void) {
    for (const [key, depth] of [['frame', 2], ['mattress', 3], ['pillowLeft', 4], ['pillowRight', 4], ['footboard', 12.2]] as const) {
      this.layers.push(scene.add.image(32, 34, `bed-${key}`).setOrigin(0).setDepth(depth))
    }
    this.quilt = new BedQuilt(scene)
    this.scopes = { mashuo: new ActionScope(scene), mendu: new ActionScope(scene) }
    const overlay = (person: BedPerson, depth: number) =>
      scene.add.sprite(0, 0, `bed-${person}`).setOrigin(.5, 1).setDepth(depth).setVisible(false)
    this.grips = { mashuo: overlay('mashuo', 12.12), mendu: overlay('mendu', 12.12) }
    this.heads = { mashuo: overlay('mashuo', 12.10), mendu: overlay('mendu', 12.10) }
  }

  setHeadLayerEnabled(enabled: boolean) {
    this.headLayers = enabled
    for (const person of people) {
      if (this.state.phase(person) === 'asleep') this.pose(person, 7)
    }
  }

  setMattressOffset(offset: number) { this.layers[1].setY(34 + offset) }
  active(person: BedPerson) { return this.state.phase(person) !== 'awake' }
  get occupied() { return people.some(person => this.active(person)) }

  setVisible(visible: boolean) {
    this.layers.forEach(layer => layer.setVisible(visible))
    this.quilt.setVisible(visible)
  }

  private pose(person: BedPerson, frame: number) {
    const actor = this.actors[person]
    actor.anims.stop()
    actor.setTexture(`bed-${person}`, frame).setFlipX(false)
    const split = this.headLayers && frame === 7
    if (split) actor.setCrop(0, 28, 40, 32)
    else actor.setCrop()
    this.heads[person].setFrame(frame).setPosition(actor.x, actor.y).setCrop(0, 0, 40, 28).setVisible(split)
  }

  private async step(person: BedPerson, token: number, frame: number, target: Point, duration: number) {
    this.pose(person, frame)
    return this.scopes[person].tween(token, {
      targets: this.actors[person], ...target, duration, ease: 'Sine.easeInOut',
    })
  }

  private async fold(person: BedPerson, target: number, token: number, grip?: 'corner' | 'lap') {
    const actor = this.actors[person]
    const progress = { amount: this.folds[person] }
    const update = () => {
      const amount = progress.amount
      this.folds[person] = amount
      this.quilt.side(person, amount)
      if (grip === 'lap') {
        const contact = this.quilt.grip(person, amount, true)
        const handX = person === 'mashuo' ? -1 : 1
        const handY = person === 'mashuo' ? -33 : -29
        // Only the hand crosses above the quilt while the torso stays on its pillow.
        this.grips[person].setFrame(6).setPosition(contact.x - handX, contact.y - handY)
          .setCrop(16 + handX, 57 + handY, 8, 7).setVisible(amount > .05 && amount < .96)
        return
      }
      if (grip !== 'corner') return
      const pulling = amount > .38
      const frame = pulling ? 3 : 2
      const hand = pulling ? palms[person].pull : palms[person].reach
      const corner = this.quilt.grip(person, amount)
      this.pose(person, frame)
      actor.setPosition(corner.x - hand.x, corner.y - hand.y)
      this.grips[person].setFrame(frame).setPosition(actor.x, actor.y)
        .setCrop(17 + hand.x, 57 + hand.y, 7, 7).setVisible(true)
    }
    update()
    const ok = await this.scopes[person].tween(token, {
      targets: progress, amount: target, duration: 570, ease: 'Sine.easeInOut', onUpdate: update,
    })
    if (ok) this.grips[person].setVisible(false)
    return ok
  }

  sleep(person: BedPerson): Promise<boolean> {
    if (this.active(person)) return this.operations[person] ?? Promise.resolve(true)
    const task = this.enter(person)
    this.operations[person] = task
    return task
  }

  private async enter(person: BedPerson) {
    const revision = this.state.begin(person)!
    const scope = this.scopes[person]
    const token = scope.begin()
    const { edge, seat, inside } = bedPositions[person]
    const actor = this.actors[person]
    this.changed()
    if (!await this.navigate(person, edge)) {
      if (this.state.valid(person, revision)) { this.state.cancel(person); this.changed() }
      return false
    }
    if (!scope.valid(token)) return false
    this.awakeTextures[person] = actor.texture.key
    this.state.advance(person, revision, 'uncovering')
    this.changed()
    if (!await this.step(person, token, 0, { x: (edge.x + seat.x) / 2, y: 119 }, 210)) return false
    if (!await this.step(person, token, 1, seat, 210)) return false
    const contact = this.quilt.grip(person, 0)
    const hand = palms[person].reach
    if (!await this.step(person, token, 2, { x: contact.x - hand.x, y: contact.y - hand.y }, 240)) return false
    if (!await this.fold(person, 1, token, 'corner')) return false
    this.state.advance(person, revision, 'entering')
    this.changed()
    if (!await this.step(person, token, 4, { x: (seat.x + inside.x) / 2, y: 124 }, 230)) return false
    if (!await this.step(person, token, 5, { x: inside.x, y: 115 }, 240)) return false
    if (!await this.step(person, token, 6, inside, 290)) return false
    this.state.advance(person, revision, 'covering')
    this.changed()
    if (!await this.fold(person, 0, token, 'lap')) return false
    this.pose(person, 7)
    this.state.advance(person, revision, 'asleep')
    this.changed()
    return true
  }

  wake(person: BedPerson): Promise<boolean> {
    if (!this.active(person)) return Promise.resolve(true)
    const phase = this.state.phase(person)
    if (phase === 'waking' || phase === 'leaving') return this.operations[person] ?? Promise.resolve(false)
    const task = this.exit(person)
    this.operations[person] = task
    return task
  }

  private async exit(person: BedPerson) {
    const token = this.scopes[person].begin()
    this.cancelRoute(person)
    const { revision, phase } = this.state.cancel(person)
    this.grips[person].setVisible(false)
    this.changed()
    if (phase === 'awake') return true
    const { edge, seat } = bedPositions[person]
    this.pose(person, phase === 'waking' ? 6 : 4)
    if (!await this.fold(person, 1, token, phase === 'waking' ? 'lap' : undefined)) return false
    if (!await this.step(person, token, 5, { x: this.actors[person].x, y: 115 }, 250)) return false
    if (!await this.step(person, token, 4, { x: (seat.x + bedPositions[person].inside.x) / 2, y: 124 }, 230)) return false
    if (phase === 'waking') this.state.advance(person, revision, 'leaving')
    if (!await this.step(person, token, 1, seat, 230)) return false
    if (!await this.step(person, token, 0, edge, 270)) return false
    this.actors[person].setTexture(this.awakeTextures[person] ?? person, 1)
    showIdle(this.actors[person], person, 'down')
    if (!await this.fold(person, 0, token)) return false
    this.state.advance(person, revision, 'awake')
    this.changed()
    return true
  }

  dispose() {
    for (const person of people) {
      this.scopes[person].dispose()
      this.grips[person].destroy()
      this.heads[person].destroy()
    }
    this.quilt.dispose()
    this.layers.forEach(layer => layer.destroy())
  }
}
