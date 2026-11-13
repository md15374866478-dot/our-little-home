import Phaser from 'phaser'
import { getEnvironment, type Environment } from './environment'
import { createMap, type MapKind, type WorldMap, TILE } from './maps'
import { canStand, doorwayAt } from './collision'
import { touchInput, type Direction } from './input'
import { registerCharacters } from './characterAnimations'
import { CompanionController, type CompanionStatus } from './CompanionController'
import type { InteractionAction } from './behavior'

export class HomeScene extends Phaser.Scene {
  private kind: MapKind = 'yard'
  private world!: WorldMap
  private mapGraphics?: Phaser.GameObjects.Graphics
  private player!: Phaser.GameObjects.Sprite
  private companion?: CompanionController
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>
  private transitioning = false
  private transitionAt = -1000
  private facing: Direction = 'down'
  private environment!: Environment
  private atmosphere?: Phaser.GameObjects.Graphics
  private rain?: Phaser.GameObjects.Graphics

  constructor(
    private onLocation: (location: MapKind) => void,
    private onReady: (scene: HomeScene) => void,
    private onStatus: (status: CompanionStatus) => void,
    private onMessage: (message: string) => void,
    private onOpenMenu: () => void,
  ) { super('home-world') }

  create() {
    this.environment = getEnvironment()
    registerCharacters(this)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.keys
    this.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT'])
    this.buildMap('yard')
    this.player = this.add.sprite(22.5 * TILE, 30.5 * TILE, 'sister', 1).setOrigin(0.5, 1).setDepth(10)
    this.companion = new CompanionController(this, this.player, this.world, this.kind, this.environment, this.onStatus, this.onMessage, this.onOpenMenu)
    this.cameras.main.setRoundPixels(true)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.scale.on('resize', this.configureCamera, this)
    this.configureCamera()
    this.time.addEvent({ delay: 60_000, loop: true, callback: () => {
      if (this.transitioning) return
      const next = getEnvironment()
      if (next.dateKey !== this.environment.dateKey || next.phase !== this.environment.phase) {
        this.environment = next
        this.buildMap(this.kind)
        this.companion?.refreshWorld(this.world, next)
      }
    } })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.configureCamera, this)
      this.companion?.dispose()
      touchInput.clear()
    })
    this.onReady(this)
  }

  requestInteraction(action: InteractionAction) { return this.companion?.request(action) }
  setInteractionMenuOpen(open: boolean) { this.companion?.setMenuOpen(open) }

  private buildMap(kind: MapKind) {
    this.mapGraphics?.destroy()
    this.atmosphere?.destroy()
    this.rain?.destroy()
    this.kind = kind
    const built = createMap(this, kind, this.environment)
    this.mapGraphics = built.graphics
    this.world = built.map
    const width = this.world.width * TILE, height = this.world.height * TILE
    this.atmosphere = this.add.graphics().setDepth(15)
    if (kind === 'yard') {
      const darkness = this.environment.phase === 'night' ? 0.29 : this.environment.phase === 'dusk' ? 0.12 : 0
      if (darkness) this.atmosphere.fillStyle(0x1d3142, darkness).fillRect(0, 0, width, height)
      if (this.environment.weather === 'rainy') this.rain = this.add.graphics().setDepth(16)
    } else if (this.environment.phase === 'night') {
      this.atmosphere.fillStyle(0x342d45, 0.12).fillRect(0, 0, width, height)
    }
    this.cameras.main.setBounds(0, 0, width, height)
    this.configureCamera()
    this.onLocation(kind)
  }

  private configureCamera() {
    if (!this.world) return
    const width = this.scale.width, height = this.scale.height
    const zoom = Math.max(2, width / (this.world.width * TILE), height / (this.world.height * TILE))
    this.cameras.main.setZoom(zoom)
    this.cameras.main.setBounds(0, 0, this.world.width * TILE, this.world.height * TILE)
  }

  private changeMap() {
    if (this.transitioning || this.time.now - this.transitionAt < 1000) return
    this.transitioning = true
    this.player.anims.stop()
    this.companion?.beginSceneChange()
    this.cameras.main.fadeOut(400, 23, 30, 27)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const destination: MapKind = this.kind === 'yard' ? 'home' : 'yard'
      this.buildMap(destination)
      this.player.setPosition(destination === 'home' ? 15 * TILE : 22.5 * TILE,
        destination === 'home' ? 20 * TILE : 17 * TILE)
      this.facing = destination === 'home' ? 'up' : 'down'
      this.companion?.onMapChanged(this.world, destination, this.environment)
      this.companion?.setPlayerFacing(this.facing, false)
      this.cameras.main.centerOn(this.player.x, this.player.y)
      this.cameras.main.fadeIn(400, 23, 30, 27)
      this.cameras.main.once('camerafadeincomplete', () => {
        this.transitioning = false
        this.transitionAt = this.time.now
      })
    })
  }

  update(_time: number, delta: number) {
    if (!this.player || this.transitioning) return
    const down = (direction: Direction) => touchInput.isDown(direction) || (
      direction === 'up' ? this.cursors.up.isDown || this.keys.W.isDown :
      direction === 'down' ? this.cursors.down.isDown || this.keys.S.isDown :
      direction === 'left' ? this.cursors.left.isDown || this.keys.A.isDown :
      this.cursors.right.isDown || this.keys.D.isDown
    )
    let dx = Number(down('right')) - Number(down('left'))
    let dy = Number(down('down')) - Number(down('up'))
    const requestedMove = Boolean(dx || dy)
    if (requestedMove) this.companion?.playerMovementRequested()
    const canMove = !this.companion?.isPlayerLocked()
    if (requestedMove && canMove) {
      if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2 }
      const distance = Math.min(delta, 50) * 0.105
      const nextX = this.player.x + dx * distance
      if (canStand(this.world, nextX, this.player.y) && this.companion?.canPlayerOccupy(nextX, this.player.y)) this.player.x = nextX
      const nextY = this.player.y + dy * distance
      if (canStand(this.world, this.player.x, nextY) && this.companion?.canPlayerOccupy(this.player.x, nextY)) this.player.y = nextY
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
      this.companion?.setPlayerFacing(this.facing, true)
    } else if (canMove) this.companion?.setPlayerFacing(this.facing, false)
    this.companion?.update(delta)
    if (this.rain) {
      this.rain.clear().lineStyle(1, 0xdde9da, 0.55)
      for (let i = 0; i < 80; i++) {
        const x = ((i * 137 + this.time.now * 0.08) % (44 * TILE))
        const y = ((i * 79 + this.time.now * 0.18) % (34 * TILE))
        this.rain.lineBetween(x, y, x - 2, y + 5)
      }
    }
    if (canMove && doorwayAt(this.kind, this.player.x, this.player.y)) this.changeMap()
  }
}
