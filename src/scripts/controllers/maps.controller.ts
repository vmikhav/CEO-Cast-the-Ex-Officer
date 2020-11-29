import { gameConfig } from '../config';
import Tilemap = Phaser.Tilemaps.Tilemap;
import StaticTilemapLayer = Phaser.Tilemaps.StaticTilemapLayer;
import DynamicTilemapLayer = Phaser.Tilemaps.DynamicTilemapLayer;

export class MapsController {
  static g2p = (x, y) => {
    return {x: Math.floor(x) * gameConfig.tileSize, y: Math.floor(y) * gameConfig.tileSize};
  };

  static p2g = (pixel) => {
    return {
      x: Math.floor(pixel.x / gameConfig.tileSize),
      y: Math.floor(pixel.y / gameConfig.tileSize)
    };
  };
}

export interface ExTilemap extends Tilemap {
  properties: Record<string, any> | {name:string, value: string}[];
}

export interface MapLayers {
  groundLayer: StaticTilemapLayer;
  wallsLayer: StaticTilemapLayer;
  puzzleLayer: DynamicTilemapLayer;
  treesLayer: StaticTilemapLayer;
  behindLayer: DynamicTilemapLayer;
  frontLayer: DynamicTilemapLayer;
}

export interface HeroPathItem {
  x: number,
  y: number,
  item: number
}
