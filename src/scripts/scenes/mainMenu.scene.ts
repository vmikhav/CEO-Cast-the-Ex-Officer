import BaseScene from './base.scene';
import { Button } from '../components';
import { gameConfig, gameStat } from '../config';
import Image = Phaser.GameObjects.Image;
import { configController, usageController } from '../controllers';

export default class MainMenuScene extends BaseScene {

  playButton: Button;
  resetButton: Button;
  banner: Image;

  canStartGame = true;
  canPlayVideo = false;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    this.fadeIn(200);
    this.getWorldView();

    const video = document.createElement('video');
    this.canPlayVideo = video.canPlayType('video/webm; codecs="vp8, vorbis"') === 'probably';

    this.banner = this.add.image(0, 0, 'banner_ceo');
    this.fixedElements.push(this.banner);

    const buttons: Button[] = [];
    this.playButton = new Button(this, 0, 0, 400, 112, gameConfig.lang.play, 'outline', 'blue', {}, () => {
      this.startGame()
    });
    this.playButton.setAlpha(0);
    this.fixedContainers.push(this.playButton);
    this.add.existing(this.playButton);
    buttons.push(this.playButton);
    if (gameStat.tutorialFinished) {
      this.playButton.setText(gameConfig.lang.continue);

      this.resetButton = new Button(this, 0, 0, 400, 112, gameConfig.lang.newGame, 'outline', 'blue', {}, () => {
        this.resetGame();
      });
      this.resetButton.setAlpha(0);
      this.fixedContainers.push(this.resetButton);
      this.add.existing(this.resetButton);
      buttons.push(this.resetButton);
    }
    this.onResize();

    this.cameras.main.fadeIn(500);
    this.time.addEvent({
      delay: 750,
      callback: () => {
        this.tweens.add({
          targets: buttons,
          alpha: 1,
          duration: 500,
        });
      }
    });
    usageController.log('start');
  }

  onResize() {
    super.onResize();
    this.banner.setPosition(this.view.centerX, this.view.centerY);
    this.playButton.setPosition(this.view.centerX, this.view.centerY + 260);
    if (this.resetButton) {
      this.resetButton.setPosition(this.view.centerX, this.view.centerY + 400);
    }
  }


  update() {

  }

  resetGame() {
    if (!this.canStartGame) {
      return;
    }
    configController.resetGameStat();
    this.startGame();
  }

  startGame() {
    if (!this.canStartGame) {
      return;
    }
    this.canStartGame = false;
    if (gameStat.tutorialFinished) {
      this.fadeOutScene('GameScene', 750);
    } else if (this.canPlayVideo) {
      this.cameras.main.fadeOut(500);
      this.time.addEvent({
        delay: 500,
        callback: () => {
          this.playButton.setVisible(false);
          if (this.resetButton) {
            this.resetButton.setVisible(false);
          }
          const video = this.add.video(this.view.centerX, this.view.centerY, 'boss');
          this.cameras.main.fadeIn(500);
          this.time.addEvent({
            delay: 500,
            callback: () => {
              video.play();
            }
          });
        }
      });
      this.time.addEvent({
        delay: 7500,
        callback: () => {
          this.fadeOutScene('IntroScene', 750);
        }
      });
    } else {
      this.fadeOutScene('IntroScene', 750);
    }
  }
}
