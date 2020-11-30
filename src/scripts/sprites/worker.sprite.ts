import Phaser from 'phaser'
import BaseLevelScene from '../scenes/baseLevel.scene';
import Sprite = Phaser.GameObjects.Sprite;
import SymbolsControl from './symbols.control';

export default class WorkerSprite extends Phaser.GameObjects.Container {
  scene: BaseLevelScene;
  type;
  baseFrame;

  sprite: Sprite;
  symbolsControl: SymbolsControl;
  halfWidth = 16;

  skipFrame = 0;

  get progress() {
    return this.symbolsControl.progressBar.progress || null;
  }

  set completeCallback(callback) {
    if (this.symbolsControl) {
      this.symbolsControl.completeCallback = callback;
    }
  }

  set timeoutCallback(callback) {
    if (this.symbolsControl) {
      this.symbolsControl.timeoutCallback = callback;
    }
  }


  constructor(scene, x, y, type = -1, completeCallback = () => {}, timeoutCallback = () => {}) {
    super(scene, x, y);

    this.scene  = scene;
    if (type === -1) {
      type = Phaser.Math.Between(0, 7);
    }
    this.type = type;
    this.baseFrame = type * 5;
    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, 'workers', this.baseFrame);
    this.sprite.setOrigin(0, 0.5);

    this.add(this.sprite);

    this.symbolsControl = new SymbolsControl(scene, this.halfWidth, -80, {type: 'squared', height: 16, width: 40, offset: 30}, completeCallback, timeoutCallback);
    this.add(this.symbolsControl);

    scene.add.existing(this);

    scene.time.addEvent({
      delay: 150,
      callback: () => {
        if (this.skipFrame) {
          this.skipFrame--;
          return;
        }
        if (Math.random() < 0.4) {
          return;
        }
        this.sprite.setFrame(this.baseFrame + Phaser.Math.Between(0, 3));
      },
      loop: true,
    });
  }

  update(time, delta) {
    super.update(time, delta);
    this.sprite.update(time, delta);
    this.symbolsControl.update(time, delta);
  }

  lookUp() {
    this.sprite.setFrame(this.baseFrame + 4);
    this.skipFrame = 3;
  }

  setSymbols(symbols: string[], timespan: number|null) {
    this.symbolsControl.setSymbols(symbols, timespan);
  }

  testRemoveSymbol(symbol: string, onlyFirst: boolean = true, onlyOne: boolean = true) {
    return this.symbolsControl.testRemoveSymbol(symbol, onlyFirst, onlyOne);
  }

  removeSymbol(symbol: string, onlyFirst: boolean = true, onlyOne: boolean = true) {
    const result = this.symbolsControl.removeSymbol(symbol, onlyFirst, onlyOne);
    if (result) {
      this.lookUp();
    }
    return result;
  }

  addTimeBonus(timespan) {
    this.symbolsControl.addTimeBonus(timespan);
  }

  clearSymbols() {
    this.symbolsControl.clearSymbols();
  }

}
