import { EventEmitter } from './EventEmitter.js';

/**
 * Base class for all animations. Manages a requestAnimationFrame loop
 * with play/pause/stop/speed/step controls.
 *
 * Subclasses must implement `_update(deltaTime, timestamp)` and `_draw(ctx)`.
 *
 * @example
 * class MyAnim extends Animation {
 *   _update(dt) { this.angle += dt * 0.001; }
 *   _draw(ctx) { ctx.fillRect(this.x, this.y, 50, 50); }
 * }
 * const anim = new MyAnim(canvas);
 * anim.play();
 */
export class Animation extends EventEmitter {
  /**
   * @param {import('./Canvas.js').Canvas} canvas
   * @param {object} [options]
   * @param {number} [options.speed=1] - playback speed multiplier
   */
  constructor(canvas, options = {}) {
    super();
    this.canvas = canvas;
    this.ctx = canvas.ctx;
    this.speed = options.speed !== undefined ? options.speed : 1;

    this._running = false;
    this._rafId = null;
    this._lastTimestamp = null;
    this._stepMode = false;
  }

  /** Start or resume the animation loop. */
  play() {
    if (this._running) return this;
    this._stepMode = false;
    this._running = true;
    this._lastTimestamp = null;
    this._rafId = requestAnimationFrame(ts => this._loop(ts));
    this.emit('start');
    return this;
  }

  /** Pause the animation; can be resumed with play(). */
  pause() {
    if (!this._running) return this;
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this.emit('pause');
    return this;
  }

  /** Stop the animation and reset to initial state. */
  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
    this._lastTimestamp = null;
    this.reset();
    this.emit('stop');
    return this;
  }

  /**
   * Advance exactly one frame (for step-through / teaching mode).
   * If currently playing, pauses first.
   */
  step() {
    if (this._running) this.pause();
    this._stepMode = true;
    const now = performance.now();
    const dt = 1000 / 60; // simulate 60fps frame
    this._update(dt * this.speed, now);
    this._draw(this.ctx);
    this.emit('frame', now);
    return this;
  }

  /**
   * Set playback speed multiplier.
   * @param {number} multiplier - e.g. 0.5 = half speed, 2 = double speed
   */
  setSpeed(multiplier) {
    this.speed = multiplier;
    return this;
  }

  /**
   * Reset animation to initial state. Override in subclasses.
   */
  reset() {
    // override in subclasses
  }

  /** @private */
  _loop(timestamp) {
    if (!this._running) return;

    const dt = this._lastTimestamp === null ? 0 : (timestamp - this._lastTimestamp);
    this._lastTimestamp = timestamp;

    this.canvas.clear();
    this._update(dt * this.speed, timestamp);
    this._draw(this.ctx);
    this.emit('frame', timestamp);

    this._rafId = requestAnimationFrame(ts => this._loop(ts));
  }

  /**
   * Override: update animation state.
   * @param {number} deltaTime - elapsed ms since last frame, scaled by speed
   * @param {number} timestamp - raw rAF timestamp
   */
  _update(deltaTime, timestamp) {}

  /**
   * Override: render the animation to the canvas.
   * @param {CanvasRenderingContext2D} ctx
   */
  _draw(ctx) {}
}
