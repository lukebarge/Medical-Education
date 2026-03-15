import { Shape } from './Shape.js';

/**
 * An animated rectangle, optionally with rounded corners.
 *
 * @example
 * const r = new Rect({ x: 50, y: 50, width: 200, height: 100, fill: '#eef', radius: 8 });
 */
export class Rect extends Shape {
  /**
   * @param {object} options
   * @param {number} [options.width=50]
   * @param {number} [options.height=30]
   * @param {string} [options.fill]
   * @param {string} [options.stroke]
   * @param {number} [options.lineWidth=1]
   * @param {number} [options.radius=0] - corner radius
   */
  constructor(options = {}) {
    super(options);
    this.width = options.width !== undefined ? options.width : 50;
    this.height = options.height !== undefined ? options.height : 30;
    this.fill = options.fill || null;
    this.stroke = options.stroke || null;
    this.lineWidth = options.lineWidth !== undefined ? options.lineWidth : 1;
    this.radius = options.radius || 0;
  }

  _render(ctx) {
    ctx.beginPath();
    const { width: w, height: h, radius: r } = this;
    if (r > 0) {
      ctx.moveTo(-w / 2 + r, -h / 2);
      ctx.lineTo(w / 2 - r, -h / 2);
      ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      ctx.lineTo(w / 2, h / 2 - r);
      ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      ctx.lineTo(-w / 2 + r, h / 2);
      ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      ctx.lineTo(-w / 2, -h / 2 + r);
      ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      ctx.closePath();
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.lineWidth;
      ctx.stroke();
    }
  }
}
