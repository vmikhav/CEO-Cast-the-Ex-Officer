/**
 * The $Q Super-Quick Recognizer (Enhanced TypeScript version)
 *
 *  Volodymyr Mikhav
 *  Kropyvnytsky, Ukraine
 *  mihaw.wolodymyr@gmail.com
 *
 * Original Javascript version:
 *
 *  Nathan Magrofuoco
 *  Universite Catholique de Louvain
 *  Louvain-la-Neuve, Belgium
 *  nathan.magrofuoco@uclouvain.be
 *
 * Original $Q authors (C# version):
 *
 *  Radu-Daniel Vatavu, Ph.D.
 *  University Stefan cel Mare of Suceava
 *  Suceava 720229, Romania
 *  radu.vatavu@usm.ro
 *
 *  Lisa Anthony, Ph.D.
 *  Department of CISE
 *  University of Florida
 *  Gainesville, FL, USA 32611
 *  lanthony@cise.ufl.edu
 *
 *  Jacob O. Wobbrock, Ph.D.
 *  The Information School | DUB Group
 *  University of Washington
 *  Seattle, WA, USA 98195-2840
 *  wobbrock@uw.edu
 *
 * The academic publication for the $Q recognizer, and what should be
 * used to cite it, is:
 *
 *    Vatavu, R.-D., Anthony, L. and Wobbrock, J.O. (2018). $Q: A super-quick,
 *    articulation-invariant stroke-gesture recognizer for low-resource devices.
 *    Proceedings of the ACM Conference on Human-Computer Interaction with Mobile
 *    Devices and Services (MobileHCI '18). Barcelona, Spain (September 3-6, 2018).
 *    New York: ACM Press. Article No. 23.
 *    https://dl.acm.org/citation.cfm?id=3229434.3229465
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (c) 2018-2019, Nathan Magrofuoco, Jacob O. Wobbrock, Radu-Daniel Vatavu,
 * and Lisa Anthony. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University Stefan cel Mare of Suceava,
 *      University of Washington, nor University of Florida, nor the names of its
 *      contributors may be used to endorse or promote products derived from this
 *      software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Radu-Daniel Vatavu OR Lisa Anthony
 * OR Jacob O. Wobbrock BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
 * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 **/

export interface QResult {
  name: string;
  score: number,
}

//
// QDollarRecognizer constants
//
const NumPoints = 32;
const MaxIntCoord = 1024; // (IntX, IntY) range from [0, MaxIntCoord - 1]
const LUTSize = 64; // default size of the lookup table is 64 x 64
const LUTScaleFactor = MaxIntCoord / LUTSize; // used to scale from (IntX, IntY) to LUT

//
// Point class
//
export class QPoint {
  x: number;
  y: number;
  id: number; // stroke ID to which this point belongs (1,2,3,etc.)

  constructor(x, y, id = 0) {
    this.x = x;
    this.y = y;
    this.id = id;
  }

  static rawEuclideanDistance(x1, x2, y1, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return (dx * dx + dy * dy);
  }

  static euclideanDistance(pt1: QPoint, pt2: QPoint) {
    return Math.sqrt(this.rawEuclideanDistance(pt1.x, pt2.x, pt1.y, pt2.y));
  }
}

class QPointEx extends QPoint{
  intX = 0; // for indexing into the LUT
  intY = 0; // for indexing into the LUT

  constructor(x, y, id) {
    super(x, y, id);
    this.intX = Math.round((this.x + 1.0) / 2.0 * (MaxIntCoord - 1));
    this.intY = Math.round((this.y + 1.0) / 2.0 * (MaxIntCoord - 1));
  }
}

interface PointCloudData {
  name: string;
  points: QPointEx[];
}

//
// PointCloud class
//
export class PointCloud {
  name: string;
  points: QPointEx[];
  LUT: number[][];

  constructor(name: string|PointCloudData, points: QPoint[] = [], origin = new QPoint(0, 0, 0)) {
    if (typeof name === 'string') {
      this.name = name;
      this.points = PointCloud.makeIntCoords(PointCloud.translateTo(PointCloud.scale(PointCloud.resample(points, NumPoints)), origin));
    } else {
      this.name = name.name;
      this.points = name.points;
    }
    this.LUT = PointCloud.computeLUT(this.points);
  }

  toJSON() {
    return {name: this.name, points: this.points};
  }

  private static pathLength(points: QPoint[]) { // length traversed by a point path
    let d = 0.0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].id == points[i-1].id)
        d += QPoint.euclideanDistance(points[i-1], points[i]);
    }
    return d;
  }

  private static makeIntCoords(points: QPoint[]): QPointEx[] {
    return points.map(p => new QPointEx(p.x, p.y, p.id));
  }

  private static computeLUT(points: QPointEx[]) {
    const LUT: number[][] = [];
    for (let i = 0; i < LUTSize; i++) {
      LUT.push([]);
    }

    let x, y, u, b, i, row, col, d;
    for (x = 0; x < LUTSize; x++) {
      for (y = 0; y < LUTSize; y++) {
        u = -1;
        b = +Infinity;
        for (i = 0; i < points.length; i++) {
          row = Math.round(points[i].intX / LUTScaleFactor);
          col = Math.round(points[i].intY / LUTScaleFactor);
          d = ((row - x) * (row - x)) + ((col - y) * (col - y));
          if (d < b) {
            b = d;
            u = i;
          }
        }
        LUT[x].push(u);
      }
    }
    return LUT;
  }

  private static resample(points: QPoint[], n: number) {
    const I = PointCloud.pathLength(points) / (n - 1); // interval length
    let D = 0.0;
    let i, d, qx, qy, q;
    const newPoints = [points[0]];
    for (i = 1; i < points.length; i++) {
      if (points[i].id == points[i-1].id) {
         d = QPoint.euclideanDistance(points[i-1], points[i]);
        if ((D + d) >= I) {
          qx = points[i-1].x + ((I - D) / d) * (points[i].x - points[i-1].x);
          qy = points[i-1].y + ((I - D) / d) * (points[i].y - points[i-1].y);
          q = new QPoint(qx, qy, points[i].id);
          newPoints[newPoints.length] = q; // append new point 'q'
          points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
          D = 0.0;
        }
        else D += d;
      }
    }
    if (newPoints.length == n - 1) { // sometimes we fall a rounding-error short of adding the last point, so add it if so
      newPoints[newPoints.length] = new QPoint(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].id);
    }
    return newPoints;
  }

  private static scale(points: QPoint[]) {
    let minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
    let i, qx, qy;
    for (i = 0; i < points.length; i++) {
      minX = Math.min(minX, points[i].x);
      minY = Math.min(minY, points[i].y);
      maxX = Math.max(maxX, points[i].x);
      maxY = Math.max(maxY, points[i].y);
    }
    const size = Math.max(maxX - minX, maxY - minY);
    const newPoints: QPoint[] = [];
    for (i = 0; i < points.length; i++) {
      qx = (points[i].x - minX) / size;
      qy = (points[i].y - minY) / size;
      newPoints[newPoints.length] = new QPoint(qx, qy, points[i].id);
    }
    return newPoints;
  }

  private static translateTo(points: QPoint[], pt: QPoint) { // translates points' centroid to pt
    const c = PointCloud.centroid(points);
    const newPoints: QPoint[] = [];
    let i, qx, qy;
    for (i = 0; i < points.length; i++) {
      qx = points[i].x + pt.x - c.x;
      qy = points[i].y + pt.y - c.y;
      newPoints[newPoints.length] = new QPoint(qx, qy, points[i].id);
    }
    return newPoints;
  }

  private static centroid(points: QPoint[]) {
    let x = 0.0, y = 0.0;
    let i;
    for (i = 0; i < points.length; i++) {
      x += points[i].x;
      y += points[i].y;
    }
    x /= points.length;
    y /= points.length;
    return new QPoint(x, y, 0);
  }
}

//
// QDollarRecognizer class
//
class QDollarRecognizer {
  clouds: PointCloud[] = [];

  constructor(clouds) {
    this.clouds = clouds;
  }

  recognize(points: QPoint[], symbolsToIgnore: string[] = []) {
    const candidate = new PointCloud('', points);
    let results: QResult[] = [];

    let u = -1;
    let b = +Infinity;
    let score;
    for (let i = 0; i < this.clouds.length; i++) { // for each point-cloud template
      if (symbolsToIgnore.includes(this.clouds[i].name)) {
        continue;
      }
      let d = QDollarRecognizer.cloudMatch(candidate, this.clouds[i], b + 5);
      if (d < b) {
        b = d; // best (least) distance
        u = i; // point-cloud index
        score = b > 1.0 ? 1.0 / b : 1.0;
        results.push({name: this.clouds[i].name, score});
      }
    }

    results.sort((a, b) => b.score - a.score);
    if (results.length && results[0].score > 0.5) {
      results = results.filter(i => i.score > 0.1);
    }

    return results;
  }

