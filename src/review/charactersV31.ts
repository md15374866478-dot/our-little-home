import Phaser from 'phaser'
import homeArt from '../assets/maps/home-detailed.png'
import mashuoOld from '../assets/characters/mashuo.png'
import menduOld from '../assets/characters/mendu.png'
import { v31CharacterCandidates } from '../game/characterCandidates'
import './charactersV31.css'

type Direction = 'down' | 'left' | 'right' | 'up'
const directions: Direction[] = ['down', 'left', 'right', 'up']
const actors = [
  { key: 'mashuo-old', url: mashuoOld, x: 177, frame: { width: 32, height: 48 }, label: '旧' },
  { key: 'mashuo-v31', url: v31CharacterCandidates.mashuo.url, x: 225, frame: { width: v31CharacterCandidates.mashuo.frameWidth, height: v31CharacterCandidates.mashuo.frameHeight }, label: '新' },
  { key: 'mendu-old', url: menduOld, x: 303, frame: { width: 32, height: 48 }, label: '旧' },
  { key: 'mendu-v31', url: v31CharacterCandidates.mendu.url, x: 351, frame: { width: v31CharacterCandidates.mendu.frameWidth, height: v31CharacterCandidates.mendu.frameHeight }, label: '新' },
] as const

let previewScene: CharacterReviewScene | undefined

class CharacterReviewScene extends Phaser.Scene {
  private sprites: Array<{ key: string; sprite: Phaser.GameObjects.Sprite }> = []
  private direction: Direction = 'down'
  private moving = true

  constructor() { super('character-review') }

  preload() {
    this.load.image('review-home', homeArt)
    for (const actor of actors)
      this.load.spritesheet(actor.key, actor.url, { frameWidth: actor.frame.width, frameHeight: actor.frame.height })
  }

  create() {
    this.add.image(0, 0, 'review-home').setOrigin(0)
    for (const actor of actors) {
      const sprite = this.add.sprite(actor.x, 177, actor.key, 1).setOrigin(0.5, 1).setDepth(10.177)
      this.sprites.push({ key: actor.key, sprite })
      this.add.text(actor.x, 101, actor.label, {
        fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color: '#fff3dc',
        backgroundColor: actor.label === '旧' ? '#634b45' : '#425e47',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(20)
      directions.forEach((direction, index) => this.anims.create({
        key: `review-${actor.key}-${direction}`,
        frames: [0, 1, 2, 3].map(offset => ({ key: actor.key, frame: index * 4 + offset })),
        frameRate: 7, repeat: -1,
      }))
    }
    this.cameras.main.setRoundPixels(true)
    this.layout()
    this.scale.on('resize', this.layout, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this)
      previewScene = undefined
    })
    previewScene = this
    this.setPreview(this.direction, this.moving)
  }

  private layout() {
    const camera = this.cameras.main
    camera.setZoom(this.scale.width >= 650 ? 3 : 2)
    camera.setBounds(0, 0, 480, 384)
    camera.centerOn(240, 172)
  }

  setPreview(direction: Direction, moving: boolean) {
    this.direction = direction
    this.moving = moving
    const row = directions.indexOf(direction)
    for (const { key, sprite } of this.sprites) {
      if (moving) sprite.play(`review-${key}-${direction}`, true)
      else { sprite.anims.stop(); sprite.setFrame(row * 4 + 1) }
    }
  }
}

for (const role of ['mashuo', 'mendu'] as const) {
  const url = v31CharacterCandidates[role].url
  document.querySelector<HTMLImageElement>(`#${role}-atlas`)!.src = url
  document.querySelector<HTMLAnchorElement>(`#${role}-link`)!.href = url
}
const host = document.querySelector<HTMLDivElement>('#review-stage')!
const game = new Phaser.Game({
  type: Phaser.AUTO, parent: host, backgroundColor: '#25372e', pixelArt: true, antialias: false,
  roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: host.clientWidth, height: host.clientHeight },
  render: { pixelArt: true, antialias: false }, scene: [CharacterReviewScene],
})
const resize = new ResizeObserver(() => game.scale.resize(host.clientWidth, host.clientHeight))
resize.observe(host)
window.addEventListener('beforeunload', () => { resize.disconnect(); game.destroy(true) }, { once: true })

let currentDirection: Direction = 'down'
let moving = true
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-direction]')) {
  button.addEventListener('click', () => {
    currentDirection = button.dataset.direction as Direction
    for (const item of document.querySelectorAll<HTMLButtonElement>('[data-direction]'))
      item.setAttribute('aria-pressed', String(item === button))
    previewScene?.setPreview(currentDirection, moving)
  })
}
const toggle = document.querySelector<HTMLButtonElement>('#motion-toggle')!
toggle.addEventListener('click', () => {
  moving = !moving
  toggle.setAttribute('aria-pressed', String(moving))
  toggle.textContent = moving ? '行走中 · 点击暂停' : '站立中 · 点击播放'
  previewScene?.setPreview(currentDirection, moving)
})
