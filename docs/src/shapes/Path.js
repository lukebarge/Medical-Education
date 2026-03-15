import { Shape } from './Shape.js';

/**
 * An animated polyline or bezier path defined by a series of points.
 *
 * @example
 * const path = new Path({
 *   points: [[0,0],[100,50],[200,0]],
 *   stroke: 'blue',
 *   lineWidth: 2,
 *   smooth: true
 * });
 */
export class Path extends Shape {
  /**
   * @param {object} options
   * @param {Array<[number,number]>} [options.points=[]]
   * @param {string} [options.stroke]
   * @param {string} [options.fill]
   * @param {number} [options.lineWidth=1]
   * @param {boolean} [options.closed=false]
   * @param {boolean} [options.smooth=false] - use quadratic bezier smoothing
   * @param {number[]} [options.lineDash]
   */
  constructor(options = {}) {
    super(options);
    this.points = options.points || [];
    this.stroke = options.stroke || null;
    this.fill = options.fill || null;
    this.lineWidth = options.lineWidth !== undefined ? options.lineWidth : 1;
    this.closed = options.closed || false;
    this.smooth = options.smooth || false;
    this.lineDash = options.lineDash || [];
  }

  _render(ctx) {
    if (this.points.length < 2) return;

    ctx.beginPath();
    ctx.setLineDash(this.lineDash);
    ctx.moveTo(this.points[0][0], this.points[0][1]);

    if (this.smooth) {
      for (let i = 1; i < this.points.length - 1; i++) {
        const mx = (this.points[i][0] + this.points[i + 1][0]) / 2;
        const my = (this.points[i][1] + this.points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(this.points[i][0], this.points[i][1], mx, my);
      }
      const last = this.points[this.points.length - 1];
      ctx.lineTo(last[0], last[1]);
    } else {
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i][0], this.points[i][1]);
      }
    }

    if (this.closed) ctx.closePath();

    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.lineWidth;
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }
}
