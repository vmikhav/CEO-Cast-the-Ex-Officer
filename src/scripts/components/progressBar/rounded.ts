import { colorOffset, UiColor, uiTileSize } from '../../models';
import { BaseProgressBar } from './base';

export class RoundedProgressBar extends BaseProgressBar {
  realEdgeWidth;
  middleWidth;
  cut;

  left;
  right;

  constructor(scene, x, y, width, height, color: UiColor = 'green', showText = false) {
    super(scene, x, y, width, height, color, 756, 807, [0, 0, 1], showText);
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
    const cropX = [0, 0, uiTileSize - this.realEdgeWidth];
    let i;
    if (progress <= 0.00125) {}
    else if (progress <= this.leftEdgeValue) {
      sizes[0] = this.realEdgeWidth * (progress / this.leftEdgeValue);
    } else {
      sizes[0] = this.realEdgeWidth;
      if (progress < this.rightEdgeValue) {
        sizes[1] = uiTileSize * (progress - this.leftEdgeValue) / this.middleValue;
      } else {
        sizes[1] = uiTileSize;
        if (progress >= 0.99875) {
          sizes[2] = this.realEdgeWidth;
        } else {
          sizes[2] = this.realEdgeWidth * ((progress - this.rightEdgeValue) / this.leftEdgeValue);
        }
      }
    }
    for (i = 0; i < 3; i++) {
      this.filler[i].setCrop(cropX[i], 0, sizes[i], uiTileSize);
    }
  }

  setWidth(width: number) {
    this.width = width;
    this.cut = this.width < this.edgeWidth * 2;
    if (this.cut) {
      this.realEdgeWidth = uiTileSize * (this.width / (this.edgeWidth * 2));
      this.middleWidth = 0;
      this.edgeValue = 0.5;
    } else {
      this.realEdgeWidth = uiTileSize;
      this.middleWidth = this.width - this.edgeWidth * 2;
      this.edgeValue = (this.edgeWidth) / this.width;
    }
    this.leftEdgeValue = this.edgeValue
    this.rightEdgeValue = 1 - this.leftEdgeValue;
    this.middleValue = this.rightEdgeValue - this.leftEdgeValue;

    this.left = -Math.ceil(this.width / 2);
    this.right = this.left + this.width;

    this.edges[0].setPosition(this.left, 0);
    this.edges[0].setDisplaySize(this.edgeWidth, this.height);
    this.edges[0].setCrop(0, 0, this.realEdgeWidth, uiTileSize);

    this.edges[1].setPosition(this.left + this.edgeWidth, 0);
    this.edges[1].setDisplaySize(this.middleWidth, this.height);
    this.edges[1].setVisible(!this.cut);

    this.edges[2].setPosition(this.right, 0);
    this.edges[2].setDisplaySize(this.edgeWidth, this.height);
    this.edges[2].setCrop(uiTileSize - this.realEdgeWidth, 0, this.realEdgeWidth, uiTileSize);

    this.filler[0].setPosition(this.left, 0);
    this.filler[0].setDisplaySize(this.edgeWidth, this.height);
    this.filler[0].setCrop(0, 0, this.realEdgeWidth, uiTileSize);

    this.filler[1].setPosition(this.left + this.edgeWidth, 0);
    this.filler[1].setDisplaySize(this.middleWidth, this.height);
    this.filler[1].setVisible(!this.cut);

    this.filler[2].setPosition(this.right, 0);
    this.filler[2].setDisplaySize(this.edgeWidth, this.height);
    this.filler[2].setCrop(uiTileSize - this.realEdgeWidth, 0, this.realEdgeWidth, uiTileSize);

    this.setProgress(null);
  }
}
