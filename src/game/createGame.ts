import Phaser from 'phaser'
import { HomeScene } from './HomeScene'
import type { MapKind } from './maps'

export function createGame(parent: HTMLElement, onLocation: (location: MapKind) => void) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#25372e',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth, height: parent.clientHeight },
    render: { pixelArt: true, antialias: false },
    scene: [new HomeScene(onLocation)],
  })
}
