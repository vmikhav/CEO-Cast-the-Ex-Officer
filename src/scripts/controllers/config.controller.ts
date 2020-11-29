import { gameConfig, gameStat, soundConfig } from '../config';
import { soundsController } from './sounds.controller';
import { usageController } from './usage.controller';

class ConfigController {
  resetGameStat() {
    this.setConfig(gameStat, 'started', new Date());
    this.setConfig(gameStat, 'tutorialFinished', false);
    this.setConfig(gameStat, 'cheatAvailable', true);
    this.setConfig(gameStat, 'valuation', 0);
    this.setConfig(gameStat, 'money', 0);
    this.setConfig(gameStat, 'reputation', 2);
    this.setConfig(gameStat, 'day', 1);
    gameStat.answers = {};
    gameStat.purchases = [];
    localStorage[gameConfig.localStorageName + '.answers'] = '{}';
    localStorage[gameConfig.localStorageName + '.purchases'] = '[]';
    usageController.log('resetProgress');
  };

  loadConfig() {
    const storage = gameConfig.localStorageName;
    this.setConfig(gameStat, 'id', localStorage[storage + '.id'] || this.uuid());
    this.setConfig(gameStat, 'started', localStorage[storage + '.started'] === undefined ? new Date() : new Date(localStorage[storage + '.started']));
    gameStat.valuation = parseInt(localStorage[storage + '.valuation'] || '0');
    gameStat.money = parseInt(localStorage[storage + '.money'] || '0');
    gameStat.reputation = parseInt(localStorage[storage + '.reputation'] || '2');
    gameStat.day = parseInt(localStorage[storage + '.day'] || '1');

    gameStat.tutorialFinished = localStorage[storage + '.tutorialFinished'] === 'true';
    gameStat.cheatAvailable = localStorage[storage + '.cheatAvailable'] === undefined || localStorage[storage + '.cheatAvailable'] === 'true';

    gameStat.answers = JSON.parse(localStorage[storage + '.answers'] || '{}');
    gameStat.purchases = JSON.parse(localStorage[storage + '.purchases'] || '[]');

    soundConfig.musicMuted = localStorage[storage + '.musicMuted'] === 'true';
    soundConfig.soundsMuted = localStorage[storage + '.soundsMuted'] === 'true';
    soundConfig.musicVolume = parseFloat(localStorage[storage + '.musicVolume'] || 1);
    soundConfig.soundsVolume = parseFloat(localStorage[storage + '.soundsVolume'] || 1);
  }

  setConfig(object, field, value) {
    object[field] = value;
    localStorage[gameConfig.localStorageName + '.' + field] = value;
    if (field === 'musicVolume') {
      soundsController.resetMusicVolume();
    }
  }

  saveAnswer(id, option) {
    gameStat.answers[id] = option;
    localStorage[gameConfig.localStorageName + '.answers'] = JSON.stringify(gameStat.answers);
    usageController.log('answer', {id, option});
  }

  savePurchases(item) {
    if (!gameStat.purchases.includes(item)) {
      gameStat.purchases.push(item);
      localStorage[gameConfig.localStorageName + '.purchases'] = JSON.stringify(gameStat.purchases);
      usageController.log('purchase', {item});
    }
  }

  uuid(): string {
    // @ts-ignore
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15 >> c/4).toString(16));
  }

}

export const textColorSelector = (type, color) => {
  if (['stone_dark', 'wood', 'stone_dark_inset', 'wood_inset'].includes(type)) {
    return 'white';
  }
  return 'black';
}

export const configController = new ConfigController();
