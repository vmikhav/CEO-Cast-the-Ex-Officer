import Image = Phaser.GameObjects.Image;
import BaseScene from '../../scenes/base.scene';
import { buttonType, colorOffset, UiColor, uiTileSize } from '../../models';
import Rectangle = Phaser.Geom.Rectangle;
import { soundsController } from '../../controllers';

export default class BaseButton extends Phaser.GameObjects.Container {
  scene: BaseScene;

  type: string;
  color: UiColor|null;
  buttonHeight: number;
  buttonWidth: number;
  frameOffset: number;
  framePressedOffset: number;
  frames: Image[] = [];

  isShowed: boolean;

  callback;
  callbackInterval;
  callbackTimeout;

  constructor(scene: BaseScene, x: number, y: number, width: number, height: number, type: string, color: UiColor|null = null, callback = () => {}, repeatingFire = false) {
    super(scene, x, y);

    this.callback = callback;
    this.type = type;
    this.color = color;
    this.buttonHeight = height;
    this.buttonWidth = width;

    this.frameOffset = buttonType[type].normal;
    this.framePressedOffset = buttonType[type].pressed;
    if (buttonType[type].colored && color) {
      this.frameOffset += colorOffset[color] * 2;
      this.framePressedOffset += colorOffset[color] * 2;
    }

    const halfHeight = Math.ceil(height / 2);
    const halfWidth = Math.ceil(width / 2);
    let edgeWidth = height;
    const top = -halfHeight;
    const left = -halfWidth;
    const bottom = height - halfHeight;
    const right = width - halfWidth;

    this.setInteractive({
      useHandCursor: true,
      hitArea: new Rectangle(left, top, width, height),
      hitAreaCallback: (shape, x, y, gameObject) => {
        return x >= left && y >= top && x <= right && y <= bottom;
      }
    });

    let image: Image;
    image = new Image(scene, left, top, 'ui', this.frameOffset);
    image.setOrigin(0, 0);
    image.setDisplaySize(edgeWidth, height);
    this.frames.push(image);
    image = new Image(scene, right, top, 'ui', this.frameOffset + 2);
    image.setOrigin(1, 0);
    image.setDisplaySize(edgeWidth, height);
    this.frames.push(image);

    if (width <= edgeWidth * 2) {
      edgeWidth = uiTileSize * (width / (height * 2))
      this.frames[0].setCrop(0, 0, edgeWidth, uiTileSize);
      this.frames[1].setCrop(uiTileSize - edgeWidth, 0, edgeWidth, uiTileSize);
    } else {
      const bodyWidth = width - edgeWidth;
      let currentPos;
      for (currentPos = edgeWidth; currentPos < bodyWidth; currentPos += edgeWidth) {
        image = new Image(scene, left + currentPos, top, 'ui', this.frameOffset + 1);
        image.setOrigin(0, 0);
        image.setDisplaySize(edgeWidth, height);
        if (currentPos + edgeWidth > bodyWidth) {
          image.setCrop(0, 0,  uiTileSize * ((bodyWidth - currentPos) / edgeWidth), uiTileSize);
        }
        this.frames.push(image);
      }
    }
    this.add(this.frames);

    if (repeatingFire) {
      const restore = () => {
        this.enterButtonNormalState();
        clearTimeout(this.callbackTimeout);
        clearInterval(this.callbackInterval);
      };
      this
        .on('pointerdown', () => {
          this.enterButtonActiveState();
          this.clickCallback();
          clearTimeout(this.callbackTimeout);
          clearInterval(this.callbackInterval);
          this.callbackTimeout = setTimeout(() => {
            this.callbackInterval = setInterval(() => this.clickCallback(), 175);
          }, 150);
        })
        .on('pointerout', restore)
        .on('pointerup', restore);
    } else {
      this
        .on('pointerdown', () => this.enterButtonActiveState())
        .on('pointerout', () => this.enterButtonNormalState())
        .on('pointerup', () => {
          this.enterButtonNormalState();
          this.clickCallback();
        });
    }

  }

  enterButtonNormalState() {
    this.setFrames(this.frameOffset);
    this.scene.isButtonPressed = false;
  }

  enterButtonActiveState() {
    this.setFrames(this.framePressedOffset);
    this.scene.isButtonPressed = true;
  }

  protected setFrames(offset) {
    let i;
    this.frames[0].setFrame(offset);
    this.frames[1].setFrame(offset + 2);
    for (i = 2; i < this.frames.length; i++) {
      this.frames[i].setFrame(offset + 1);
    }
  }

  clickCallback() {
    soundsController.actionSound('click');
    this.callback();
  }

  show(duration = 1000) {
    this.isShowed = true;
    this.scene.tweens.add({
      targets: this,
      alpha: {from: 0, to: 1},
      ease: 'Sine.easeOut',
      duration: duration,
    });
  }

  hide(duration = 1000) {
    if (!this.isShowed) {return;}
    this.scene.tweens.add({
      targets: this,
      alpha: {from: 1, to: 0},
      ease: 'Sine.easeOut',
      duration: duration,
      onComplete: () => {
        this.isShowed = false;
      }
    });
  }
}
