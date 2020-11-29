import Phaser from "phaser";

interface WorldView {
  top: number;
  left: number;
  bottom: number;
  right: number;
  centerX: number;
  centerY: number;
}

export default class BaseScene extends Phaser.Scene {
  fpsText: Phaser.GameObjects.Text;
  fixedElements: Phaser.GameObjects.Components.ScrollFactor[] = [];
  fixedContainers: Phaser.GameObjects.Container[] = [];
  isButtonPressed = false;
  view: WorldView;

  constructor(config) {
    super(config);
  }

  getWorldView() {
    const camera = this.cameras.main;
    this.view = {top: 0, left: 0, bottom: camera.height, right: camera.width, centerX: camera.width / 2, centerY: camera.height / 2};
  }

  onResize() {
    this.getWorldView();
    let i;
    for (i = 0; i < this.fixedElements.length; i++) {
      if (this.fixedElements[i]) {this.fixedElements[i].setScrollFactor(0, 0);}
    }
    for (i = 0; i < this.fixedContainers.length; i++) {
      if (this.fixedContainers[i]) {this.fixedContainers[i].setScrollFactor(0, 0, true);}
    }
  }

  fadeIn(duration) {
    this.cameras.main.fadeIn(duration);
  }

  fadeOutIn(callback, duration = 250) {
    this.cameras.main.fadeOut(duration);
    this.time.addEvent({
      delay: duration,
      callback: () => {
        this.cameras.main.fadeIn(duration);
        callback();
      },
    });
  }

  fadeOutScene(sceneName, duration = 250) {
    this.cameras.main.fadeOut(duration);
    this.time.addEvent({
      delay: duration,
      callback: () => {
        this.scene.start(sceneName);
      },
    });
  };
}