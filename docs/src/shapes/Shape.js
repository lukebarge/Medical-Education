import { EventEmitter } from '../core/EventEmitter.js';
import { Tween } from '../core/Tween.js';

/**
 * Base class for all drawable shapes.
 * Subclasses must implement `draw(ctx)`.
 *
 * Supports per-shape animation via `.animate()`.
 */
export class Shape extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {number} [options.x=0]
   * @param {number} [options.y=0]
   * @param {number} [options.rotation=0] - radians
   * @param {number} [options.scaleX=1]
   * @param {number} [options.scaleY=1]
   * @param {number} [options.opacity=1]
   * @param {boolean} [options.visible=true]
   */
  constructor(options = {}) {
    super();
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.rotation = options.rotation || 0;
    this.scaleX = options.scaleX !== undefined ? options.scaleX : 1;
    this.scaleY = options.scaleY !== undefined ? options.scaleY : 1;
    this.opacity = options.opacity !== undefined ? options.opacity : 1;
    this.visible = options.visible !== undefined ? options.visible : true;
    this._tweens = [];
  }

  /**
   * Animate properties of this shape.
   * @param {object} props - target property values, e.g. { x: 100, opacity: 0 }
   * @param {object} [options]
   * @param {number} [options.duration=500]
   * @param {string} [options.easing='linear']
   * @param {number} [options.delay=0]
   * @returns {Tween[]} array of tweens (one per property)
   */
  animate(props, options = {}) {
    const { duration = 500, easing = 'linear', delay = 0 } = options;
    const tweens = [];

    for (const [key, to] of Object.entries(props)) {
      const from = this[key];
      if (from === undefined) continue;

      const tween = new Tween({ from, to, duration, easing, delay });
      tween.on('update', v => { this[key] = v; });
      tween.play();
      this._tweens.push(tween);
      tweens.push(tween);
    }

    return tweens;
  }

  /** Apply transform to ctx before drawing. Call ctx.restore() after. */
  _applyTransform(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.rotation) ctx.rotate(this.rotation);
    if (this.scaleX !== 1 || this.scaleY !== 1) ctx.scale(this.scaleX, this.scaleY);
    if (this.opacity !== 1) ctx.globalAlpha = this.opacity;
  }

  /**
   * Draw the shape. Must be overridden by subclasses.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (!this.visible) return;
    this._applyTransform(ctx);
    this._render(ctx);
    ctx.restore();
  }

  /** Override this in subclasses — transform is already applied. */
  _render(ctx) {}
}
