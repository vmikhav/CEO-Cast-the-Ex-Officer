import Phaser from 'phaser';
import { loaderConfig } from '../config';
import BaseScene from './base.scene';
import { soundsController } from '../controllers';
import { game } from '../game';

export default class PreloadScene extends BaseScene {
  percentText;

  constructor () {
    super({ key: 'PreloadScene' });
  }

  preload () {
    this.game.resize();
    setTimeout(() => {
      this.game.resize();
    }, 250);
    this.getWorldView();
    document.getElementById('spinner')?.remove();
    this.percentText = this.make.text({
      x: this.view.centerX,
      y: this.view.centerY,
      text: '0%',
      style: {
        align: 'center',
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        fill: '#ffffff'
      }
    });
    this.percentText.setOrigin(0.5);
    this.load.on('progress', (value) => {
      this.percentText.setText(parseInt((value * 100).toString()) + '%');
    });

    if (!game) {
      this.percentText.setText('Cannot run game\n\nin Private mode\n\nin Chrome-based browser ;(');
      return;
    }


    this.load.spritesheet('ui', 'assets/images/UIpackSheet.png', {frameHeight: 16, frameWidth: 16, margin: 1, spacing: 4});
    this.load.spritesheet('workers', 'assets/images/workers.png', {frameHeight: 64, frameWidth: 32, margin: 1, spacing: 2});
    this.load.atlas('unistrokeSymbols', 'assets/images/unistroke_symbols.png', 'assets/images/unistroke_symbols.json');
    this.load.image('musicOn', 'assets/images/musicOn.png');
    this.load.image('musicOff', 'assets/images/musicOff.png');
    this.load.image('banner_ceo', 'assets/images/banner_ceo.png');
    this.load.image('office', 'assets/images/Game_office.png');
    //this.load.image('logo', 'assets/images/logo.png');
    for (let sound of loaderConfig.soundtracks) {
      this.load.audio(sound, 'assets/sounds/' + sound + '.mp3');
    }
    for (let sound of loaderConfig.actionSounds) {
      const name = sound.split('.')[0];
      this.load.audio(name, 'assets/sounds/' + sound);
    }
    for (let sound of loaderConfig.finishSounds) {
      const name = sound.split('.')[0];
      this.load.audio(name, 'assets/sounds/' + sound);
    }
    for (let video of loaderConfig.videos) {
      const name = video.split('.')[0];
      this.load.video(name, 'assets/videos/' + video, undefined, undefined, true);
    }
  }

  create () {
    soundsController.setGame(game);

    this.percentText.destroy();
    this.percentText = null;
    this.textures.get('ui').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('office').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('workers').setFilter(Phaser.Textures.FilterMode.NEAREST);

    this.scene.start('MainMenuScene');
  }

  update () {}

  onResize() {
    super.onResize();
    if (this.percentText) {
      this.percentText.setPosition(this.view.centerX, this.view.centerY);
    }
  }
}
