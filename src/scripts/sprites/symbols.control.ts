import { SymbolsControlInterface } from '../models';
import SymbolSprite from './symbol.sprite';
import { BaseProgressBar, RoundedProgressBar, SquaredProgressBar } from '../components/progressBar';
import Phaser from "phaser";
import { symbolsController } from '../controllers';
import BaseScene from '../scenes/base.scene';
import Tween = Phaser.Tweens.Tween;

interface ProgressbarSettings {
  offset: number;
  width: number;
  height: number;
  type: string;
}

export default class SymbolsControl extends Phaser.GameObjects.Container implements SymbolsControlInterface {
  scene: BaseScene;
  symbols: SymbolSprite[] = [];
  progressBar: BaseProgressBar;
  progressDelta = 0;
  symbolMargin = 2;
  symbolScale = 1.5;
  active = false;

  completeCallback;
  timeoutCallback;

  hideTween: Tween;

  get progress() {
    return this.progressBar.progress || null;
  }

  constructor(scene, x, y, settings: ProgressbarSettings|null = null, completeCallback = () => {}, timeoutCallback = number => {}) {
    super(scene, x, y);

    this.scene = scene;
    this.completeCallback = completeCallback;
    this.timeoutCallback = timeoutCallback;
    if (settings) {
      this.progressBar = settings.type === 'rounded' ?
        new RoundedProgressBar(scene, 0, settings.offset, settings.width, settings.height) :
        new SquaredProgressBar(scene, 0, settings.offset, settings.width, settings.height)
      ;
      this.add(this.progressBar);
    }

    this.setAlpha(0);
    this.hideTween = this.scene.tweens.add({
      targets: this,
      alpha: {from: 1, to: 0},
      ease: 'Sine.easeOut',
      duration: 250,
    });
    this.hideTween.stop(0);
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.progressBar && this.active && this.progressDelta !== 0) {
      this.progressBar.changeProgress(-this.progressDelta);
      if (this.progressBar.progress <= 0) {
        this.active = false;
        this.progressBar.setColor('red');
        this.progressBar.autoColor = false;
        this.progressBar.setProgress(1);
        this.scene.time.addEvent({
          delay: 500,
          callback: () => {
            this.progressBar.autoColor = true;
            this.hide();
            this.timeoutCallback(this.symbols.length);
          }
        })
      }
    }
  }

  setSymbols(symbols: string[], timespan: number|null = null) {
    this.hideTween.stop(0);
    let i, width = 0;
    this.remove(this.symbols);
    symbolsController.releaseSymbol(this.symbols);
    this.symbols = [];
    for (i = 0; i < symbols.length; i++) {
      this.symbols.push(symbolsController.getSymbol(this, symbols[i]));
      width += this.symbols[i].width * this.symbolScale + this.symbolMargin;
    }
    let x =  -Math.ceil((width - this.symbolMargin) / 2);
    this.add(this.symbols);
    for (i = 0; i < symbols.length; i++) {
      this.symbols[i].setPosition(x, -15);
      x += this.symbols[i].width * this.symbolScale  + this.symbolMargin;
      this.symbols[i].setAlpha(0);
      this.symbols[i].setDisplaySize(this.symbols[i].width * this.symbolScale, this.symbols[i].height * this.symbolScale);
      this.scene.tweens.add({
        targets: this.symbols[i],
        alpha: 1,
        ease: 'Sine.easeOut',
        duration: 750,
        delay: i * 250,
      });
    }
    this.scene.tweens.add({
      targets: this,
      alpha: {from: 0, to: 1},
      ease: 'Sine.easeOut',
      duration: 250,
    });

    if (timespan) {
      this.progressDelta = 16.5 / timespan;
      this.progressBar.setVisible(true);
    } else {
      this.progressDelta = 0;
      this.progressBar.setVisible(false);
    }
    this.active = true;
  }

  testRemoveSymbol(symbol: string, onlyFirst: boolean = true, onlyOne: boolean = true) {
    if (!this.active) {
      return 0;
    }
    let i, j = 0;
    for (i = 0; i < this.symbols.length; i++) {
      if (this.symbols[i].symbol === symbol) {
        j++;
        if (onlyOne) {
          break;
        }
      }
      if (onlyFirst) {
        break;
      }
    }
    return j;
  }

  removeSymbol(symbol: string, onlyFirst: boolean = true, onlyOne: boolean = true) {
    if (!this.active) {
      return 0;
    }
    let i;
    const removedSymbols: SymbolSprite[] = [];
    for (i = 0; i < this.symbols.length; i++) {
      if (this.symbols[i].symbol === symbol) {
        removedSymbols.push(this.symbols.splice(i, 1)[0] as SymbolSprite);
        i--;
        if (onlyOne) {
          break;
        }
      }
      if (onlyFirst) {
        break;
      }
    }
    if (removedSymbols.length) {
      this.scene.tweens.add({
        targets: removedSymbols,
        alpha: {from: 1, to: 0},
        ease: 'Sine.easeOut',
        duration: 100,
        onComplete: () => {
          this.remove(removedSymbols);
          symbolsController.releaseSymbol(removedSymbols);
          let i, width = 0;
          for (i = 0; i < this.symbols.length; i++) {
            width += this.symbols[i].width * this.symbolScale + this.symbolMargin;
          }
          let x = -Math.ceil((width - this.symbolMargin) / 2);
          for (i = 0; i < this.symbols.length; i++) {
            this.scene.tweens.add({
              targets: this.symbols[i],
              x,
              ease: 'Sine.easeOut',
              duration: 100,
            });
            x += this.symbols[i].width * this.symbolScale + this.symbolMargin;
          }
        }
      });
      if (!this.symbols.length) {
        this.active = false;
        this.progressBar.setColor('green');
        this.progressBar.autoColor = false;
        this.progressBar.setProgress(1);
        this.scene.time.addEvent({
          delay: 500,
          callback: () => {
            this.progressBar.autoColor = true;
            this.hide();
            this.completeCallback();
          }
        })
      }
    }
    return removedSymbols.length;
  }

  addTimeBonus(timespan) {
    this.progressBar.changeProgress(this.progressDelta * timespan / 16.6);
  }

  hide() {
    this.hideTween.restart();
  }
}
