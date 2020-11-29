import Image = Phaser.GameObjects.Image;
import { colorOffset, UiColor, uiTileSize } from '../../models';
import { BaseProgressBar } from './base';

export class SquaredProgressBar extends BaseProgressBar {

  constructor(scene, x, y, width, height, color: UiColor = 'green', showText = false) {
    super(scene, x, y, width, height, color, 623, 493, [1, 0, 0], showText);
  }

  setProgress(progress: number|null) {
    if (progress === this.progress) {
      return;
    }
    if (progress === null) {
      progress = this.progress;
    }
    super.setProgress(progress);
    const sizes = [0, 0, 0];
    let i;
    if (progress <= 0.00125) {}
    else if (progress <= this.leftEdgeValue) {
      sizes[0] = uiTileSize - 3 * (1 - (progress / this.leftEdgeValue));
    } else {
      sizes[0] = uiTileSize;
      if (progress < this.rightEdgeValue) {
        sizes[1] = uiTileSize * (progress - this.leftEdgeValue) / this.middleValue;
      } else {
        sizes[1] = uiTileSize;
        if (progress >= 0.99875) {
          sizes[2] = uiTileSize;
        } else {
          sizes[2] = uiTileSize * ((progress - this.rightEdgeValue) / this.leftEdgeValue);
        }
      }
    }
    for (i = 0; i < 3; i++) {
      this.filler[i].setCrop(0, 0, sizes[i], uiTileSize);
    }
  }

  setWidth(width: number) {
    this.width = width;
    const realEdgeWidth = 2 * (this.height / uiTileSize);
    this.edgeValue = realEdgeWidth / (this.width + (realEdgeWidth * 2));
    this.leftEdgeValue = this.edgeValue
    this.rightEdgeValue = 1 - this.leftEdgeValue;
    this.middleValue = this.rightEdgeValue - this.leftEdgeValue;
    const halfWidth = Math.ceil(this.width / 2);

    this.edges[0].setPosition(-halfWidth, 0);
    this.edges[0].setDisplaySize(this.edgeWidth, this.height);
    this.edges[1].setPosition(-halfWidth, 0);
    this.edges[1].setDisplaySize(this.width, this.height);
    this.edges[2].setPosition(halfWidth, 0);
    this.edges[2].setDisplaySize(this.edgeWidth, this.height);


    this.filler[0].setPosition(-halfWidth, 0);
    this.filler[0].setDisplaySize(this.edgeWidth, this.height);
    this.filler[1].setPosition(-halfWidth, 0);
    this.filler[1].setDisplaySize(this.width, this.height);
    this.filler[2].setPosition(halfWidth, 0);
    this.filler[2].setDisplaySize(this.edgeWidth, this.height);

    this.setProgress(null);
  }
}
