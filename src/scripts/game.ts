import 'phaser';
import BaseScene from './scenes/base.scene';
import BootScene from './scenes/boot.scene';
import PreloadScene from './scenes/preload.scene';
import MainMenuScene from './scenes/mainMenu.scene';
import IntroScene from './scenes/intro.scene';
import GameScene from './scenes/game.scene';

import { phaserConfig, gameConfig } from './config';
import lang from './lang';
import { configController, soundsController } from './controllers';

const config = Object.assign(phaserConfig, {
  scene: [BootScene, PreloadScene, MainMenuScene, IntroScene, GameScene]
});

class Game extends Phaser.Game {
  constructor () {
    super(config);

    const userLang = (navigator.language).split('-')[0];
    if (userLang in lang) {
      // TODO multiple languages support
      // gameConfig.lang = lang[userLang];
    }

    configController.loadConfig();

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scene = (this.scene.getScenes(true)[0] as BaseScene) || null;
      if (h <= 20) {
        soundsController.mute(true);
        scene?.scene.pause();
        return;
      } else {
        soundsController.unmute(true);
        scene?.scene.resume();
      }

      const scaleMode = 'FIT';
      const DEFAULT_WIDTH = gameConfig.width;
      const DEFAULT_HEIGHT = gameConfig.height;
      const MAX_WIDTH = gameConfig.maxWidth;
      const MAX_HEIGHT = gameConfig.maxHeight;

      let scale = Math.min(w / DEFAULT_WIDTH, h / DEFAULT_HEIGHT);
      let newWidth = Math.min(w / scale, MAX_WIDTH);
      let newHeight = Math.min(h / scale, MAX_HEIGHT);

      let smooth = 1;
      /*
      let defaultRatio = DEFAULT_WIDTH / DEFAULT_HEIGHT;
      let maxRatioWidth = MAX_WIDTH / DEFAULT_HEIGHT;
      let maxRatioHeight = DEFAULT_WIDTH / MAX_HEIGHT;

      // smooth scaling
      if (scaleMode === 'SMOOTH') {
        const maxSmoothScale = 1.15;
        const normalize = (value, min, max) => {
          return (value - min) / (max - min);
        };
        if (DEFAULT_WIDTH / DEFAULT_HEIGHT < w / h) {
          smooth =
            -normalize(newWidth / newHeight, defaultRatio, maxRatioWidth) / (1 / (maxSmoothScale - 1)) + maxSmoothScale;
        } else {
          smooth =
            -normalize(newWidth / newHeight, defaultRatio, maxRatioHeight) / (1 / (maxSmoothScale - 1)) + maxSmoothScale;
        }
      }
      */

      // resize the game
      this.scale.resize(Math.floor(newWidth * smooth), Math.floor(newHeight * smooth));

      // scale the width and height of the css
      this.canvas.style.width = Math.floor(newWidth * scale) + 'px';
      this.canvas.style.height = Math.floor(newHeight * scale) + 'px';

      // center the game with css margin
      this.canvas.style.marginTop = `${Math.floor((h - newHeight * scale) / 2)}px`;
      this.canvas.style.marginLeft = `${Math.floor((w - newWidth * scale) / 2)}px`;

      if (h > 20) {
        if (scene) {
          scene.onResize();
        }
      }
    };
    window.addEventListener('resize', () => {
      resize();
    });
    document.addEventListener('visibilitychange', () => {
      if (this.scene.isVisible('GameScene')) {
        if (document.visibilityState === 'visible') {
          this.scene.resume('GameScene');
        } else {
          this.scene.pause('GameScene');
        }
      }
    });
    setTimeout(() => {
      resize();
    }, 10);
  }

  create () {
  }
}

window['game'] = new Game();
window.focus();
