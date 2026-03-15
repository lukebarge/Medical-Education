import { EventEmitter } from './EventEmitter.js';

/**
 * Manages a requestAnimationFrame render loop and a list of drawable objects.
 * Each drawable must implement a `draw(ctx)` method (and optionally `update(dt, ts)`).
 *
 * @example
 * const scene = new Scene(canvas);
 * scene.add(heartAnim);
 * scene.add(particleSystem);
 * scene.start();
 */
export class Scene extends EventEmitter {
  /**
   * @param {import('./Canvas.js').Canvas} canvas
   */
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this._drawables = [];
    this._running = false;
    this._rafId = null;
    this._lastTimestamp = null;
  }

  /**
   * Add a drawable to the scene.
   * @param {object} drawable - must have draw(ctx); optionally update(dt, ts)
   */
  add(drawable) {
    this._drawables.push(drawable);
    return this;
  }

  /**
   * Remove a drawable from the scene.
   * @param {object} drawable
   */
  remove(drawable) {
    this._drawables = this._drawables.filter(d => d !== drawable);
    return this;
  }

  /** Start the render loop. */
  start() {
    if (this._running) return this;
    this._running = true;
    this._lastTimestamp = null;
    this._rafId = requestAnimationFrame(ts => this._loop(ts));
    return this;
  }

  /** Stop the render loop. */
  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    return this;
  }

  /** Render a single frame without starting the loop. */
  render() {
    this.canvas.clear();
    const ctx = this.canvas.ctx;
    const now = performance.now();
    for (const d of this._drawables) {
      if (typeof d.draw === 'function') d.draw(ctx);
    }
  }

  /** @private */
  _loop(timestamp) {
    if (!this._running) return;

    const dt = this._lastTimestamp === null ? 0 : timestamp - this._lastTimestamp;
    this._lastTimestamp = timestamp;

    this.canvas.clear();
    const ctx = this.canvas.ctx;

    for (const d of this._drawables) {
      if (typeof d.update === 'function') d.update(dt, timestamp);
      if (typeof d.draw === 'function') d.draw(ctx);
    }

    this.emit('frame', { dt, timestamp });
    this._rafId = requestAnimationFrame(ts => this._loop(ts));
  }
}
