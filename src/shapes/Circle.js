import { Shape } from './Shape.js';

/**
 * An animated circle.
 *
 * @example
 * const c = new Circle({ x: 100, y: 100, radius: 50, fill: 'red', stroke: '#333', lineWidth: 2 });
 * scene.add(c);
 * c.animate({ radius: 80 }, { duration: 400, easing: 'easeOut' });
 */
export class Circle extends Shape {
  /**
   * @param {object} options
   * @param {number} [options.radius=20]
   * @param {string} [options.fill]
   * @param {string} [options.stroke]
   * @param {number} [options.lineWidth=1]
   */
  constructor(options = {}) {
    super(options);
    this.radius = options.radius !== undefined ? options.radius : 20;
    this.fill = options.fill || null;
    this.stroke = options.stroke || null;
    this.lineWidth = options.lineWidth !== undefined ? options.lineWidth : 1;
  }

  _render(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.radius), 0, Math.PI * 2);
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
