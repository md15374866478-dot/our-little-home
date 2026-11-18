import type Phaser from 'phaser'
import type { BedPerson } from './bedState'
import left from '../assets/bed/fold-mashuo.png'
import right from '../assets/bed/fold-mendu.png'
import center from '../assets/bed/fold-center.png'
import travel from '../assets/bed/fold-travel.png'

export const quiltFrame = (amount: number) => Math.round(Math.min(1, Math.max(0, amount)) * 15)

export function preloadQuilt(scene: Phaser.Scene) {
  scene.load.spritesheet('fold-mashuo', left, { frameWidth: 51, frameHeight: 62 })
  scene.load.spritesheet('fold-mendu', right, { frameWidth: 51, frameHeight: 62 })
  scene.load.spritesheet('fold-center', center, { frameWidth: 102, frameHeight: 74 })
  scene.load.spritesheet('fold-travel', travel, { frameWidth: 102, frameHeight: 74 })
}

/** The sides own their folds independently. During trio sleep the same surface
 * has a central fold, so there is no transparent overlay or doubled seam. */
export class BedQuilt {
  private readonly halves
  private readonly center
  private visible = true
  private centerActive = false

  constructor(scene: Phaser.Scene) {
    this.halves = {
      mashuo: scene.add.sprite(45, 78, 'fold-mashuo', 0).setOrigin(0).setDepth(12),
      mendu: scene.add.sprite(96, 78, 'fold-mendu', 0).setOrigin(0).setDepth(12),
    }
    this.center = scene.add.sprite(45, 66, 'fold-center', 0).setOrigin(0).setDepth(12).setVisible(false)
  }

  grip(person: BedPerson, amount: number, onLap = false) {
    if (onLap) return { x: person === 'mashuo' ? 71 : 121, y: 80 + Math.round(13 * amount) }
    const x = person === 'mashuo' ? 48 : 143
    // The grip pinches three pixels into the outer boundary of the turnover.
    return { x, y: 89 + Math.round(20 * amount) }
  }

  side(person: BedPerson, amount: number) {
    this.halves[person].setFrame(quiltFrame(amount))
  }

  liftCenter(amount: number | null) {
    this.centerActive = amount !== null
    if (amount !== null) this.center.setTexture('fold-center', quiltFrame(amount))
    this.setVisible(this.visible)
  }

  raiseAt(worldY: number) {
    const frame = Math.round((worldY - 84) / 2)
    this.centerActive = true
    this.center.setTexture('fold-travel', Math.max(0, Math.min(31, frame)))
    this.setVisible(this.visible)
  }

  get centerVisible() { return this.center.visible }

  setVisible(visible: boolean) {
    this.visible = visible
    this.halves.mashuo.setVisible(visible && !this.centerActive)
    this.halves.mendu.setVisible(visible && !this.centerActive)
    this.center.setVisible(visible && this.centerActive)
  }

  dispose() {
    this.halves.mashuo.destroy()
    this.halves.mendu.destroy()
    this.center.destroy()
  }
}
