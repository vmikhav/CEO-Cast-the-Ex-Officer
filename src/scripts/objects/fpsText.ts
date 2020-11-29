export default class FpsText extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, color = 'black') {
    super(scene, 10, 10, '', { color, fontFamily: '"Press Start 2P"', fontSize: '28px' })
    scene.add.existing(this)
    this.setOrigin(0)
  }

  public update() {
    this.setText(`fps: ${Math.round(this.scene.game.loop.actualFps)}`)
  }
}
