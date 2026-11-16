import { renderDensity } from './renderScale'
import Phaser from 'phaser'
import { HomeScene } from './HomeScene'
import type { CompanionStatus } from './CompanionController'
import type { MapKind } from './maps'

export function createGame(
  parent: HTMLElement,
  onLocation: (location: MapKind) => void,
  onReady: (scene: HomeScene) => void,
  onStatus: (status: CompanionStatus) => void,
  onMessage: (message: string) => void,
  onOpenMenu: () => void,
) {
  const legacy = new URLSearchParams(location.search).get('render') === 'legacy'
  const density = legacy ? 1 : renderDensity(window.devicePixelRatio)
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#25372e',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: { mode: Phaser.Scale.NONE, width: Math.round(parent.clientWidth * density), height: Math.round(parent.clientHeight * density), zoom: 1 / density, autoRound: false },
    render: { pixelArt: true, antialias: false },
    scene: [new HomeScene(onLocation, onReady, onStatus, onMessage, onOpenMenu)],
  })
  const resize = () => {
    const density = legacy ? 1 : renderDensity(window.devicePixelRatio)
    game.scale.setZoom(1 / density)
    game.scale.resize(Math.round(parent.clientWidth * density), Math.round(parent.clientHeight * density))
    game.canvas.style.imageRendering = 'pixelated'
  }
  const observer = new ResizeObserver(resize)
  game.events.once(Phaser.Core.Events.READY, () => { resize(); observer.observe(parent) })
  game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect())
  return game
}
