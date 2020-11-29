import Image = Phaser.GameObjects.Image;
import Text = Phaser.GameObjects.Text;
import { colorOffset, UiColor } from '../../models';

export class BaseProgressBar extends Phaser.GameObjects.Container {
  width;
  height;
  edgeWidth;

  edgeValue: number;
  leftEdgeValue: number;
  rightEdgeValue: number;
  middleValue: number;

  edges: Image[] = [];
  filler: Image[] = [];
  text: Text;

  edgeOffset = 623;
  fillerOffset = 493;
  origins = [1, 0, 0];
  color: UiColor;
  progress: number = 1;
  showText: boolean;

  autoColor = true;
  colorMap = {
    'red' : 0.175,
    'yellow': 0.4,
    'green': 1,
  };

  constructor(scene, x, y, width, height, color: UiColor = 'green', edgeOffset, fillerOffset, origins, showText = false) {
    super(scene, x, y);

    this.width = width;
    this.height = height;
    this.color = color;
    this.edgeOffset = edgeOffset;
    this.fillerOffset = fillerOffset;
    this.origins = origins;
    this.showText = showText;
    this.edgeWidth = this.height;

    let image: Image;
    image = new Image(scene, 0, 0, 'ui', this.edgeOffset);
    image.setOrigin(this.origins[0], 0);
    this.edges.push(image);
    image = new Image(scene, 0, 0, 'ui', this.edgeOffset + 1);
    image.setOrigin(this.origins[1], 0);
    this.edges.push(image);
    image = new Image(scene, 0, 0, 'ui', this.edgeOffset + 2);
    image.setOrigin(this.origins[2], 0);
    this.edges.push(image);

    image = new Image(scene, 0, 0, 'ui', this.fillerOffset + colorOffset[this.color]);
    image.setOrigin(this.origins[0], 0);
    this.filler.push(image);
    image = new Image(scene, 0, 0, 'ui', this.fillerOffset + colorOffset[this.color] + 1);
    image.setOrigin(this.origins[1], 0);
    this.filler.push(image);
    image = new Image(scene, 0, 0, 'ui', this.fillerOffset + colorOffset[this.color] + 2);
    image.setOrigin(this.origins[2], 0);
    this.filler.push(image);

    this.add(this.edges);
    this.add(this.filler);

    if (this.showText) {
      const style = {fontSize: Math.floor(2 * height / 5) + 'px', fontFamily: '"Press Start 2P"', color: 'black'};
      this.text = new Text(scene, 0, Math.ceil(this.height / 2), '100%', style).setOrigin(0.5);
      this.add(this.text);
    }

    this.setWidth(width);
  }

  setColor(color) {
    if (this.color == color) {
      return;
    }
    this.color = color;
    let i;
    for (i = 0; i < 3; i++) {
      this.filler[i].setFrame(this.fillerOffset + colorOffset[color] + i);
    }
  }

  checkColor() {
    for (const color in this.colorMap) {
      if (this.progress <= this.colorMap[color]) {
        this.setColor(color);
        break;
      }
    }
  }

  setProgress(progress: number) {
    this.progress = progress;
    if (this.autoColor) {
      this.checkColor();
    }
    if (this.showText) {
      this.text.setText(Math.floor(this.progress * 100) + '%');
    }
  }

  changeProgress(delta) {
    this.setProgress(Math.min(Math.max(this.progress + delta, 0), 1));
  }

  setWidth(width: number) {

  }
}
