import { usageController } from '../controllers';
import BaseScene from './base.scene';
import { PointCloud, qDollarUniStrokeRecognizer, QPoint } from '../components';
import Polygon = Phaser.GameObjects.Polygon;

export default class BaseLevelScene extends BaseScene {

  trackPointer = false;
  ignoreInput = false;
  points: QPoint[][] = [];
  lineId = 0;
  multistroke = false;

  polygons: Polygon[] = [];

  symbolsToIgnore: string[] = ['S'];

  constructor(config) {
    super(config);
  }

  update(time, delta) {

  }

  initTouchInput() {
    this.input.on('pointerdown', pointer => {
      if (this.isButtonPressed || this.ignoreInput) {
        return;
      }
      this.trackPointer = true;
      this.points.push([]);
      this.pushPoint(pointer);
    });

    const completeFunction = pointer => {
      if (!this.trackPointer) {
        return;
      }
      this.addPoint(pointer);
      if (this.multistroke) {
        if (this.multistrokeRecognize()) {
          this.reset();
        } else {
          this.lineId++;
          this.points.push([]);
        }
      } else {
        this.recognize();
        this.reset();
      }
      this.trackPointer = false;
    };

    this.input.on('pointerup', completeFunction);
    this.input.on('gameout', completeFunction);
    this.input.on('pointermove', pointer => {
      if (this.trackPointer) {
        if (this.addPoint(pointer)) {
          const i = this.points.length - 1;
          const polygon = this.add
            .polygon(0, 0, this.points[i])
            .setClosePath(false)
            .setOrigin(0)
            .setStrokeStyle(10, 0xffffff);
          if (this.polygons.length < this.points.length) {
            this.polygons.push(polygon);
          } else {
            this.polygons[i].destroy();
            this.polygons[i] = polygon;
          }
        }
      }
    });
  }

  reset() {
    this.lineId = 0;
    this.points = [];
    this.resetPolygons();
  }

  resetPolygons() {
    let i;
    for (i = 0; i < this.polygons.length; i++) {
      this.polygons[i].destroy();
    }
    this.polygons = [];
  }

  addPoint(point, distanceFilter = 25, smoothFactor = 0.75): boolean {
    if (!this.points[this.lineId].length) {
      this.pushPoint(point);
      return false;
    }
    const oldP = this.points[this.lineId][this.points[this.lineId].length - 1];
    const newP = {x: (oldP.x * smoothFactor) + (point.x * (1 - smoothFactor)), y: (oldP.y * smoothFactor) + (point.y * (1 - smoothFactor))};

    if (Math.pow(Math.abs(oldP.x - newP.x), 2) + Math.pow(Math.abs(oldP.y - newP.y), 2) > distanceFilter) {
      this.pushPoint(newP);
      return true;
    }
    return false;
  }

  pushPoint(point: {x: number, y: number}) {
    this.points[this.lineId].push(new QPoint(point.x, point.y, this.lineId + 1));
  }

  recognize() {
    let points: QPoint[] = [];
    let i;
    for (i = 0; i < this.points.length; i++) {
      points = points.concat(this.points[i]);
    }
    if (points.length > 7) {
      //const cloud = new PointCloud('', points);
      //console.log(JSON.stringify(cloud.toJSON()));
      this.applySymbols(qDollarUniStrokeRecognizer.recognize(points, this.symbolsToIgnore));
    }
  }

  applySymbols(symbols) {

  }

  multistrokeRecognize() {
    return false;
  }


  finish() {
    usageController.finishLevel();
  }

}
