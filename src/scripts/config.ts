import Phaser from 'phaser';
import lang from './lang';

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 1136;
const MAX_WIDTH = 960;
const MAX_HEIGHT = 1400;



export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  scale: {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    mode: Phaser.Scale.NONE,
    parent: 'phaser-game',
  },
}

export const gameConfig = {
  debug: true,
  lang: lang.en,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  maxWidth: MAX_WIDTH,
  maxHeight: MAX_HEIGHT,
  tileSize: 32,

  targetValuation: 1000000,
  maxReputation: 4,
  title: 'Cast the Ex-Officer',
  localStorageName: 'ceo_cast_the_ex_officer_0',
};

export const loaderConfig = {
  webfonts: ['Press Start 2P'],
  soundtracks: ['the-first-snow'],
  actionSounds: [
    'click.mp3', 'metalClick.mp3', 'handleCoins.mp3', 'handleCoins2.mp3', 'bookFlip2.mp3', 'bookFlip3.mp3',
  ],
  finishSounds: ['win.mp3', 'lose.mp3'],
  videos: ['boss.webm'],
}

interface SoundConfig {
  music: Phaser.Sound.BaseSound|null,
  musicMuted: boolean,
  soundsMuted: boolean,
  musicVolume: number,
  soundsVolume: number,
  musicParams: Phaser.Types.Sound.SoundConfig,
  soundParams: Phaser.Types.Sound.SoundConfig,
}

export const soundConfig: SoundConfig = {
  music: null,
  musicMuted: false,
  soundsMuted: false,
  musicVolume: 1,
  soundsVolume: 1,
  musicParams: {
    mute: false,
    volume: .2,
    rate: 1,
    detune: 0,
    seek: 0,
    loop: true,
    delay: 0
  },
  soundParams: {
    volume: .5,
  },
}

export const gameStat = {
  id: '',
  tutorialFinished: false,
  cheatAvailable: true,
  levelIntoShowed: {},
  started: new Date(),
  valuation: 0,
  money: 0,
  reputation: 2,
  day: 1,
  answers: {},
  purchases: [] as string[],
}
