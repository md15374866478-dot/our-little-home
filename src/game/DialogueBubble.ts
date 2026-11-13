import Phaser from 'phaser'

export class DialogueBubble {
  private visible = false
  private menuOpen = false
  private background?: Phaser.GameObjects.Graphics
  private text?: Phaser.GameObjects.Text
  private timer?: Phaser.Time.TimerEvent

  constructor(private scene: Phaser.Scene, private speaker: Phaser.GameObjects.Sprite) {}

  show(line: string) {
    this.hide()
    const chunks = Array.from(line)
    const wrapped = Array.from({ length: Math.ceil(chunks.length / 12) }, (_, index) => chunks.slice(index * 12, index * 12 + 12).join('')).join('\n')
    this.text = this.scene.add.text(0, 0, wrapped, {
      fontFamily: 'monospace', fontSize: '10px', color: '#314336', lineSpacing: 4, padding: { x: 7, y: 5 },
    }).setDepth(51)
    this.background = this.scene.add.graphics().setDepth(50)
    this.background.fillStyle(0xf8edcf).fillRoundedRect(0, 0, this.text.width + 8, this.text.height + 8, 4)
    this.background.lineStyle(2, 0x866947).strokeRoundedRect(0, 0, this.text.width + 8, this.text.height + 8, 4)
    this.timer = this.scene.time.delayedCall(3900, () => this.hide())
    this.visible = true
    this.update()
    this.setMenuOpen(this.menuOpen)
  }

  setMenuOpen(open: boolean) {
    this.menuOpen = open
    this.background?.setVisible(!open)
    this.text?.setVisible(!open)
  }

  update() {
    if (!this.visible || !this.background || !this.text) return
    const view = this.scene.cameras.main.worldView
    const width = this.text.width + 8, height = this.text.height + 8
    const x = Phaser.Math.Clamp(this.speaker.x - width / 2, view.left + 4, view.right - width - 4)
    const y = this.speaker.y - height - 56 < view.top + 4 ? this.speaker.y + 5 : this.speaker.y - height - 56
    this.background.setPosition(x, y)
    this.text.setPosition(x + 4, y + 4)
  }

  hide() {
    this.timer?.remove(false)
    this.background?.destroy()
    this.text?.destroy()
    this.timer = undefined
    this.background = undefined
    this.text = undefined
    this.visible = false
  }
}
