import Text = Phaser.GameObjects.Text;
import Image = Phaser.GameObjects.Image;
import Rectangle = Phaser.GameObjects.Rectangle;
import BaseLevelScene from './baseLevel.scene';
import { Button, ImageButton, Panel, RoundedProgressBar, TextPanel } from '../components';
import WorkerSprite from '../sprites/worker.sprite';
import { configController, soundsController, symbolsController, usageController } from '../controllers';
import { gameConfig, gameStat, soundConfig } from '../config';
import { purchaseMasks, purchases, stories, symbolList, workerPositions } from '../models';
import { monetizationController } from '../controllers/monetization.controller';

interface RectangleMask {
  id: string,
  obj: Rectangle,
}

export default class GameScene extends BaseLevelScene {

  purchaseMasks: RectangleMask[] = [];
  purchaseButtons: Button[] = [];
  workers: WorkerSprite[] = [];
  workersPull: WorkerSprite[] = [];
  completeCallback = () => this.checkWave(true);
  timeoutCallback = () => this.checkWave(false);
  waves: any[];
  waveSize: number;
  ignoreUpdate = true;
  ignoreTimeout = false;
  storyShowed = false;
  madeMistake = false;

  pause = false;
  finished = false;

  symbolSounds = ['bookFlip2', 'bookFlip3'];
  moneySounds = ['handleCoins', 'handleCoins2'];

  muteButton: ImageButton;

  reputationTags: Image[] = [];

  statPanel: Panel;
  valuationBar: RoundedProgressBar;
  moneyText: Text;

  storyPanel: TextPanel;
  storyButtons: Button[] = [];

  officeImage: Image;
  officeLeft;
  officeTop;

  readyButton: Button;

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    let worker;
    this.fadeIn(500);
    this.initTouchInput();
    this.getWorldView();
    soundsController.playSoundtrack('the-first-snow');
    soundsController.pauseMusic(true);
    //monetizationController.mockStart();


    this.officeImage = new Image(this, this.view.centerX, this.view.centerY, 'office');
    this.add.existing(this.officeImage);
    this.officeLeft = this.view.centerX - Math.ceil(this.officeImage.width / 2);
    this.officeTop = this.view.centerY - Math.ceil(this.officeImage.height / 2);

    for (let i = 0; i < purchaseMasks.length; i++) {
      this.purchaseMasks.push({
        id: purchaseMasks[i].id,
        obj: this.add
          .rectangle(this.officeLeft + purchaseMasks[i].x, this.officeTop + purchaseMasks[i].y, purchaseMasks[i].width, purchaseMasks[i].height, 0x000000)
          .setOrigin(0)
          .setScrollFactor(0)
      });
    }

    for (let i = 0; i < purchases.length; i++) {
      this.purchaseButtons.push(new Button(this, this.officeLeft + purchases[i].x, this.officeTop + purchases[i].y, 50, 50, '+', 'flat_wide', 'white', {fontSize: '32px'}, () => {
        soundsController.actionSound(this.moneySounds[Phaser.Math.Between(0, this.moneySounds.length - 1)])
        this.applyPurchase(purchases[i]);
        this.updateMoney(-purchases[i].price);
        this.checkPurchases();
      }));
      this.purchaseButtons[i].setVisible(false);
      this.add.existing(this.purchaseButtons[i]);
    }


    symbolsController.cheatAvailable = gameStat.cheatAvailable;
    if (gameStat.cheatAvailable) {
      this.symbolsToIgnore = [];
    }


    worker = new WorkerSprite(this, this.officeLeft + workerPositions[0].x, this.officeTop + workerPositions[0].y, workerPositions[0].type, this.completeCallback, this.timeoutCallback);
    this.workersPull.push(worker);
    this.workers.push(worker);

    for (let i = 1; i < workerPositions.length; i++) {
      worker = new WorkerSprite(this, this.officeLeft + workerPositions[i].x, this.officeTop + workerPositions[i].y, workerPositions[i].type, this.completeCallback, this.timeoutCallback);
      worker.setVisible(false);
      this.workersPull.push(worker);
    }

    this.muteButton = new ImageButton(this, 50, 50, 80, 80, 'flat_wide', 'white', soundConfig.soundsMuted ?
      'musicOff' : 'musicOn', () => this.changeMuteState(!soundConfig.soundsMuted));
    this.add.existing(this.muteButton);

    for (let i = 0; i < gameConfig.maxReputation; i++) {
      this.reputationTags.push(new Image(this, this.view.right - 50 * i - 10, this.view.top + 110, 'ui', 208));
      this.reputationTags[i].setOrigin(1, 0.5).setDisplaySize(60, 60);
      this.add.existing(this.reputationTags[i]);
    }
    this.updateReputation(0);

    this.statPanel = new Panel(this, this.view.right - 210, this.view.top + 60, 400, 100, 'outline', 'blue', false, 48);
    this.add.existing(this.statPanel);
    this.valuationBar = new RoundedProgressBar(this, 0, -45, 370, 48, 'green', true);
    this.valuationBar.autoColor = false;
    this.statPanel.add(this.valuationBar);

