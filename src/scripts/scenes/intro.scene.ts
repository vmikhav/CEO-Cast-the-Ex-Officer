import BaseLevelScene from './baseLevel.scene';
import WorkerSprite from '../sprites/worker.sprite';
import { soundsController, symbolsController, usageController } from '../controllers';
import { Button, TextPanel } from '../components';
import { gameConfig } from '../config';

export default class IntroScene extends BaseLevelScene {

  worker: WorkerSprite;
  workers: WorkerSprite[] = [];
  symbolsToIgnore = ['S', 'vortex', 'pigtail', 'o', 'heart', 'lighting'];
  symbolSounds = ['bookFlip2', 'bookFlip3'];

  panel: TextPanel;

  constructor() {
    super({ key: 'IntroScene' })
  }

  create() {
    this.fadeIn(500);
    this.getWorldView();
    this.initTouchInput();
    this.ignoreInput = true;

    let completeCallback = () => {};
    let failCallback = () => {};

    this.worker = new WorkerSprite(this, this.view.centerX-16, this.view.centerY, 0, () => completeCallback(), () => failCallback());
    this.workers.push(this.worker);

    this.panel = new TextPanel(this, this.view.centerX, this.view.bottom - 160, 600, 300, 'flat', 'white', true, {}, 32, {x: 20, y: 20});
    this.add.existing(this.panel);
    const btn = new Button(this, 0, 0, 285, 80, gameConfig.lang.takeALook, 'flat_wide', 'white', {fontSize: '22px'}, () => {
      this.panel.show(gameConfig.lang.intro2, []);
      this.worker.setSymbols(['|'], null);
      this.ignoreInput = false;
      completeCallback = () => {
        this.panel.show(gameConfig.lang.intro3, []);
        this.worker.setSymbols(['-', '|'], null);
        completeCallback = () => {
          this.panel.show(gameConfig.lang.intro4, []);
          this.worker.setSymbols(['|', '^'], 10000);
          failCallback = () => {
            this.worker.setSymbols(['|', '^'], 10000);
          }
          completeCallback = () => {
            usageController.log('done_tutorial');
            this.ignoreInput = true;
            btn.setText(gameConfig.lang.yay)
            btn.callback = () => this.startGame();
            this.panel.show(gameConfig.lang.intro5, [btn]);
          }
        }
      }
    });
    const btn2 = new Button(this, 0, 0, 285, 80, gameConfig.lang.skip, 'flat_wide', 'white', {fontSize: '22px'}, () => {
      this.startGame();
    });
    this.panel.show(gameConfig.lang.intro1, [btn, btn2]);
  }

  update(time, delta) {
    super.update(time, delta);
    this.children.each(i => i.update(time, delta));
  }

  applySymbols(symbols) {
    const result = symbolsController.applySymbols(this.workers, symbols);
    if (result.score) {
      soundsController.actionSound(this.symbolSounds[Phaser.Math.Between(0, this.symbolSounds.length - 1)]);
    }
  }

  startGame() {
    this.fadeOutScene('GameScene', 750);
  }
}
