import BaseScene from '../scenes/base.scene';

export interface SymbolsControlInterface {
  scene: BaseScene;
  progress: number|null;
  setSymbols(symbols: string[], timespan: number|null): void;
  testRemoveSymbol(symbol: string, onlyFirst: boolean, onlyOne: boolean): number;
  removeSymbol(symbol: string, onlyFirst: boolean, onlyOne: boolean): number;
  addTimeBonus(timespan: number): void;
}
