import Text = Phaser.GameObjects.Text;
import BaseButton from './baseButton';
import { UiColor } from '../../models';
import TextStyle = Phaser.Types.GameObjects.Text.TextStyle;
import { textColorSelector } from '../../controllers';

export class Button extends BaseButton {
  text: Text;
  activeOffset;

  constructor(scene, x, y, width, height, text, type, color: UiColor|null = null, textStyle: TextStyle = {}, callback = () => {}, repeatingFire = false) {
    super(scene, x, y, width, height, type, color, callback, repeatingFire);

    const fontSize = Math.floor(this.buttonHeight / 3) + 'px';
    const textColor = textColorSelector(type, color);
    const style = {fontSize, fontFamily: '"Press Start 2P"', color: textColor, ...textStyle};
    this.text = new Text(scene, 0, 0, text, style).setOrigin(0.5);

    this.activeOffset = Math.floor(height / 8);
    this.add(this.text);
    this.isShowed = true;
  }

  enterButtonNormalState() {
    super.enterButtonNormalState();
    this.text.setY(0);
  }

  enterButtonActiveState() {
    super.enterButtonActiveState();
    this.text.setY(this.activeOffset);
  }

  setText(text) {
    this.text.setText(text);
  }
}
