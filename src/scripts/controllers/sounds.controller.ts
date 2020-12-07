import { loaderConfig, soundConfig } from '../config';
import { configController } from './config.controller';

class SoundsController {
  private soundManager;
  private actionSounds: Record<string, Phaser.Sound.BaseSound>;
  private finishSounds: Record<string, Phaser.Sound.BaseSound>;
  private soundtracks: Record<string, Phaser.Sound.BaseSound>;

  private temporaryMute = false;
  private musicPaused = false;

  constructor() {

  }

  setGame(game) {
    this.soundManager = game.sound;

    this.actionSounds = {};
    this.finishSounds = {};
    this.soundtracks = {};

    for (const sound of loaderConfig.actionSounds) {
      const name = sound.split('.')[0];
      this.actionSounds[name] = this.soundManager.add(name);
    }

    for (const sound of loaderConfig.finishSounds) {
      const name = sound.split('.')[0];
      this.finishSounds[name] = this.soundManager.add(name);
    }

    for (const name of loaderConfig.soundtracks) {
      this.soundtracks[name] = this.soundManager.add(name);
    }
  }

  mute(temporary = false) {
    this.temporaryMute = temporary;
    if (soundConfig.music && !soundConfig.music.isPaused) {
      soundConfig.music.pause();
    }
    configController.setConfig(soundConfig, 'soundsMuted', true);
  }

  unmute(temporary = false) {
    if (temporary && !this.temporaryMute) {
      return;
    }
    if (soundConfig.music && soundConfig.music.isPaused && !this.musicPaused) {
      soundConfig.music.resume();
    }
    configController.setConfig(soundConfig, 'soundsMuted', false);
    this.temporaryMute = false;
  }

  actionSound(name) {
    if (!soundConfig.soundsMuted && !this.temporaryMute) {
      this.actionSounds[name].play(this.soundParams);
    }
  }

  finishSound(name) {
    if (!soundConfig.soundsMuted && !this.temporaryMute) {
      this.finishSounds[name].play(this.soundParams);
    }
    this.stopMusic();
  }

  stopMusic() {
    if (soundConfig.music) {
      soundConfig.music.stop();
      soundConfig.music = null;
    }
  }

  playSoundtrack(name) {
    const exist = this.soundtracks.hasOwnProperty(name);
    if (!exist) {
      this.stopMusic();
    } else if (soundConfig.music !== this.soundtracks[name]) {
      this.stopMusic();
      soundConfig.music = this.soundtracks[name];
      soundConfig.music.play(this.musicParams);
      if (soundConfig.soundsMuted) {
        soundConfig.music.pause();
      }
    }
  }

  pauseMusic(pause) {
    this.musicPaused = pause;
    if (soundConfig.music) {
      if (pause && !soundConfig.music.isPaused) {
        soundConfig.music.pause();
      } else if (!pause && !soundConfig.soundsMuted) {
        soundConfig.music.play();
      }
    }
  }

  resetMusicVolume() {
    if (soundConfig.music) {
      // @ts-ignore
      if (typeof soundConfig.music.setVolume === 'function') {
        // @ts-ignore
        soundConfig.music.setVolume(this.musicParams.volume);
      }
    }
  }

  private get soundParams() {
    const soundParams = Object.assign({}, soundConfig.soundParams);
    if (soundConfig.soundParams.volume !== undefined) {
      soundParams.volume = soundConfig.soundParams.volume * soundConfig.soundsVolume;
    }
    return soundParams;
  }

  private get musicParams() {
    const musicParams = Object.assign({}, soundConfig.musicParams);
    if (soundConfig.musicParams.volume !== undefined) {
      musicParams.volume = soundConfig.musicParams.volume * soundConfig.musicVolume;
    }
    return musicParams;
  }

}


export const soundsController = new SoundsController();
