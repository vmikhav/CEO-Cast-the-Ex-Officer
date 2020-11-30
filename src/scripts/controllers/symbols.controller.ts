import SymbolSprite from '../sprites/symbol.sprite';
import { SymbolsControlInterface } from '../models';


class SymbolsController {
  symbols: SymbolSprite[] = [];
  onlyFirst = true;
  onlyOne = true;

  cheatAvailable = false;
  cheatPrepared = false;

  getSymbol(control: SymbolsControlInterface, symbol: string) {
    let sprite: SymbolSprite;
    if (this.symbols.length) {
      sprite = this.symbols.pop() as SymbolSprite;
    } else {
      sprite = new SymbolSprite(control.scene);
    }
    sprite.setSymbol(symbol);
    sprite.setAlpha(1);
    return sprite;
  }

  releaseSymbol(sprite: SymbolSprite|SymbolSprite[]) {
    if (Array.isArray(sprite)) {
      this.symbols.push(...sprite);
    } else {
      this.symbols.push(sprite);
    }
  }

  shuffle<T>(array: T[]): T[] {
    for(let i = array.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * i);
      const temp = array[i]
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  free() {
    this.symbols = [];
  }

  applySymbols(controls: SymbolsControlInterface[], symbols: any[]) {
    //console.log(symbols[0].name);
    //console.log([...symbols]);
    const result = {symbol: '', score: 0};
    if (!symbols.length) {
      return result;
    }
    if (this.cheatAvailable) {
      if (this.cheatPrepared && symbols[0].name === '|') {
        result.symbol = 'cheat';
        result.score = 100000;
        this.cheatPrepared = true;
        this.cheatAvailable = false;
        return result;
      } else if (!this.cheatPrepared && symbols[0].name === 'S') {
        this.cheatPrepared = true;
        //result.symbol = 'pre-cheat';
        //return result;
      } else {
        this.cheatPrepared = false;
      }
    }
    let i;
    for (i = 0; i < symbols.length; i++) {
      symbols[i].amount = controls.reduce((acc, w) => acc + w.testRemoveSymbol(symbols[i].name, this.onlyFirst, this.onlyOne), 0);
      symbols[i].symbolScore = symbols[i].score * symbols[i].amount;
    }
    symbols.sort((a, b) => b.symbolScore - a.symbolScore);
    result.symbol = symbols[0].name;
    const symbolScore = Math.pow(1.25 + symbols[0].score, symbols[0].amount);
    result.score = symbolScore * controls.reduce((acc, w) => acc + w.removeSymbol(result.symbol, this.onlyFirst, this.onlyOne), 0);
    return result;
  }

}

export const symbolsController = new SymbolsController();