    this.moneyText = new Text(this, 175, 10,  '', {fontSize: '20px', fontFamily: '"Press Start 2P"', color: 'black'});
    this.moneyText.setOrigin(1, 0);
    this.statPanel.add(this.moneyText);
    this.updateMoney(0);

    this.readyButton = new Button(this, this.view.centerX, this.view.bottom - 50, 400, 80, gameConfig.lang.readyToWork, 'flat_wide', 'white', {fontSize: '22px'}, () => {
      if (!this.storyShowed) {
        this.setPause(false);
      }
    });
    this.ignoreInput = true;
    this.pause = true;
    this.add.existing(this.readyButton);

    this.storyPanel = new TextPanel(this, this.view.centerX, this.view.bottom - 160, 600, 300, 'flat', 'white', true, {}, 32, {x: 20, y: 20});
    this.add.existing(this.storyPanel);
    this.storyButtons = [
      new Button(this, 0, 0, 285, 80, '', 'flat_wide', 'white', {fontSize: '22px'}),
      new Button(this, 0, 0, 285, 80, '', 'flat_wide', 'white', {fontSize: '22px'}),
    ];

    for (let i = 0; i < gameStat.purchases.length; i++) {
      this.applyPurchase(purchases.find(p => p.key === gameStat.purchases[i]));
    }
    this.updateValuation(0);
    this.checkPurchases();

