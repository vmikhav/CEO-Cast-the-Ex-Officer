import WebFont from 'webfontloader';
import { loaderConfig } from '../config';
import BaseScene from './base.scene';

export default class BootScene extends BaseScene {
  fontsReady = false;

  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    this.fontsReady = loaderConfig.webfonts.length === 0;
    WebFont.load({
      custom: {
        families: loaderConfig.webfonts,
        urls: ['css/index.css']
      },
      active: () => this.fontsLoaded(),
    });
  }

  update () {
    if (this.fontsReady) {
      this.scene.start('PreloadScene')
    }
  }

  fontsLoaded () {
    this.fontsReady = true
  }

  create() {

    /**
     * This is how you would dynamically import the mainScene class (with code splitting),
     * add the mainScene to the Scene Manager
     * and start the scene.
     * The name of the chunk would be 'mainScene.chunk.js
     * Find more about code splitting here: https://webpack.js.org/guides/code-splitting/
     */
    // let someCondition = true
    // if (someCondition)
    //   import(/* webpackChunkName: "mainScene" */ './mainScene').then(mainScene => {
    //     this.scene.add('MainScene', mainScene.default, true)
    //   })
    // else console.log('The mainScene class will not even be loaded by the browser')
  }
}
