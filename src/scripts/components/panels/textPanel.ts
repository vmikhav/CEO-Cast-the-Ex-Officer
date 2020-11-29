import BaseButton from '../buttons/baseButton';
import Text = Phaser.GameObjects.Text;
import { UiColor } from '../../models';
import TextStyle = Phaser.Types.GameObjects.Text.TextStyle;
import { textColorSelector } from '../../controllers';
import { Panel } from './panel';

export class TextPanel extends Phaser.GameObjects.Container {
  top: number;
  bottom: number;
  left: number;
  right: number;

  panel: Panel;
  text: Text;
  buttons: BaseButton[] = [];

  isShowed = false;

  /*
  portrait: Sprite;
  portraitTween;
  portraitTweenTimer;
  */

  constructor(scene, x, y, width, height, type = 'paper_inset', color: UiColor|null = null, shadowed = false, style: TextStyle = {}, edgeWidth: number = 0, textOffset = {x: 50, y: 50}) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.top = Math.ceil(-this.height / 2);
    this.bottom = Math.ceil(this.height / 2);
    this.left = Math.ceil(-this.width / 2);
    this.right = Math.ceil(this.width / 2);

    this.panel = new Panel(scene, 0, 0, width, height, type, color, shadowed, edgeWidth);
    this.add(this.panel);


    /*
    this.portrait = new Sprite(scene, this.left + 10,this.top + 10, 'portraits', 0)
      .setOrigin(0, 1)
      .setDisplaySize(128, 128);
    this.panel = new Image(scene, this.left, this.top, 'ui', 'frame' + '.png')
      .setOrigin(0, 0)
      .setDisplaySize(this.width, this.height);

    this.portraitTween = scene.tweens.add({
      targets: this.portrait,
      y: this.top + 6,
      duration: 350,
      ease: 'linear',
      yoyo: true,
      delay: 500
    }).pause();

    this.portraitTweenTimer = scene.time.addEvent({
      delay: 5000,
      callback: () => {
        this.portraitTween.restart();
      },
      loop: true
    });
    this.add(this.portrait);
    */

    const textColor = textColorSelector(type, color);
    const textStyle: TextStyle = {
      fontSize: '24px', fontFamily: '"Press Start 2P"', color: textColor,
      wordWrap: {width: this.width - textOffset.x * 2, useAdvancedWrap: true},
      ...style,
    };
    this.text = new Phaser.GameObjects.Text(scene, this.left + textOffset.x, this.top + textOffset.y, '', textStyle);
    this.text.lineSpacing = 15;


    this.add(this.text);
    this.setVisible(false);
    this.isShowed = false;
    this.setAlpha(0);
  }

  show(text, buttons: BaseButton[]|null = null) {
    let i, pos = this.right;
    if (buttons) {
      this.removeButtons();
      this.buttons = buttons;
      for (i = 0; i < this.buttons.length; i++) {
        this.buttons[i].x = pos - (this.buttons[i].buttonWidth / 2);
        this.buttons[i].y = this.top - (this.buttons[i].buttonHeight / 2) - 5;
        pos -= this.buttons[i].buttonWidth + 30;
      }
      this.add(buttons);
    }
    for (i = 0; i < this.buttons.length; i++) {
      this.buttons[i].setAlpha(0);
    }

    if (!this.isShowed) {
      this.scene.tweens.add({
        targets: this,
        alpha: {from: 0, to: 1},
        ease: 'Sine.easeOut',
        duration: 1000,
      });
    }
    /*
    if (frame === null) {
      this.portrait.setVisible(false);
    } else {
      this.portrait.setVisible(true);
      this.portrait.setFrame(frame);
    }
    */
    this.text.setText(text);
    if (this.buttons.length) {
      this.scene.tweens.add({
        targets: this.buttons,
        alpha: 1,
        duration: 500,
        ease: 'Sine.easeOut',
        delay: this.isShowed ? 500 : 1000,
        onComplete: () => {
          for (i = 0; i < this.buttons.length; i++) {
            this.buttons[i].setScrollFactor(0, 0, true);
          }
        }
      });
    }
    this.isShowed = true;
    this.setVisible(true);
  }

  hide(duration = 1000) {
    if (this.isShowed) {
      this.scene.tweens.add({
        targets: this,
        alpha: {from: 1, to: 0},
        ease: 'Sine.easeOut',
        duration: duration,
        onComplete: () => {
          this.setVisible(false);

          this.isShowed = false;
        }
      });
    }
  }

  removeButtons() {
    let i;
    for (i = 0; i < this.buttons.length; i++) {
      this.remove(this.buttons[i]);
    }
    this.buttons = [];
  }
}
