import Image = Phaser.GameObjects.Image;
import { colorOffset, panelType, UiColor, uiTileSize } from '../../models';

export class Panel extends Phaser.GameObjects.Container {
  top: number;
  bottom: number;
  left: number;
  right: number;

  frames: Image[] = [];

  constructor(scene, x, y, width, height, type = 'paper_inset', color: UiColor|null = null, shadowed = false, edgeWidth: number = 0) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.top = Math.ceil(-this.height / 2);
    this.bottom = Math.ceil(this.height / 2);
    this.left = Math.ceil(-this.width / 2);
    this.right = Math.ceil(this.width / 2);

    if (!edgeWidth) {
      edgeWidth = Math.floor(Math.min(width, height) / 3);
    }

    const edgeHeight = edgeWidth;

    const offset = panelType[type].colored && color ? (colorOffset[color] * (panelType[type].colorOffset || 2)) : 0;
    let offsets: number[] = panelType[type][shadowed ? 'shadowed' : 'normal'];
    if (panelType[type].colored === 'header') {
      offsets[0] += offset;
    } else {
      offsets = offsets.map(o => o + offset);
    }

    let image: Image, image2: Image;
    image = new Image(scene, this.left, this.top, 'ui', offsets[0]);
    image.setOrigin(0, 0);
    image.setDisplaySize(edgeWidth, edgeHeight);
    this.frames.push(image);
    image = new Image(scene, this.right, this.top, 'ui', offsets[0] + 2);
    image.setOrigin(1, 0);
    image.setDisplaySize(edgeWidth, edgeHeight);
    this.frames.push(image);
    image = new Image(scene, this.left, this.bottom, 'ui', offsets[2]);
    image.setOrigin(0, 1);
    image.setDisplaySize(edgeWidth, edgeHeight);
    this.frames.push(image);
    image = new Image(scene, this.right, this.bottom, 'ui', offsets[2] + 2);
    image.setOrigin(1, 1);
    image.setDisplaySize(edgeWidth, edgeHeight);
    this.frames.push(image);
    const bodyWidth = this.width - edgeWidth;
    const bodyHeight = this.height - edgeHeight;

    image = new Image(scene, this.left + edgeWidth, this.top + edgeHeight, 'ui', offsets[1] + 1);
    image.setOrigin(0, 0);
    image.setDisplaySize(bodyWidth - edgeWidth, bodyHeight - edgeHeight);
    this.frames.push(image);

    let currentPos;
    for (currentPos = edgeWidth; currentPos < bodyWidth; currentPos += edgeWidth) {
      image = new Image(scene, this.left + currentPos, this.top, 'ui', offsets[0] + 1);
      image.setOrigin(0, 0);
      image.setDisplaySize(edgeWidth, edgeHeight);
      image2 = new Image(scene, this.left + currentPos, this.bottom, 'ui', offsets[2] + 1);
      image2.setOrigin(0, 1);
      image2.setDisplaySize(edgeWidth, edgeHeight);
      if (currentPos + edgeWidth > bodyWidth) {
        image.setCrop(0, 0,  uiTileSize * ((bodyWidth - currentPos) / edgeWidth), uiTileSize);
        image2.setCrop(0, 0,  uiTileSize * ((bodyWidth - currentPos) / edgeWidth), uiTileSize);
      }
      this.frames.push(image, image2);
    }
    for (currentPos = edgeHeight; currentPos < bodyHeight; currentPos += edgeHeight) {
      image = new Image(scene, this.left, this.top + currentPos, 'ui', offsets[1]);
      image.setOrigin(0, 0);
      image.setDisplaySize(edgeWidth, edgeHeight);
      image2 = new Image(scene, this.right, this.top + currentPos, 'ui', offsets[1] + 2);
      image2.setOrigin(1, 0);
      image2.setDisplaySize(edgeWidth, edgeHeight);
      if (currentPos + edgeHeight > bodyHeight) {
        image.setCrop(0, 0, uiTileSize,  uiTileSize * ((bodyHeight - currentPos) / edgeHeight));
        image2.setCrop(0, 0, uiTileSize,  uiTileSize * ((bodyHeight - currentPos) / edgeHeight));
      }
      this.frames.push(image, image2);
    }

    this.add(this.frames);
  }
}
