import { EventEmitter } from './EventEmitter.js';

/**
 * Easing functions for value interpolation.
 */
export const Easing = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  bounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  elastic: t => {
    if (t === 0 || t === 1) return t;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  }
};

/**
 * Interpolates a numeric value from `from` to `to` over `duration` ms.
 *
 * @example
 * const tween = new Tween({ from: 0, to: 1, duration: 500, easing: 'easeInOut' });
 * tween.on('update', v => shape.opacity = v);
 * tween.play();
 */
export class Tween extends EventEmitter {
  /**
   * @param {object} options
   * @param {number} options.from
   * @param {number} options.to
   * @param {number} options.duration - milliseconds
   * @param {string|Function} [options.easing='linear']
   * @param {number} [options.delay=0] - delay before starting (ms)
   * @param {boolean} [options.loop=false]
   * @param {boolean} [options.yoyo=false] - reverse on loop
   */
  constructor({ from, to, duration, easing = 'linear', delay = 0, loop = false, yoyo = false }) {
    super();
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.easingFn = typeof easing === 'function' ? easing : (Easing[easing] || Easing.linear);
    this.delay = delay;
    this.loop = loop;
    this.yoyo = yoyo;

    this._startTime = null;
    this._running = false;
    this._rafId = null;
    this._reversed = false;
  }

  play() {
    if (this._running) return this;
    this._running = true;
    this._startTime = null;
    this._tick = this._tick.bind(this);
    this._rafId = requestAnimationFrame(this._tick);
    this.emit('start');
    return this;
  }

  pause() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this.emit('pause');
    return this;
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._startTime = null;
    this.emit('stop');
    return this;
  }

  _tick(timestamp) {
    if (!this._running) return;

    if (this._startTime === null) {
      this._startTime = timestamp + this.delay;
    }

    const elapsed = Math.max(0, timestamp - this._startTime);
    let t = Math.min(elapsed / this.duration, 1);
    const easedT = this.easingFn(this._reversed ? 1 - t : t);
    const value = this.from + (this.to - this.from) * easedT;

    this.emit('update', value);

    if (t < 1) {
      this._rafId = requestAnimationFrame(this._tick);
    } else {
      this.emit('update', this._reversed ? this.from : this.to);
      if (this.loop) {
        if (this.yoyo) this._reversed = !this._reversed;
        this._startTime = null;
        this._rafId = requestAnimationFrame(this._tick);
      } else {
        this._running = false;
        this.emit('complete');
      }
    }
  }

  /** Current interpolated value at progress t (0–1) without animating */
  valueAt(t) {
    return this.from + (this.to - this.from) * this.easingFn(t);
  }
}