    if (!gameStat.tutorialFinished) {
      configController.setConfig(gameStat, 'tutorialFinished', true);
      if (monetizationController.paid) {
        this.showStory(1);
      }
    }
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.ignoreUpdate) {
      this.children.each(i => i.update(time, delta));
    }
  }

  applySymbols(symbols) {
    const result = symbolsController.applySymbols(this.workers, symbols);
    if (result.score) {
      soundsController.actionSound(this.symbolSounds[Phaser.Math.Between(0, this.symbolSounds.length - 1)]);
    }
    if (result.symbol === 'pre-cheat') {
      this.symbolsToIgnore = ['S'];
    } else if (result.symbol === 'cheat') {
      this.symbolsToIgnore = ['S'];
      usageController.log('cheat');
      this.showStory(0);
      configController.setConfig(gameStat, 'cheatAvailable', false);
    } else {
      const value = Phaser.Math.Between(100, 200) * result.score;
      this.updateMoney(Math.round(value));
      this.updateValuation(Math.round(value * 10));
    }
  }

  checkPurchases() {
    for (let i = 0; i < purchases.length; i++) {
      this.purchaseButtons[i].setVisible(
        !gameStat.purchases.includes(purchases[i].key) &&
        gameStat.money >= purchases[i].price &&
        purchases[i].requirements.every(r => gameStat.purchases.includes(r))
      );
    }
  }

  applyPurchase(purchase) {
    configController.savePurchases(purchase.key);
    if (purchase.category === 'room') {
      for (let i = 0; i < this.purchaseMasks.length; i++) {
        if (this.purchaseMasks[i].id === purchase.key) {
          this.purchaseMasks[i].obj.setVisible(false);
        }
      }
    } else if (purchase.category === 'worker') {
      for (let i = 0; i < this.workersPull.length; i++) {
        if (this.workersPull[i].type === workerPositions[purchase.id].type) {
          this.workersPull[i].setVisible(true);
          this.workers.push(this.workersPull[i]);
        }
      }
    }
  }

  prepareWaves() {
    this.waves = [];
    this.madeMistake = false;
    const waveCount = Math.max(Phaser.Math.Between(Math.max(1, gameStat.day - 1), gameStat.day + 1) * Math.pow(0.925, gameStat.day), 2);
    let i;
    for (i = 0; i < waveCount; i++) {
      this.waves.push(0);
    }
    this.nextWave();
  }

  checkWave(done: boolean) {
    if (this.finished) {
      return;
    }
    if (!done) {
      this.madeMistake = true;
      if (!this.ignoreTimeout) {
        this.updateReputation(-1);
      } else {
        this.ignoreTimeout = true;
        this.time.addEvent({
          delay: 2000,
          callback: () => {
            this.ignoreTimeout = false;
          }
        })
      }
    }
    this.waveSize--;
    if (!this.waveSize) {
      this.nextWave();
    }
  }

  nextWave() {
    if (!this.waves.length) {
      if (!this.madeMistake) {
        this.updateReputation(1);
      }
      this.setPause(true);
      return;
    }
    const wave = this.waves.shift();
    this.waveSize = Phaser.Math.Between(Math.max(Math.floor(2 * this.workers.length / 3), 1), this.workers.length);
    const workersInWave = symbolsController.shuffle([...this.workers]).splice(0, this.waveSize);
    const workerSymbols: string[][] = [];

    const timePerSymbol = Math.floor(2000 * Math.pow(0.975, gameStat.day) * Math.pow(1.125, this.waveSize));
    const maxSymbol = gameStat.day < 3 ? 3 : (gameStat.day < 6 ? 5 : symbolList.length - 1);
    const symbolsInWave = Math.min(3 * this.waveSize + Phaser.Math.Between(Math.max(1, gameStat.day - 3), gameStat.day + 3), 5 * this.waveSize);

    let i, j;
    for (i = 0; i < workersInWave.length; i++) {
      workerSymbols.push([]);
    }
    for (i = 0; i < symbolsInWave; i++) {
      j = Phaser.Math.Between(0, workersInWave.length - 1);
      workerSymbols[j].push(symbolList[Phaser.Math.Between(0, maxSymbol)]);
    }
    for (i = 0; i < workersInWave.length; i++) {
      if (workerSymbols.length) {
        workersInWave[i].setSymbols(workerSymbols[i], timePerSymbol * workerSymbols[i].length);
      }
    }
  }

  changeMuteState(mute) {
    if (mute) {
      soundsController.mute();
    } else {
      soundsController.unmute();
    }
    this.muteButton.setImage(mute ? 'musicOff' : 'musicOn');
  }


  showStory(id) {
    const buttons: Button[] = [];
    for (let i = 0; i < stories[id].options.length; i++) {
      buttons.push(this.storyButtons[i]);
      buttons[i].setText(stories[id].options[i].text);
      buttons[i].callback = () => {
        this.updateMoney(stories[id].options[i].money);
        this.updateValuation(stories[id].options[i].valuation);
        this.updateReputation(stories[id].options[i].reputation);
        this.hideStory();
        configController.saveAnswer(id, i);
      }
    }
    this.ignoreUpdate = true;
    this.ignoreInput = true;
    this.storyShowed = true;
    this.storyPanel.show(stories[id].text, buttons);
  }

  hideStory() {
    this.storyPanel.hide(500);
    this.ignoreInput = this.pause;
    this.time.addEvent({
      delay: 500,
      callback: () => {
        this.storyShowed = false;
        this.ignoreUpdate = this.pause;
      }
    });
  }

  updateMoney(delta) {
    configController.setConfig(gameStat, 'money', gameStat.money + delta);
    this.moneyText.setText(gameStat.money.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }));
  }

  updateValuation(delta) {
    configController.setConfig(gameStat, 'valuation', Math.max(0, gameStat.valuation + delta));
    this.valuationBar.setProgress(Math.max(Math.min(gameStat.valuation / gameConfig.targetValuation, 1), 0));
    if (gameStat.valuation >= gameConfig.targetValuation) {
      this.finishGame(true);
    }
  }

  updateReputation(delta) {
    configController.setConfig(gameStat, 'reputation', Math.max(Math.min(gameStat.reputation + delta, gameConfig.maxReputation), 0));
    let i;
    for (i = 0; i < gameStat.reputation; i++) {
      this.reputationTags[i].setVisible(true);
    }
    for (; i < gameConfig.maxReputation; i++) {
      this.reputationTags[i].setVisible(false);
    }
    if (gameStat.reputation === 0) {
      this.finishGame(false);
    }
  }

  setPause(pause) {
    this.pause = pause;
    this.ignoreUpdate = this.pause;
    this.ignoreInput = this.pause;
    soundsController.pauseMusic(this.pause);
    this.readyButton.setVisible(this.pause);

    if (pause) {
      configController.setConfig(gameStat, 'day', gameStat.day + 1);
      this.checkPurchases();
    } else {
      for (let i = 0; i < this.purchaseButtons.length; i++) {
        this.purchaseButtons[i].setVisible(false);
      }
      this.prepareWaves();
    }
  }

  finishGame(win) {
    this.ignoreUpdate = true;
    this.ignoreInput = true;
    this.finished = true;
    this.readyButton.setVisible(false);
    soundsController.stopMusic();
    soundsController.finishSound(win ? 'win' : 'lose');
    this.freeObjects(this.purchaseButtons);
    const buttons = [this.storyButtons[0]];
    buttons[0].setText('Restart');
    buttons[0].callback = () => {
      usageController.log('replay');
      this.workers = [];
      this.freeObjects(this.workersPull);
      this.freeObjects(this.reputationTags);
      this.freeObjects(this.storyButtons);
      for (let i = 0; i < this.purchaseMasks.length; i++) {
        this.purchaseMasks[i].obj.destroy(true);
      }
      this.purchaseMasks = [];
      symbolsController.free();
      this.finished = false;
      this.pause = true;
      this.scene.restart();
    }
    const text = 'You ' + (win ? 'collected enough money for revenge' : 'lose') + ' in ' + gameStat.day + ' weeks. Would you like to play again?';
    this.storyPanel.show(text, buttons);
    configController.resetGameStat();
  }

  freeObjects(array: Phaser.GameObjects.GameObject[]) {
    for (let i = 0; i < array.length; i++) {
      array[i].destroy(true);
    }
    array.length = 0;
  }
}