  private static cloudMatch(candidate: PointCloud, template: PointCloud, minSoFar: number) {
    const n = candidate.points.length;
    const step = Math.floor(Math.pow(n, 0.5));

    const LB1 = QDollarRecognizer.computeLowerBound(candidate.points, template.points, step, template.LUT);
    const LB2 = QDollarRecognizer.computeLowerBound(template.points, candidate.points, step, candidate.LUT);

    for (let i = 0, j = 0; i < n; i += step, j++) {
      if (LB1[j] < minSoFar)
        minSoFar = Math.min(minSoFar, QDollarRecognizer.cloudDistance(candidate.points, template.points, i, minSoFar));
      if (LB2[j] < minSoFar)
        minSoFar = Math.min(minSoFar, QDollarRecognizer.cloudDistance(template.points, candidate.points, i, minSoFar));
    }
    return minSoFar;
  }

  private static cloudDistance(pts1: QPoint[], pts2: QPoint[], start: number, minSoFar: number) {
    const n = pts1.length;
    const unmatched: number[] = []; // indices for pts2 that are not matched
    for (let j = 0; j < n; j++) {
      unmatched.push(j);
    }
    let i = start;  // start matching with point 'start' from pts1
    let weight = n; // weights decrease from n to 1
    let sum = 0.0;  // sum distance between the two clouds
    let u, b, d;
    do {
      u = -1;
      b = +Infinity;
      for (let j = 0; j < unmatched.length; j++) {
        d = QPoint.rawEuclideanDistance(pts1[i].x, pts2[unmatched[j]].x, pts1[i].y, pts2[unmatched[j]].y);
        if (d < b) {
          b = d;
          u = j;
        }
      }
      unmatched.splice(u, 1); // remove item at index 'u'
      sum += weight * b;
      if (sum >= minSoFar) {
        return sum; // early abandoning
      }
      weight--;
      i = (i + 1) % n;
    } while (i != start);
    return sum;
  }

  private static computeLowerBound(pts1: QPointEx[], pts2: QPointEx[], step: number, LUT: number[][]): number[] {
    const n = pts1.length;
    const LB = new Array(Math.floor(n / step) + 1);
    const SAT = new Array(n);
    LB[0] = 0.0;

    let i, j, x, y, index, d;
    for (i = 0; i < n; i++) {
      x = Math.round(pts1[i].intX / LUTScaleFactor);
      y = Math.round(pts1[i].intY / LUTScaleFactor);
      index = LUT[x][y];
      d = QPoint.rawEuclideanDistance(pts1[i].x, pts2[index].x, pts1[i].y, pts2[index].y);
      SAT[i] = (i == 0) ? d : SAT[i - 1] + d;
      LB[0] += (n - i) * d;
    }
    for (i = step, j = 1; i < n; i += step, j++) {
      LB[j] = LB[0] + i * SAT[n - 1] - n * SAT[i - 1];
    }
    return LB;
  }

}


const multiStrokeClouds = [new PointCloud("T", [new QPoint(30, 7, 1), new QPoint(103, 7, 1),
    new QPoint(66, 7, 2), new QPoint(66, 87, 2)]),
  new PointCloud("N", [new QPoint(177, 92, 1), new QPoint(177, 2, 1),
    new QPoint(182, 1, 2), new QPoint(246, 95, 2),
    new QPoint(247, 87, 3), new QPoint(247, 1, 3)]),
  new PointCloud("D", [new QPoint(345, 9, 1), new QPoint(345, 87, 1),
    new QPoint(351, 8, 2), new QPoint(363, 8, 2), new QPoint(372, 9, 2), new QPoint(380, 11, 2), new QPoint(386, 14, 2), new QPoint(391, 17, 2), new QPoint(394, 22, 2), new QPoint(397, 28, 2), new QPoint(399, 34, 2), new QPoint(400, 42, 2), new QPoint(400, 50, 2), new QPoint(400, 56, 2), new QPoint(399, 61, 2), new QPoint(397, 66, 2), new QPoint(394, 70, 2), new QPoint(391, 74, 2), new QPoint(386, 78, 2), new QPoint(382, 81, 2), new QPoint(377, 83, 2), new QPoint(372, 85, 2), new QPoint(367, 87, 2), new QPoint(360, 87, 2), new QPoint(355, 88, 2), new QPoint(349, 87, 2)]),
  new PointCloud("P", [new QPoint(507, 8, 1), new QPoint(507, 87, 1),
    new QPoint(513, 7, 2), new QPoint(528, 7, 2), new QPoint(537, 8, 2), new QPoint(544, 10, 2), new QPoint(550, 12, 2), new QPoint(555, 15, 2), new QPoint(558, 18, 2), new QPoint(560, 22, 2), new QPoint(561, 27, 2), new QPoint(562, 33, 2), new QPoint(561, 37, 2), new QPoint(559, 42, 2), new QPoint(556, 45, 2), new QPoint(550, 48, 2), new QPoint(544, 51, 2), new QPoint(538, 53, 2), new QPoint(532, 54, 2), new QPoint(525, 55, 2), new QPoint(519, 55, 2), new QPoint(513, 55, 2), new QPoint(510, 55, 2)]),
  new PointCloud("X", [new QPoint(30, 146, 1), new QPoint(106, 222, 1),
    new QPoint(30, 225, 2), new QPoint(106, 146, 2)]),
  new PointCloud("H", [new QPoint(188, 137, 1), new QPoint(188, 225, 1),
    new QPoint(188, 180, 2), new QPoint(241, 180, 2),
    new QPoint(241, 137, 3), new QPoint(241, 225, 3)]),
  new PointCloud("I", [new QPoint(371, 149, 1), new QPoint(371, 221, 1),
    new QPoint(341, 149, 2), new QPoint(401, 149, 2),
    new QPoint(341, 221, 3), new QPoint(401, 221, 3)]),
  new PointCloud("exclamation", [new QPoint(526, 142, 1), new QPoint(526, 204, 1),
    new QPoint(526, 221, 2)]),
  new PointCloud("five-point star", [new QPoint(177, 396, 1), new QPoint(223, 299, 1), new QPoint(262, 396, 1), new QPoint(168, 332, 1), new QPoint(278, 332, 1), new QPoint(184, 397, 1)]),
  new PointCloud("null", [new QPoint(382, 310, 1), new QPoint(377, 308, 1), new QPoint(373, 307, 1), new QPoint(366, 307, 1), new QPoint(360, 310, 1), new QPoint(356, 313, 1), new QPoint(353, 316, 1), new QPoint(349, 321, 1), new QPoint(347, 326, 1), new QPoint(344, 331, 1), new QPoint(342, 337, 1), new QPoint(341, 343, 1), new QPoint(341, 350, 1), new QPoint(341, 358, 1), new QPoint(342, 362, 1), new QPoint(344, 366, 1), new QPoint(347, 370, 1), new QPoint(351, 374, 1), new QPoint(356, 379, 1), new QPoint(361, 382, 1), new QPoint(368, 385, 1), new QPoint(374, 387, 1), new QPoint(381, 387, 1), new QPoint(390, 387, 1), new QPoint(397, 385, 1), new QPoint(404, 382, 1), new QPoint(408, 378, 1), new QPoint(412, 373, 1), new QPoint(416, 367, 1), new QPoint(418, 361, 1), new QPoint(419, 353, 1), new QPoint(418, 346, 1), new QPoint(417, 341, 1), new QPoint(416, 336, 1), new QPoint(413, 331, 1), new QPoint(410, 326, 1), new QPoint(404, 320, 1), new QPoint(400, 317, 1), new QPoint(393, 313, 1), new QPoint(392, 312, 1),
    new QPoint(418, 309, 2), new QPoint(337, 390, 2)]),
  new PointCloud("arrowhead", [new QPoint(506, 349, 1), new QPoint(574, 349, 1),
    new QPoint(525, 306, 2), new QPoint(584, 349, 2), new QPoint(525, 388, 2)]),
  new PointCloud("pitchfork", [new QPoint(38, 470, 1), new QPoint(36, 476, 1), new QPoint(36, 482, 1), new QPoint(37, 489, 1), new QPoint(39, 496, 1), new QPoint(42, 500, 1), new QPoint(46, 503, 1), new QPoint(50, 507, 1), new QPoint(56, 509, 1), new QPoint(63, 509, 1), new QPoint(70, 508, 1), new QPoint(75, 506, 1), new QPoint(79, 503, 1), new QPoint(82, 499, 1), new QPoint(85, 493, 1), new QPoint(87, 487, 1), new QPoint(88, 480, 1), new QPoint(88, 474, 1), new QPoint(87, 468, 1),
    new QPoint(62, 464, 2), new QPoint(62, 571, 2)]),
  new PointCloud("six-point star", [new QPoint(177, 554, 1), new QPoint(223, 476, 1), new QPoint(268, 554, 1), new QPoint(183, 554, 1),
    new QPoint(177, 490, 2), new QPoint(223, 568, 2), new QPoint(268, 490, 2), new QPoint(183, 490, 2)]),
  new PointCloud("asterisk", [new QPoint(325, 499, 1), new QPoint(417, 557, 1),
    new QPoint(417, 499, 2), new QPoint(325, 557, 2),
    new QPoint(371, 486, 3), new QPoint(371, 571, 3)]),
  new PointCloud("half-note", [new QPoint(546, 465, 1), new QPoint(546, 531, 1),
    new QPoint(540, 530, 2), new QPoint(536, 529, 2), new QPoint(533, 528, 2), new QPoint(529, 529, 2), new QPoint(524, 530, 2), new QPoint(520, 532, 2), new QPoint(515, 535, 2), new QPoint(511, 539, 2), new QPoint(508, 545, 2), new QPoint(506, 548, 2), new QPoint(506, 554, 2), new QPoint(509, 558, 2), new QPoint(512, 561, 2), new QPoint(517, 564, 2), new QPoint(521, 564, 2), new QPoint(527, 563, 2), new QPoint(531, 560, 2), new QPoint(535, 557, 2), new QPoint(538, 553, 2), new QPoint(542, 548, 2), new QPoint(544, 544, 2), new QPoint(546, 540, 2), new QPoint(546, 536, 2)])];

