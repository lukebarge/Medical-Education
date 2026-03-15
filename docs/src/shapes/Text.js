import { Shape } from './Shape.js';

/**
 * An animated text label.
 *
 * @example
 * const label = new Text({
 *   x: 100, y: 100,
 *   text: 'Left Ventricle',
 *   font: 'bold 14px sans-serif',
 *   fill: '#333',
 *   align: 'center'
 * });
 */
export class Text extends Shape {
  /**
   * @param {object} options
   * @param {string} [options.text='']
   * @param {string} [options.font='14px sans-serif']
   * @param {string} [options.fill='#000']
   * @param {string} [options.stroke]
   * @param {number} [options.lineWidth=1]
   * @param {string} [options.align='left'] - textAlign
   * @param {string} [options.baseline='alphabetic'] - textBaseline
   * @param {number} [options.maxWidth]
   */
  constructor(options = {}) {
    super(options);
    this.text = options.text || '';
    this.font = options.font || '14px sans-serif';
    this.fill = options.fill !== undefined ? options.fill : '#000';
    this.stroke = options.stroke || null;
    this.lineWidth = options.lineWidth !== undefined ? options.lineWidth : 1;
    this.align = options.align || 'left';
    this.baseline = options.baseline || 'alphabetic';
    this.maxWidth = options.maxWidth;
  }

  _render(ctx) {
    ctx.font = this.font;
    ctx.textAlign = this.align;
    ctx.textBaseline = this.baseline;

    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fillText(this.text, 0, 0, this.maxWidth);
    }
    if (this.stroke) {
      ctx.strokeStyle = this.stroke;
      ctx.lineWidth = this.lineWidth;
      ctx.strokeText(this.text, 0, 0, this.maxWidth);
    }
  }
}
