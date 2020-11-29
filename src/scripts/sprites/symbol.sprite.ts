import Sprite = Phaser.GameObjects.Sprite;


export default class SymbolSprite extends Sprite{
  symbol: string;

  constructor(scene) {
    super(scene, 0, 0, 'unistrokeSymbols', '|');
    this.setOrigin(0, 1);
  }

  setSymbol(symbol) {
    this.symbol = symbol;
    this.setFrame(symbol);
  }
}