export const qDollarMultiStrokeRecognizer = new QDollarRecognizer(multiStrokeClouds);

const uniStrokeClouds = [
  new PointCloud({"name":"S","points":[{"x":0.22191175236960237,"y":-0.4609248054842563,"id":1,"intX":625,"intY":276},{"x":0.16477122343991696,"y":-0.4609248054842563,"id":1,"intX":596,"intY":276},{"x":0.10777213739842878,"y":-0.45868713656365007,"id":1,"intX":567,"intY":277},{"x":0.051041847769054405,"y":-0.4520922479614997,"id":1,"intX":538,"intY":280},{"x":-0.0051347942347749476,"y":-0.4424565395612917,"id":1,"intX":509,"intY":285},{"x":-0.060428433106299057,"y":-0.42824106683189395,"id":1,"intX":481,"intY":292},{"x":-0.11487540105994841,"y":-0.4113746590895079,"id":1,"intX":453,"intY":301},{"x":-0.16194560176435746,"y":-0.37942080634350805,"id":1,"intX":429,"intY":317},{"x":-0.19872623023925673,"y":-0.33589613298176835,"id":1,"intX":410,"intY":340},{"x":-0.22356421239609714,"y":-0.2847749281846689,"id":1,"intX":397,"intY":366},{"x":-0.2316671484384985,"y":-0.22826988384661792,"id":1,"intX":393,"intY":395},{"x":-0.2191717916849457,"y":-0.17332520116491024,"id":1,"intX":399,"intY":423},{"x":-0.18638401722844566,"y":-0.12676294906409358,"id":1,"intX":416,"intY":447},{"x":-0.14404935925637202,"y":-0.08867996837241604,"id":1,"intX":438,"intY":466},{"x":-0.09863245775864346,"y":-0.05413179940982815,"id":1,"intX":461,"intY":484},{"x":-0.051129786242207015,"y":-0.022572298028470883,"id":1,"intX":485,"intY":500},{"x":-0.002708913768662835,"y":0.007761616619513578,"id":1,"intX":510,"intY":515},{"x":0.04581995805648553,"y":0.03792065306798259,"id":1,"intX":535,"intY":531},{"x":0.09600718341881853,"y":0.06517098243967834,"id":1,"intX":561,"intY":545},{"x":0.14699822909371352,"y":0.09068797049733446,"id":1,"intX":587,"intY":558},{"x":0.1883977944364592,"y":0.12809073921349778,"id":1,"intX":608,"intY":577},{"x":0.20268692363162227,"y":0.18281516972242562,"id":1,"intX":615,"intY":605},{"x":0.19654046371878275,"y":0.23937686601376862,"id":1,"intX":612,"intY":634},{"x":0.18079746306866207,"y":0.29414784707225916,"id":1,"intX":604,"intY":662},{"x":0.15616319594915679,"y":0.3455944865454844,"id":1,"intX":591,"intY":688},{"x":0.12790133435945522,"y":0.3951490329905373,"id":1,"intX":577,"intY":714},{"x":0.09184607053042343,"y":0.43946374579483904,"id":1,"intX":558,"intY":736},{"x":0.049952802291246545,"y":0.47794700023068803,"id":1,"intX":537,"intY":756},{"x":0.000009724996742704883,"y":0.5056782404587362,"id":1,"intX":512,"intY":770},{"x":-0.053493120152520335,"y":0.5255105710019422,"id":1,"intX":484,"intY":780},{"x":-0.10989635262464212,"y":0.5341451121882045,"id":1,"intX":455,"intY":785},{"x":-0.1668104845728995,"y":0.5390751945157437,"id":1,"intX":426,"intY":787}]}),
  //new PointCloud({"name":"pigtail","points":[{"x":-0.341974929474069,"y":0.30175796927984944,"id":1,"intX":337,"intY":666},{"x":-0.25254602251687286,"y":0.30175796927984944,"id":1,"intX":382,"intY":666},{"x":-0.16502238977885533,"y":0.2855233605477705,"id":1,"intX":427,"intY":658},{"x":-0.08383382108817383,"y":0.24875202087840254,"id":1,"intX":469,"intY":639},{"x":-0.014803632911474685,"y":0.19233578821627217,"id":1,"intX":504,"intY":610},{"x":0.042588255857439195,"y":0.1240626355259391,"id":1,"intX":533,"intY":575},{"x":0.086027041182416,"y":0.046030254000496096,"id":1,"intX":556,"intY":535},{"x":0.11532680494981734,"y":-0.038319951716166534,"id":1,"intX":570,"intY":492},{"x":0.13102449704443542,"y":-0.12631757554228557,"id":1,"intX":579,"intY":447},{"x":0.14518499056112627,"y":-0.21456712066671502,"id":1,"intX":586,"intY":402},{"x":0.14356160911392923,"y":-0.30386325343698306,"id":1,"intX":585,"intY":356},{"x":0.1335092218035165,"y":-0.3925632851122235,"id":1,"intX":580,"intY":311},{"x":0.11105826018913417,"y":-0.47888700999343803,"id":1,"intX":568,"intY":267},{"x":0.05502345198510872,"y":-0.5448751472769319,"id":1,"intX":540,"intY":233},{"x":-0.0320528861200815,"y":-0.5535197124616502,"id":1,"intX":495,"intY":228},{"x":-0.10993933707459749,"y":-0.5118971990547315,"id":1,"intX":455,"intY":250},{"x":-0.17037408446519117,"y":-0.44636742960101383,"id":1,"intX":424,"intY":283},{"x":-0.2129966894704159,"y":-0.36830260198508746,"id":1,"intX":403,"intY":323},{"x":-0.23772307931163844,"y":-0.28264991613286844,"id":1,"intX":390,"intY":367},{"x":-0.24413560264933204,"y":-0.19348752537491265,"id":1,"intX":387,"intY":413},{"x":-0.2335110719123774,"y":-0.10495499911885348,"id":1,"intX":392,"intY":458},{"x":-0.20393389926019645,"y":-0.020629589943598092,"id":1,"intX":407,"intY":501},{"x":-0.16504253424525278,"y":0.059821811926581425,"id":1,"intX":427,"intY":542},{"x":-0.11716008973321693,"y":0.13524397979909686,"id":1,"intX":452,"intY":581},{"x":-0.05896396429028644,"y":0.20301502932433668,"id":1,"intX":481,"intY":615},{"x":0.006193170484624755,"y":0.2641353644721123,"id":1,"intX":515,"intY":647},{"x":0.07696207007451006,"y":0.31869017662352417,"id":1,"intX":551,"intY":675},{"x":0.1513513519281352,"y":0.3681691840184462,"id":1,"intX":589,"intY":700},{"x":0.23094777727112964,"y":0.4087401297198293,"id":1,"intX":630,"intY":721},{"x":0.3164428295533919,"y":0.4342352546498044,"id":1,"intX":673,"intY":734},{"x":0.40491350928732855,"y":0.4464802875383498,"id":1,"intX":719,"intY":740},{"x":0.49389919301598734,"y":0.44245110161679513,"id":1,"intX":764,"intY":738}]}),
  new PointCloud({"name":"vortex","points":[{"x":-0.2135793091707534,"y":-0.032642135610384315,"id":1,"intX":402,"intY":495},{"x":-0.13517837936718147,"y":-0.05623181522099707,"id":1,"intX":442,"intY":483},{"x":-0.06111090134962627,"y":-0.09101500439779125,"id":1,"intX":480,"intY":465},{"x":0.00868131158504104,"y":-0.13388456041283225,"id":1,"intX":516,"intY":443},{"x":0.06863485764394173,"y":-0.18959792973167694,"id":1,"intX":547,"intY":415},{"x":0.11488218105092662,"y":-0.2566735035306721,"id":1,"intX":570,"intY":380},{"x":0.1452653985084153,"y":-0.33250917115941925,"id":1,"intX":586,"intY":341},{"x":0.1344483433711075,"y":-0.41112277142949744,"id":1,"intX":580,"intY":301},{"x":0.0724664179468415,"y":-0.4638621211176983,"id":1,"intX":549,"intY":274},{"x":-0.002744124711286988,"y":-0.4957835269512829,"id":1,"intX":510,"intY":258},{"x":-0.08252980400503279,"y":-0.514050681363128,"id":1,"intX":469,"intY":249},{"x":-0.1631882801120274,"y":-0.5106110983568775,"id":1,"intX":428,"intY":250},{"x":-0.21724519385581387,"y":-0.45130722490542624,"id":1,"intX":400,"intY":281},{"x":-0.23960542842614035,"y":-0.37347472230500434,"id":1,"intX":389,"intY":320},{"x":-0.24895835073404815,"y":-0.2920218012716911,"id":1,"intX":384,"intY":362},{"x":-0.2550214919328823,"y":-0.21025742114321438,"id":1,"intX":381,"intY":404},{"x":-0.2532981059453316,"y":-0.12844502616719738,"id":1,"intX":382,"intY":446},{"x":-0.2389318009935156,"y":-0.04783842930745813,"id":1,"intX":389,"intY":487},{"x":-0.2190402467685037,"y":0.03155802309508926,"id":1,"intX":399,"intY":528},{"x":-0.1967860518864372,"y":0.1104412258277957,"id":1,"intX":411,"intY":568},{"x":-0.16919306428837644,"y":0.1875861426475831,"id":1,"intX":425,"intY":607},{"x":-0.13504785199899538,"y":0.2620022240034986,"id":1,"intX":442,"intY":646},{"x":-0.0995421470571817,"y":0.3354682342617977,"id":1,"intX":461,"intY":683},{"x":-0.04286833985273353,"y":0.3941311773998396,"id":1,"intX":490,"intY":713},{"x":0.025317648554175842,"y":0.43884669730693326,"id":1,"intX":524,"intY":736},{"x":0.10195570993044334,"y":0.4671212772950989,"id":1,"intX":564,"intY":750},{"x":0.1823257608779444,"y":0.48250418211852364,"id":1,"intX":605,"intY":758},{"x":0.26423207074941296,"y":0.48594931863687196,"id":1,"intX":647,"intY":760},{"x":0.3459786150803093,"y":0.481626976067172,"id":1,"intX":688,"intY":758},{"x":0.4261583198438999,"y":0.4654376780058287,"id":1,"intX":729,"intY":750},{"x":0.5043124210345475,"y":0.4408651248009653,"id":1,"intX":769,"intY":737},{"x":0.5792098162788615,"y":0.40779066291525046,"id":1,"intX":808,"intY":720}]}),
  new PointCloud({"name":"vortex","points":[{"x":-0.10768927735019829,"y":0.007724723688758484,"id":1,"intX":456,"intY":515},{"x":-0.022028474369293727,"y":0.058205432426848724,"id":1,"intX":500,"intY":541},{"x":0.07362361972820708,"y":0.08426898373786573,"id":1,"intX":549,"intY":555},{"x":0.1724120578366034,"y":0.08321871952887128,"id":1,"intX":600,"intY":554},{"x":0.2466961127872893,"y":0.02005782305924725,"id":1,"intX":638,"intY":522},{"x":0.30360892300239417,"y":-0.06160364021508069,"id":1,"intX":667,"intY":480},{"x":0.3564042767836516,"y":-0.14595666228548115,"id":1,"intX":694,"intY":437},{"x":0.3796129630012295,"y":-0.24181792999441187,"id":1,"intX":706,"intY":388},{"x":0.36648791179639506,"y":-0.33940485395178455,"id":1,"intX":699,"intY":338},{"x":0.30911971278558303,"y":-0.4188531791920696,"id":1,"intX":670,"intY":297},{"x":0.21788350005179835,"y":-0.4582313379614385,"id":1,"intX":623,"intY":277},{"x":0.1195962525972919,"y":-0.47276629342738985,"id":1,"intX":573,"intY":270},{"x":0.020119290424641334,"y":-0.47633414169302846,"id":1,"intX":522,"intY":268},{"x":-0.07850879405800487,"y":-0.46413143457161865,"id":1,"intX":471,"intY":274},{"x":-0.17466274132644094,"y":-0.4392644336557909,"id":1,"intX":422,"intY":287},{"x":-0.2628289669456624,"y":-0.3936744549038141,"id":1,"intX":377,"intY":310},{"x":-0.33744569099674293,"y":-0.3280532117941578,"id":1,"intX":339,"intY":344},{"x":-0.3913666015437752,"y":-0.24489651823143446,"id":1,"intX":311,"intY":386},{"x":-0.4264036444015039,"y":-0.1519245188179193,"id":1,"intX":293,"intY":434},{"x":-0.43940096580586807,"y":-0.0534937988458698,"id":1,"intX":287,"intY":484},{"x":-0.42368714833851256,"y":0.0439541889434657,"id":1,"intX":295,"intY":534},{"x":-0.37992726640669383,"y":0.13297707533469183,"id":1,"intX":317,"intY":580},{"x":-0.3201129703751092,"y":0.21236930489968087,"id":1,"intX":348,"intY":620},{"x":-0.25107657484295304,"y":0.2839471286988531,"id":1,"intX":383,"intY":657},{"x":-0.17640279791547037,"y":0.34964411476610147,"id":1,"intX":421,"intY":690},{"x":-0.10070644879330176,"y":0.41427680503540987,"id":1,"intX":460,"intY":723},{"x":-0.01902831898180074,"y":0.4708673322455206,"id":1,"intX":502,"intY":752},{"x":0.0743313559769041,"y":0.5050518907798239,"id":1,"intX":550,"intY":770},{"x":0.17186883913695028,"y":0.523220717992107,"id":1,"intX":599,"intY":779},{"x":0.2713884498325888,"y":0.5236658583069715,"id":1,"intX":650,"intY":779},{"x":0.36963022178730187,"y":0.5102572832559764,"id":1,"intX":701,"intY":772},{"x":0.4584931949225024,"y":0.4666990268410982,"id":1,"intX":746,"intY":750}]}),
  //new PointCloud({"name":"heart","points":[{"x":0.02484995173127058,"y":-0.10041475703592906,"id":1,"intX":524,"intY":460},{"x":-0.007112161783926707,"y":-0.2023161371682997,"id":1,"intX":508,"intY":408},{"x":-0.07036267569406457,"y":-0.28855893900384655,"id":1,"intX":476,"intY":364},{"x":-0.15305192664096945,"y":-0.3563755976407982,"id":1,"intX":433,"intY":329},{"x":-0.2567984272593084,"y":-0.3754472473807544,"id":1,"intX":380,"intY":319},{"x":-0.35117797225719827,"y":-0.32793141138789894,"id":1,"intX":332,"intY":344},{"x":-0.42877374438026333,"y":-0.25369182493249576,"id":1,"intX":292,"intY":382},{"x":-0.49256427067301206,"y":-0.16745013139380116,"id":1,"intX":260,"intY":426},{"x":-0.5270969865114233,"y":-0.06660026494707133,"id":1,"intX":242,"intY":477},{"x":-0.5130475195169321,"y":0.039603147635557834,"id":1,"intX":249,"intY":532},{"x":-0.46741020142307865,"y":0.13623579353491977,"id":1,"intX":272,"intY":581},{"x":-0.40207449332145057,"y":0.22175472024665266,"id":1,"intX":306,"intY":625},{"x":-0.335385290140281,"y":0.3060693347339293,"id":1,"intX":340,"intY":668},{"x":-0.25977343503792444,"y":0.38247605429621845,"id":1,"intX":379,"intY":707},{"x":-0.1732505433945461,"y":0.44583523587218465,"id":1,"intX":423,"intY":740},{"x":-0.07347495973604207,"y":0.4849712826262679,"id":1,"intX":474,"intY":760},{"x":0.03244127409103281,"y":0.5013525955425455,"id":1,"intX":528,"intY":768},{"x":0.13727593577710195,"y":0.48255717607253856,"id":1,"intX":582,"intY":758},{"x":0.23215822700344613,"y":0.4333132011977495,"id":1,"intX":630,"intY":733},{"x":0.31041684109514944,"y":0.359850492603102,"id":1,"intX":670,"intY":696},{"x":0.3724518747346919,"y":0.272631083030645,"id":1,"intX":702,"intY":651},{"x":0.4156413890276085,"y":0.1744990163102741,"id":1,"intX":724,"intY":601},{"x":0.4360992039047258,"y":0.06887568737876909,"id":1,"intX":735,"intY":547},{"x":0.4605106931843329,"y":-0.03569457487908012,"id":1,"intX":747,"intY":493},{"x":0.47290301348857666,"y":-0.14250425364346167,"id":1,"intX":753,"intY":439},{"x":0.4650530241199454,"y":-0.24962753042055874,"id":1,"intX":749,"intY":384},{"x":0.41231931497808805,"y":-0.340640713094073,"id":1,"intX":722,"intY":337},{"x":0.31024061997543806,"y":-0.3717919701645152,"id":1,"intX":670,"intY":321},{"x":0.203749198017795,"y":-0.3642976262499826,"id":1,"intX":616,"intY":325},{"x":0.10633892318024196,"y":-0.32073544255721176,"id":1,"intX":566,"intY":347},{"x":0.06008050200620074,"y":-0.22665757602405823,"id":1,"intX":542,"intY":396},{"x":0.05882462145477574,"y":-0.11928882315751799,"id":1,"intX":542,"intY":450}]}),
  new PointCloud({"name":"w","points":[{"x":-0.5443671204869809,"y":-0.20578416473237326,"id":1,"intX":233,"intY":406},{"x":-0.49202228351372307,"y":-0.16177173669703454,"id":1,"intX":260,"intY":429},{"x":-0.4480187666813268,"y":-0.10932136335896572,"id":1,"intX":282,"intY":456},{"x":-0.4122390070383811,"y":-0.05108939894916348,"id":1,"intX":301,"intY":485},{"x":-0.3814978110444399,"y":0.010025903255986235,"id":1,"intX":316,"intY":517},{"x":-0.3531445183484393,"y":0.0723979009824619,"id":1,"intX":331,"intY":549},{"x":-0.3248137498945266,"y":0.13477312183950968,"id":1,"intX":345,"intY":580},{"x":-0.29123093358012886,"y":0.19436769212534066,"id":1,"intX":363,"intY":611},{"x":-0.2380821602582588,"y":0.2176781946002529,"id":1,"intX":390,"intY":623},{"x":-0.18479174235116652,"y":0.1752659249809203,"id":1,"intX":417,"intY":601},{"x":-0.14315529479274103,"y":0.12088190082762973,"id":1,"intX":438,"intY":573},{"x":-0.10446513161769794,"y":0.06437484622118461,"id":1,"intX":458,"intY":544},{"x":-0.06798090076348845,"y":0.0067102523262518865,"id":1,"intX":477,"intY":515},{"x":-0.03208972872082361,"y":-0.05158558099390656,"id":1,"intX":495,"intY":485},{"x":0.003140623415907262,"y":-0.11034338832831539,"id":1,"intX":513,"intY":455},{"x":0.03955497580272305,"y":-0.16826910876536058,"id":1,"intX":532,"intY":425},{"x":0.07851333409382955,"y":-0.20505728041933532,"id":1,"intX":552,"intY":407},{"x":0.11014740868389705,"y":-0.14565141174729995,"id":1,"intX":568,"intY":437},{"x":0.1255494930864791,"y":-0.07890384469847378,"id":1,"intX":576,"intY":471},{"x":0.13702294476963062,"y":-0.011346433014553098,"id":1,"intX":582,"intY":506},{"x":0.14817006138925082,"y":0.056248273136997484,"id":1,"intX":587,"intY":540},{"x":0.1592201577900807,"y":0.12384485622067676,"id":1,"intX":593,"intY":575},{"x":0.1740589045043771,"y":0.19058824114582917,"id":1,"intX":601,"intY":609},{"x":0.20376466328186593,"y":0.2293697837740486,"id":1,"intX":616,"intY":629},{"x":0.24732389118227172,"y":0.17684945455140477,"id":1,"intX":638,"intY":602},{"x":0.2814134205369555,"y":0.11742128940192342,"id":1,"intX":655,"intY":572},{"x":0.31208766938389254,"y":0.05612409683771874,"id":1,"intX":671,"intY":540},{"x":0.34234722349427715,"y":-0.00508107015932216,"id":1,"intX":687,"intY":509},{"x":0.3718442264767622,"y":-0.06693352743614345,"id":1,"intX":702,"intY":477},{"x":0.4001029299016293,"y":-0.1293218583337869,"id":1,"intX":716,"intY":445},{"x":0.4280043417852737,"y":-0.1918796625305284,"id":1,"intX":730,"intY":413},{"x":0.4556328795130191,"y":-0.2545819020635743,"id":1,"intX":745,"intY":381}]}),
  new PointCloud({"name":"lighting","points":[{"x":0.10429742639071932,"y":-0.4468578895952415,"id":1,"intX":565,"intY":283},{"x":0.05172835118409347,"y":-0.40806668821740505,"id":1,"intX":538,"intY":303},{"x":0.002414131009006004,"y":-0.36535219740284886,"id":1,"intX":513,"intY":325},{"x":-0.04868830913329075,"y":-0.324609171291456,"id":1,"intX":487,"intY":345},{"x":-0.09933716379040425,"y":-0.2834025852473966,"id":1,"intX":461,"intY":367},{"x":-0.1491154651181841,"y":-0.24114806797830068,"id":1,"intX":435,"intY":388},{"x":-0.2003790781016848,"y":-0.20068235503146092,"id":1,"intX":409,"intY":409},{"x":-0.2526027774487231,"y":-0.16135981245167236,"id":1,"intX":382,"intY":429},{"x":-0.3055773373203147,"y":-0.12312764305652707,"id":1,"intX":355,"intY":449},{"x":-0.35523124866179334,"y":-0.08062366650571828,"id":1,"intX":330,"intY":470},{"x":-0.34432032066451046,"y":-0.056141989900386824,"id":1,"intX":335,"intY":483},{"x":-0.27935920802630865,"y":-0.048693538137968784,"id":1,"intX":369,"intY":487},{"x":-0.2142381888686501,"y":-0.042857506646758414,"id":1,"intX":402,"intY":490},{"x":-0.1488973291644021,"y":-0.040564736463586326,"id":1,"intX":435,"intY":491},{"x":-0.0835142538816317,"y":-0.03988162394052153,"id":1,"intX":469,"intY":491},{"x":-0.018127394154398124,"y":-0.03968868295398342,"id":1,"intX":502,"intY":491},{"x":0.047259733637238455,"y":-0.03962133723505512,"id":1,"intX":536,"intY":491},{"x":0.11260950596758362,"y":-0.03791386134204833,"id":1,"intX":569,"intY":492},{"x":0.17793773635338905,"y":-0.03513892636543403,"id":1,"intX":603,"intY":494},{"x":0.24328109639623507,"y":-0.03277221056708518,"id":1,"intX":636,"intY":495},{"x":0.30866062711238507,"y":-0.031826236441930555,"id":1,"intX":669,"intY":495},{"x":0.32072796798300285,"y":0.014334044191958717,"id":1,"intX":676,"intY":519},{"x":0.2854300203300505,"y":0.06886361077178232,"id":1,"intX":657,"intY":547},{"x":0.24740902046984792,"y":0.12203146052538999,"id":1,"intX":638,"intY":574},{"x":0.20504966086411924,"y":0.17177239326845511,"id":1,"intX":616,"intY":599},{"x":0.1664895692574211,"y":0.22457512406081187,"id":1,"intX":597,"intY":626},{"x":0.12635307964050713,"y":0.27615302210689957,"id":1,"intX":576,"intY":653},{"x":0.08902574662388735,"y":0.32977567576841976,"id":1,"intX":557,"intY":680},{"x":0.05370257431653763,"y":0.38464491107058546,"id":1,"intX":539,"intY":708},{"x":0.017374971222142488,"y":0.43896912876879496,"id":1,"intX":520,"intY":736},{"x":-0.014368551661878393,"y":0.49606924583492745,"id":1,"intX":504,"intY":765},{"x":-0.04599459276199175,"y":0.5531421104047585,"id":1,"intX":488,"intY":794}]}),
  new PointCloud({"name":"o","points":[{"x":-0.03630346973311166,"y":-0.3901821261631569,"id":1,"intX":493,"intY":312},{"x":-0.13972409762593774,"y":-0.3989479693229333,"id":1,"intX":440,"intY":307},{"x":-0.23915524651778022,"y":-0.3773493409083348,"id":1,"intX":389,"intY":318},{"x":-0.3211549000098196,"y":-0.3147612513814549,"id":1,"intX":347,"intY":350},{"x":-0.38258944868686195,"y":-0.23154158346238496,"id":1,"intX":316,"intY":393},{"x":-0.42386519635226716,"y":-0.13652909726707746,"id":1,"intX":295,"intY":442},{"x":-0.4467004473549514,"y":-0.03533347304301826,"id":1,"intX":283,"intY":493},{"x":-0.4579183443171638,"y":0.06783531261924308,"id":1,"intX":277,"intY":546},{"x":-0.447215387372975,"y":0.1708202995791417,"id":1,"intX":283,"intY":599},{"x":-0.4106154467074432,"y":0.2676416681776108,"id":1,"intX":301,"intY":648},{"x":-0.35342825359585667,"y":0.35376223713378274,"id":1,"intX":331,"intY":692},{"x":-0.27210642504087174,"y":0.4177866475683071,"id":1,"intX":372,"intY":725},{"x":-0.1775767876743553,"y":0.45988218705974915,"id":1,"intX":421,"intY":747},{"x":-0.07612710051385085,"y":0.48141586848601314,"id":1,"intX":473,"intY":758},{"x":0.02715103975703348,"y":0.48807819767608684,"id":1,"intX":525,"intY":761},{"x":0.12968999457761493,"y":0.47281327243174465,"id":1,"intX":578,"intY":753},{"x":0.22686242761656922,"y":0.43670996691825403,"id":1,"intX":628,"intY":735},{"x":0.31473225562788115,"y":0.3821167810705479,"id":1,"intX":672,"intY":707},{"x":0.3917772669455188,"y":0.3126437846708999,"id":1,"intX":712,"intY":671},{"x":0.45782489769974716,"y":0.23267809961104735,"id":1,"intX":746,"intY":631},{"x":0.508772191645755,"y":0.14247496129346138,"id":1,"intX":772,"intY":584},{"x":0.5420816556828363,"y":0.04429091485069303,"id":1,"intX":789,"intY":534},{"x":0.5392836846934344,"y":-0.058536817610686354,"id":1,"intX":787,"intY":482},{"x":0.4908765972273778,"y":-0.14912250873061228,"id":1,"intX":763,"intY":435},{"x":0.410636834779819,"y":-0.21412530249166115,"id":1,"intX":722,"intY":402},{"x":0.3190858645378581,"y":-0.26305707377404475,"id":1,"intX":675,"intY":377},{"x":0.22264545259230867,"y":-0.30127979627366397,"id":1,"intX":625,"intY":357},{"x":0.12415103444525749,"y":-0.33403676152742545,"id":1,"intX":575,"intY":341},{"x":0.023686329996081223,"y":-0.3601777646064052,"id":1,"intX":524,"intY":327},{"x":-0.07838207146256604,"y":-0.37912554223374495,"id":1,"intX":471,"intY":318},{"x":-0.18140836643082908,"y":-0.39191727015075234,"id":1,"intX":419,"intY":311},{"x":-0.2849865384284506,"y":-0.3949265201992268,"id":1,"intX":366,"intY":309}]}),
  new PointCloud({"name":"<","points":[{"x":0.47567950628003997,"y":-0.3935330906512888,"id":1,"intX":755,"intY":310},{"x":0.4093520915650084,"y":-0.37069017108590546,"id":1,"intX":721,"intY":322},{"x":0.34266679825054946,"y":-0.3488031946073864,"id":1,"intX":687,"intY":333},{"x":0.27702648930548834,"y":-0.3242212816863747,"id":1,"intX":653,"intY":346},{"x":0.21226920174817965,"y":-0.2973400170990993,"id":1,"intX":620,"intY":359},{"x":0.14646701557458264,"y":-0.2731337106899863,"id":1,"intX":586,"intY":372},{"x":0.080753269050034,"y":-0.24868910221373483,"id":1,"intX":553,"intY":384},{"x":0.016826655137052393,"y":-0.219763086419991,"id":1,"intX":520,"intY":399},{"x":-0.04822501839579674,"y":-0.193470437932914,"id":1,"intX":487,"intY":413},{"x":-0.1125515250318666,"y":-0.16574378991552718,"id":1,"intX":454,"intY":427},{"x":-0.17661074647900055,"y":-0.1371790025810356,"id":1,"intX":421,"intY":441},{"x":-0.24207497051228127,"y":-0.11232088093404136,"id":1,"intX":388,"intY":454},{"x":-0.30579297292981933,"y":-0.08297472190441546,"id":1,"intX":355,"intY":469},{"x":-0.3687761200511436,"y":-0.05230332831066886,"id":1,"intX":323,"intY":485},{"x":-0.43206668580378715,"y":-0.022297738800675704,"id":1,"intX":290,"intY":500},{"x":-0.49495485758655444,"y":0.008622473500483618,"id":1,"intX":258,"intY":516},{"x":-0.48619678032189256,"y":0.040429938491721995,"id":1,"intX":263,"intY":532},{"x":-0.4192445919466576,"y":0.06142074949447829,"id":1,"intX":297,"intY":543},{"x":-0.35114458712735325,"y":0.07842690182806822,"id":1,"intX":332,"intY":552},{"x":-0.2836838196829691,"y":0.09729141315307166,"id":1,"intX":366,"intY":561},{"x":-0.21578447514865096,"y":0.11473947491249975,"id":1,"intX":401,"intY":570},{"x":-0.14955042998477636,"y":0.13774592174914063,"id":1,"intX":435,"intY":582},{"x":-0.08298684449707572,"y":0.1599239110893475,"id":1,"intX":469,"intY":593},{"x":-0.017112295583665338,"y":0.18406636210300303,"id":1,"intX":503,"intY":606},{"x":0.048416257231515436,"y":0.20914961243734137,"id":1,"intX":536,"intY":618},{"x":0.11430739253568245,"y":0.23326344871825394,"id":1,"intX":570,"intY":631},{"x":0.18047469849202957,"y":0.25650787158820226,"id":1,"intX":604,"intY":643},{"x":0.24744284464537036,"y":0.2774235325858542,"id":1,"intX":638,"intY":653},{"x":0.3122121721228336,"y":0.30412627303204126,"id":1,"intX":671,"intY":667},{"x":0.3765982119677189,"y":0.33191454356871447,"id":1,"intX":704,"intY":681},{"x":0.44121897476376026,"y":0.3592115609335151,"id":1,"intX":737,"intY":695},{"x":0.5050451424134456,"y":0.38819956564730757,"id":1,"intX":770,"intY":710}]}),
  new PointCloud({"name":">","points":[{"x":-0.46137834604890676,"y":-0.4747999251751398,"id":1,"intX":276,"intY":269},{"x":-0.4042742466812586,"y":-0.4499959516263797,"id":1,"intX":305,"intY":281},{"x":-0.347858950521032,"y":-0.4235713037803577,"id":1,"intX":334,"intY":295},{"x":-0.2913740371392953,"y":-0.39746248566082837,"id":1,"intX":362,"intY":308},{"x":-0.23536593438369469,"y":-0.3702283461737923,"id":1,"intX":391,"intY":322},{"x":-0.17791419114382667,"y":-0.34613951198206994,"id":1,"intX":420,"intY":334},{"x":-0.12150961246169167,"y":-0.3198347415730754,"id":1,"intX":449,"intY":348},{"x":-0.06600681042082934,"y":-0.29158824893058566,"id":1,"intX":478,"intY":362},{"x":-0.010792532223707962,"y":-0.2628575327742148,"id":1,"intX":506,"intY":377},{"x":0.045226493154159664,"y":-0.23563695867287593,"id":1,"intX":535,"intY":391},{"x":0.09994898431349636,"y":-0.20587609059424095,"id":1,"intX":563,"intY":406},{"x":0.15393291653137547,"y":-0.1748229341777247,"id":1,"intX":590,"intY":422},{"x":0.20716600500522137,"y":-0.1425147153292166,"id":1,"intX":617,"intY":439},{"x":0.2611068171525111,"y":-0.11141945405839715,"id":1,"intX":645,"intY":455},{"x":0.3132988880103787,"y":-0.07751210783544044,"id":1,"intX":672,"intY":472},{"x":0.36604832436545526,"y":-0.044422505488004416,"id":1,"intX":699,"intY":489},{"x":0.4101025075597648,"y":-0.004171950224280907,"id":1,"intX":721,"intY":509},{"x":0.38052563913060694,"y":0.050393713348165003,"id":1,"intX":706,"intY":537},{"x":0.3349213551932036,"y":0.09241529485153677,"id":1,"intX":683,"intY":559},{"x":0.2827886132397413,"y":0.12649283734096461,"id":1,"intX":656,"intY":576},{"x":0.22963434148829504,"y":0.15898616635271412,"id":1,"intX":629,"intY":593},{"x":0.1758076549943755,"y":0.19020872241153053,"id":1,"intX":601,"intY":609},{"x":0.12154723328287736,"y":0.22075826978147406,"id":1,"intX":574,"intY":624},{"x":0.06914981214277954,"y":0.25431257749016023,"id":1,"intX":547,"intY":642},{"x":0.01564093592708743,"y":0.28604311272242156,"id":1,"intX":520,"intY":658},{"x":-0.03794000617087545,"y":0.3177534451662961,"id":1,"intX":492,"intY":674},{"x":-0.08985918007305604,"y":0.3521018076884215,"id":1,"intX":466,"intY":692},{"x":-0.14211259355521977,"y":0.3858578339200376,"id":1,"intX":439,"intY":709},{"x":-0.19246599037019446,"y":0.42254466175380867,"id":1,"intX":413,"intY":728},{"x":-0.24431706203649609,"y":0.45701750679300435,"id":1,"intX":387,"intY":745},{"x":-0.2952416241238405,"y":0.49276873961123024,"id":1,"intX":360,"intY":764},{"x":-0.348435404137405,"y":0.5252000748248602,"id":1,"intX":333,"intY":780}]}),
  new PointCloud({"name":"^","points":[{"x":-0.3226173767243645,"y":0.28559150060548205,"id":1,"intX":346,"intY":658},{"x":-0.304042705934108,"y":0.22841080499331873,"id":1,"intX":356,"intY":628},{"x":-0.2853800678136238,"y":0.17117925870260559,"id":1,"intX":366,"intY":599},{"x":-0.26505562741411576,"y":0.11452301673924609,"id":1,"intX":376,"intY":570},{"x":-0.24571069562881628,"y":0.0575297367205454,"id":1,"intX":386,"intY":541},{"x":-0.22361807982661358,"y":0.0015334625504568322,"id":1,"intX":397,"intY":512},{"x":-0.20115860918533598,"y":-0.05431365443079861,"id":1,"intX":409,"intY":484},{"x":-0.17957398276193892,"y":-0.11049727219021854,"id":1,"intX":420,"intY":455},{"x":-0.1556179927843396,"y":-0.165720978940136,"id":1,"intX":432,"intY":427},{"x":-0.13036039317549958,"y":-0.220358562260271,"id":1,"intX":445,"intY":399},{"x":-0.10386192658382978,"y":-0.2744102230844906,"id":1,"intX":458,"intY":371},{"x":-0.076213535321663,"y":-0.3278699262657697,"id":1,"intX":473,"intY":344},{"x":-0.04754375580257969,"y":-0.38080103058584847,"id":1,"intX":487,"intY":317},{"x":-0.01698649736865182,"y":-0.432638295274461,"id":1,"intX":503,"intY":290},{"x":0.02854162595124904,"y":-0.4321151031128028,"id":1,"intX":526,"intY":290},{"x":0.05929266278393691,"y":-0.38084191284215424,"id":1,"intX":542,"intY":317},{"x":0.08057130039102633,"y":-0.3245648912671193,"id":1,"intX":553,"intY":345},{"x":0.09774576213587421,"y":-0.26688732953716127,"id":1,"intX":561,"intY":375},{"x":0.11058809669618103,"y":-0.20811221697443272,"id":1,"intX":568,"intY":405},{"x":0.12062760814328066,"y":-0.14877830556803534,"id":1,"intX":573,"intY":435},{"x":0.12933825017736672,"y":-0.08921433798622075,"id":1,"intX":578,"intY":466},{"x":0.13820548641774277,"y":-0.029673389021396435,"id":1,"intX":582,"intY":496},{"x":0.14619591067885268,"y":0.029991354985861085,"id":1,"intX":586,"intY":527},{"x":0.15425067217543792,"y":0.08964761752296152,"id":1,"intX":590,"intY":557},{"x":0.16223565865531497,"y":0.14931316649104914,"id":1,"intX":594,"intY":588},{"x":0.16983158779349117,"y":0.20902846258993496,"id":1,"intX":598,"intY":618},{"x":0.1765781164249844,"y":0.268843600246163,"id":1,"intX":602,"intY":649},{"x":0.18244222362743945,"y":0.32875019361251795,"id":1,"intX":605,"intY":680},{"x":0.18981536418532075,"y":0.3884923841745022,"id":1,"intX":609,"intY":710},{"x":0.1958753880673706,"y":0.44838231804632406,"id":1,"intX":612,"intY":741},{"x":0.20242618348820174,"y":0.5082188466348077,"id":1,"intX":615,"intY":771},{"x":0.2131793485324075,"y":0.567361704725539,"id":1,"intX":621,"intY":802}]}),
  new PointCloud({"name":"v","points":[{"x":-0.5009400511023452,"y":-0.29970272273415777,"id":1,"intX":255,"intY":358},{"x":-0.4718632871982435,"y":-0.24845530833974325,"id":1,"intX":270,"intY":384},{"x":-0.4399998580458186,"y":-0.19894643611445617,"id":1,"intX":286,"intY":410},{"x":-0.4103502780748789,"y":-0.14803003921054547,"id":1,"intX":302,"intY":436},{"x":-0.38332855971313207,"y":-0.09565708437969234,"id":1,"intX":315,"intY":463},{"x":-0.35577571229354465,"y":-0.043561613917462605,"id":1,"intX":330,"intY":489},{"x":-0.3238451199731597,"y":0.005957693403913167,"id":1,"intX":346,"intY":515},{"x":-0.29281818328445514,"y":0.056060692446316784,"id":1,"intX":362,"intY":540},{"x":-0.2650747957543107,"y":0.10805143014002722,"id":1,"intX":376,"intY":567},{"x":-0.23613068258073977,"y":0.15934341302640592,"id":1,"intX":391,"intY":593},{"x":-0.20399400609197704,"y":0.20871116959350883,"id":1,"intX":407,"intY":618},{"x":-0.17303416610812505,"y":0.2588523768421361,"id":1,"intX":423,"intY":644},{"x":-0.1424883590741602,"y":0.30912720013149547,"id":1,"intX":439,"intY":670},{"x":-0.11174925825459575,"y":0.35935607743691195,"id":1,"intX":454,"intY":695},{"x":-0.06100694934067957,"y":0.3675454356943371,"id":1,"intX":480,"intY":699},{"x":-0.010418009556246222,"y":0.33732048071904414,"id":1,"intX":506,"intY":684},{"x":0.033602176091892866,"y":0.29852347766049686,"id":1,"intX":529,"intY":664},{"x":0.07293711695326344,"y":0.25467047299681705,"id":1,"intX":549,"intY":642},{"x":0.1085546610652588,"y":0.20775115452984655,"id":1,"intX":567,"intY":618},{"x":0.14117648883100165,"y":0.15867618167048642,"id":1,"intX":584,"intY":593},{"x":0.17171952525620804,"y":0.10827556077287598,"id":1,"intX":599,"intY":567},{"x":0.202202294916218,"y":0.05783847000481995,"id":1,"intX":615,"intY":541},{"x":0.23281673096135602,"y":0.007481278714156936,"id":1,"intX":631,"intY":515},{"x":0.26199541748480204,"y":-0.04369566372268663,"id":1,"intX":646,"intY":489},{"x":0.29074858810855786,"y":-0.09511776542294681,"id":1,"intX":660,"intY":463},{"x":0.32114069209994167,"y":-0.14560841200559987,"id":1,"intX":676,"intY":437},{"x":0.35096017593877193,"y":-0.1964396114784115,"id":1,"intX":691,"intY":411},{"x":0.38125461193777066,"y":-0.24697606244850806,"id":1,"intX":707,"intY":385},{"x":0.4089669487777857,"y":-0.2989818122377297,"id":1,"intX":721,"intY":359},{"x":0.4378889951558328,"y":-0.3503289958961839,"id":1,"intX":735,"intY":332},{"x":0.4677929039700972,"y":-0.4010970233407504,"id":1,"intX":751,"intY":306},{"x":0.4990599488976548,"y":-0.45094401453472094,"id":1,"intX":767,"intY":281}]}),
  new PointCloud({"name":"-","points":[{"x":-0.5003931987865837,"y":-0.00806955718373115,"id":1,"intX":256,"intY":507},{"x":-0.46808010868761285,"y":-0.00806955718373115,"id":1,"intX":272,"intY":507},{"x":-0.435767018588642,"y":-0.00806955718373115,"id":1,"intX":289,"intY":507},{"x":-0.4034539284896711,"y":-0.00806955718373115,"id":1,"intX":305,"intY":507},{"x":-0.3711408383907002,"y":-0.00806955718373115,"id":1,"intX":322,"intY":507},{"x":-0.33882774829172935,"y":-0.00806955718373115,"id":1,"intX":338,"intY":507},{"x":-0.30651465819275847,"y":-0.00806955718373115,"id":1,"intX":355,"intY":507},{"x":-0.2742015680937876,"y":-0.00806955718373115,"id":1,"intX":371,"intY":507},{"x":-0.24188847799481672,"y":-0.00806955718373115,"id":1,"intX":388,"intY":507},{"x":-0.20957538789584584,"y":-0.00806955718373115,"id":1,"intX":404,"intY":507},{"x":-0.17726229779687497,"y":-0.00806955718373115,"id":1,"intX":421,"intY":507},{"x":-0.1449492076979041,"y":-0.00806955718373115,"id":1,"intX":437,"intY":507},{"x":-0.11263611759893322,"y":-0.00806955718373115,"id":1,"intX":454,"intY":507},{"x":-0.08032302749996251,"y":-0.00806955718373115,"id":1,"intX":470,"intY":507},{"x":-0.048033759287930744,"y":-0.007399594806237208,"id":1,"intX":487,"intY":508},{"x":-0.01576294553431018,"y":-0.005780366414103292,"id":1,"intX":503,"intY":509},{"x":0.016538753854661414,"y":-0.00493829805497586,"id":1,"intX":520,"intY":509},{"x":0.04883737003188371,"y":-0.004239909023911989,"id":1,"intX":536,"intY":509},{"x":0.08104416722050223,"y":-0.001724934002333341,"id":1,"intX":553,"intY":511},{"x":0.11303550091805503,"y":0.0024256783062006834,"id":1,"intX":569,"intY":513},{"x":0.14499243846808507,"y":0.0070857352088582355,"id":1,"intX":586,"intY":515},{"x":0.17720919594154827,"y":0.009530118872125012,"id":1,"intX":602,"intY":516},{"x":0.20949544926811114,"y":0.01081929486764572,"id":1,"intX":619,"intY":517},{"x":0.24180100000251026,"y":0.011501220015846959,"id":1,"intX":635,"intY":517},{"x":0.27407791651359825,"y":0.012622941892424046,"id":1,"intX":652,"intY":518},{"x":0.3063399685770348,"y":0.014399201039010195,"id":1,"intX":668,"intY":519},{"x":0.3386397593304955,"y":0.015307801204118676,"id":1,"intX":685,"intY":519},{"x":0.37093363020901415,"y":0.015176948186889746,"id":1,"intX":701,"intY":519},{"x":0.4032176099140181,"y":0.01384208453352129,"id":1,"intX":718,"intY":519},{"x":0.4354697111715533,"y":0.011887743821511677,"id":1,"intX":734,"intY":518},{"x":0.46757101619357655,"y":0.008341191388328159,"id":1,"intX":751,"intY":516},{"x":0.4996068012134163,"y":0.004116943537317369,"id":1,"intX":767,"intY":514}]}),
  new PointCloud({"name":"|","points":[{"x":0.009789890515997865,"y":-0.5004343229318158,"id":1,"intX":517,"intY":256},{"x":0.01374010839766441,"y":-0.46830906076080236,"id":1,"intX":519,"intY":272},{"x":0.015989170153768266,"y":-0.43601609561812205,"id":1,"intX":520,"intY":288},{"x":0.017249646604927754,"y":-0.4036680617283469,"id":1,"intX":520,"intY":305},{"x":0.017931218655514898,"y":-0.3713019598150326,"id":1,"intX":521,"intY":322},{"x":0.018325687749881796,"y":-0.33893111055168823,"id":1,"intX":521,"intY":338},{"x":0.01855309591061647,"y":-0.30655861292956643,"id":1,"intX":521,"intY":355},{"x":0.018682194887142456,"y":-0.2741855578567858,"id":1,"intX":521,"intY":371},{"x":0.018751463294559338,"y":-0.2418123123812655,"id":1,"intX":521,"intY":388},{"x":0.018792309249677633,"y":-0.20943901864509662,"id":1,"intX":521,"intY":404},{"x":0.01881474839303636,"y":-0.1770657062013979,"id":1,"intX":521,"intY":421},{"x":0.01882751028940747,"y":-0.1446923882846095,"id":1,"intX":521,"intY":437},{"x":0.018835731897553117,"y":-0.11231906886233622,"id":1,"intX":521,"intY":454},{"x":0.018179032801918203,"y":-0.07996726621768241,"id":1,"intX":521,"intY":471},{"x":0.015098738581917494,"y":-0.047747243320025834,"id":1,"intX":519,"intY":487},{"x":0.011430754409027986,"y":-0.015590660386482935,"id":1,"intX":517,"intY":504},{"x":0.00740335809153192,"y":0.01652423039089035,"id":1,"intX":515,"intY":520},{"x":0.0044365522121779105,"y":0.04875752347395623,"id":1,"intX":514,"intY":536},{"x":0.0008666873083610985,"y":0.0809271920848319,"id":1,"intX":512,"intY":553},{"x":-0.0023695347552084023,"y":0.11313047007210508,"id":1,"intX":510,"intY":569},{"x":-0.006926203982292781,"y":0.14517580889991588,"id":1,"intX":508,"intY":586},{"x":-0.009346218413094909,"y":0.1774566279196731,"id":1,"intX":507,"intY":602},{"x":-0.011917160944586547,"y":0.2097161616532024,"id":1,"intX":505,"intY":619},{"x":-0.015268005408439315,"y":0.24191022999633394,"id":1,"intX":504,"intY":635},{"x":-0.01817358688262771,"y":0.2741500102470307,"id":1,"intX":502,"intY":652},{"x":-0.019826348504853517,"y":0.30647991625001936,"id":1,"intX":501,"intY":668},{"x":-0.024328337744564752,"y":0.338527296092466,"id":1,"intX":499,"intY":685},{"x":-0.028038920227641224,"y":0.3706832402272575,"id":1,"intX":497,"intY":701},{"x":-0.03208130140933554,"y":0.4027950191096499,"id":1,"intX":495,"intY":718},{"x":-0.03556925131017189,"y":0.43497285683059317,"id":1,"intX":493,"intY":734},{"x":-0.03783395268662856,"y":0.46726618617494464,"id":1,"intX":492,"intY":751},{"x":-0.040019077135236975,"y":0.4995656770681842,"id":1,"intX":491,"intY":767}]}),
]
export const qDollarUniStrokeRecognizer = new QDollarRecognizer(uniStrokeClouds);
