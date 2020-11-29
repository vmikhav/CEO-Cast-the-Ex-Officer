import Image = Phaser.GameObjects.Image;
import BaseButton from './baseButton';
import { UiColor } from '../../models';

export class ImageButton extends BaseButton {
  image: Image;
  activeOffset;

  constructor(scene, x, y, width, height, type, color: UiColor|null = null, image, callback = () => {}, repeatingFire = false) {
    super(scene, x, y, width, height, type, color, callback, repeatingFire);

    this.image = new Image(scene, 0, 0, image).setDisplaySize(width - 30, height - 30);

    this.activeOffset = Math.ceil(height / 8);
    this.add(this.image);
    this.isShowed = true;
  }

  setImage(image, frame = undefined) {
    this.image.setTexture(image, frame);
  }

  clickCallback() {
    this.callback();
  }

  enterButtonNormalState() {
    super.enterButtonNormalState();
    this.image.setY(0);
  }

  enterButtonActiveState() {
    super.enterButtonActiveState();
    this.image.setY(this.activeOffset);
  }
}
