import Phaser from 'phaser'
import { BedState, type BedPerson } from './bedState'
import { showIdle } from './characterAnimations'
import type { Point } from './pathfinding'
import frame from '../assets/bed/frame.png'
import mattress from '../assets/bed/mattress.png'
import pillowLeft from '../assets/bed/pillow-left.png'
import pillowRight from '../assets/bed/pillow-right.png'
import footboard from '../assets/bed/footboard.png'
import quiltMashuo from '../assets/bed/quilt-mashuo.png'
import quiltMendu from '../assets/bed/quilt-mendu.png'
import mashuo from '../assets/bed/mashuo-sleep.png'
import mendu from '../assets/bed/mendu-sleep.png'
const files = { frame, mattress, pillowLeft, pillowRight, footboard, quiltMashuo, quiltMendu }
export function preloadBed(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(files)) scene.load.image(`bed-${key}`, url)
  scene.load.spritesheet('bed-mashuo', mashuo, { frameWidth: 40, frameHeight: 60 })
  scene.load.spritesheet('bed-mendu', mendu, { frameWidth: 40, frameHeight: 60 })
}
const people: BedPerson[] = ['mashuo', 'mendu']
export const bedPositions = {
  mashuo: { edge: { x: 24, y: 120 }, inside: { x: 72, y: 108 } },
  mendu: { edge: { x: 168, y: 120 }, inside: { x: 120, y: 108 } },
}
export class BedController {
  readonly state = new BedState()
  private layers: Phaser.GameObjects.Image[] = []
  private quilts: Record<BedPerson, Phaser.GameObjects.Image>
  private folds = { mashuo: 0, mendu: 0 }
  private operations: Partial<Record<BedPerson, Promise<boolean>>> = {}
  private awakeTextures: Partial<Record<BedPerson, string>> = {}
  private live = true
  constructor(private scene: Phaser.Scene, private actors: Record<BedPerson, Phaser.GameObjects.Sprite>,
    private navigate: (person: BedPerson, point: Point) => Promise<boolean>,
    private cancelRoute: (person: BedPerson) => void, private changed: () => void) {
    for (const [key, depth] of [['frame', 2], ['mattress', 3], ['pillowLeft', 4], ['pillowRight', 4], ['footboard', 12.2]] as const)
      this.layers.push(scene.add.image(32, 34, `bed-${key}`).setOrigin(0).setDepth(depth))
    this.quilts = {
      mashuo: scene.add.image(45, 78, 'bed-quiltMashuo').setOrigin(0).setDepth(12),
      mendu: scene.add.image(96, 78, 'bed-quiltMendu').setOrigin(0).setDepth(12),
    }
    this.layers.push(...Object.values(this.quilts))
  }
  active(person: BedPerson) { return this.state.phase(person) !== 'awake' }
  get occupied() { return people.some(p => this.active(p)) }
  setVisible(visible: boolean) { this.layers.forEach(layer => layer.setVisible(visible)) }
  private async wait(ms: number) { await new Promise(resolve => this.scene.time.delayedCall(ms, resolve)); return this.live }
  private async fold(person: BedPerson, value: number, token: number) {
    const start = this.folds[person]
    for (let i = 1; i <= 16; i++) {
      if (!this.live || !this.state.valid(person, token)) return false
      this.folds[person] = start + (value - start) * i / 16
      this.drawQuilt(person)
      if (!await this.wait(25)) return false
    }
    return true
  }
  private drawQuilt(person: BedPerson) {
    const shift = Math.round(this.folds[person] * 38)
    this.quilts[person].setY(78 + shift).setCrop(0, 0, 51, 62 - shift)
  }
  private pose(person: BedPerson, frame: number) {
    this.actors[person].anims.stop()
    this.actors[person].setTexture(`bed-${person}`, frame).setFlipX(false)
  }
  private async move(person: BedPerson, target: Point, token: number, ms = 700) {
    const actor = this.actors[person], start = { x: actor.x, y: actor.y }
    for (let i = 1; i <= 28; i++) {
      if (!this.live || !this.state.valid(person, token)) return false
      const t = i / 28, ease = t * t * (3 - 2 * t)
      actor.setPosition(start.x + (target.x - start.x) * ease, start.y + (target.y - start.y) * ease)
      if (!await this.wait(ms / 28)) return false
    }
    return true
  }
  sleep(person: BedPerson): Promise<boolean> {
    if (this.active(person)) return this.operations[person] ?? Promise.resolve(true)
    const task = this.enter(person); this.operations[person] = task; return task
  }
  private async enter(person: BedPerson) {
    const token = this.state.begin(person)!
    this.changed()
    if (!await this.navigate(person, bedPositions[person].edge)) {
      if (this.state.valid(person, token)) { this.state.cancel(person); this.changed() }
      return false
    }
    if (!this.state.valid(person, token)) return false
    this.awakeTextures[person] = this.actors[person].texture.key
    showIdle(this.actors[person], person, person === 'mashuo' ? 'right' : 'left')
    this.state.advance(person, token, 'uncovering'); this.changed()
    if (!await this.fold(person, 1, token)) return false
    this.state.advance(person, token, 'entering'); this.changed()
    this.pose(person, 0)
    if (!await this.move(person, bedPositions[person].inside, token)) return false
    this.pose(person, 1); if (!await this.wait(450) || !this.state.valid(person, token)) return false
    this.pose(person, 2); if (!await this.wait(450) || !this.state.valid(person, token)) return false
    this.state.advance(person, token, 'covering'); this.changed()
    if (!await this.fold(person, 0, token)) return false
    this.state.advance(person, token, 'asleep'); this.changed(); return true
  }
  wake(person: BedPerson): Promise<boolean> {
    if (!this.active(person)) return Promise.resolve(true)
    const phase = this.state.phase(person)
    if (phase === 'waking' || phase === 'leaving') return this.operations[person] ?? Promise.resolve(false)
    const task = this.exit(person); this.operations[person] = task; return task
  }
  private async exit(person: BedPerson) {
    this.cancelRoute(person)
    const { revision: token, phase } = this.state.cancel(person); this.changed()
    if (phase === 'awake') return true
    if (!await this.fold(person, 1, token)) return false
    this.pose(person, 1); if (!await this.wait(450) || !this.state.valid(person, token)) return false
    this.pose(person, 0); if (!await this.wait(350) || !this.state.valid(person, token)) return false
    if (phase === 'waking') this.state.advance(person, token, 'leaving')
    if (!await this.move(person, bedPositions[person].edge, token)) return false
    this.actors[person].setTexture(this.awakeTextures[person] ?? person, 1)
    showIdle(this.actors[person], person, 'down')
    if (!await this.fold(person, 0, token)) return false
    this.state.advance(person, token, 'awake'); this.changed(); return true
  }
  update(time: number) {
    for (const person of people) if (this.state.phase(person) === 'asleep') {
      this.pose(person, Math.floor(time / 1200) % 2 + 2)
      this.quilts[person].setY(78 + Math.round(Math.sin(time / 1200) * 0.6))
    }
  }
  dispose() { this.live = false; this.layers.forEach(layer => layer.destroy()) }
}
