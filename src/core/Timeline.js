import { EventEmitter } from './EventEmitter.js';

/**
 * Sequences or overlaps multiple Tweens on a shared timeline.
 *
 * @example
 * const tl = new Timeline();
 * tl.add(tweenA, { at: 0 });
 * tl.add(tweenB, { at: 300 });
 * tl.add(tweenC, { after: tweenA });
 * tl.play();
 */
export class Timeline extends EventEmitter {
  constructor() {
    super();
    this._entries = []; // { tween, startAt }
    this._running = false;
    this._startTime = null;
    this._rafId = null;
    this.duration = 0;
  }

  /**
   * Add a tween to the timeline.
   * @param {import('./Tween.js').Tween} tween
   * @param {object} [options]
   * @param {number} [options.at] - absolute start time in ms
   * @param {import('./Tween.js').Tween} [options.after] - start after another tween ends
   * @param {number} [options.offset=0] - additional offset when using `after`
   */
  add(tween, options = {}) {
    let startAt = 0;

    if (options.at !== undefined) {
      startAt = options.at;
    } else if (options.after) {
      const ref = this._entries.find(e => e.tween === options.after);
      if (ref) {
        startAt = ref.startAt + ref.tween.duration + (options.offset || 0);
      }
    }

    this._entries.push({ tween, startAt, started: false, completed: false });
    this.duration = Math.max(this.duration, startAt + tween.duration);
    return this;
  }

  play() {
    if (this._running) return this;
    this._running = true;
    this._startTime = null;
    this._entries.forEach(e => { e.started = false; e.completed = false; });
    this._rafId = requestAnimationFrame(ts => this._tick(ts));
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
    this._entries.forEach(e => { e.started = false; e.completed = false; });
    this.emit('stop');
    return this;
  }

  _tick(timestamp) {
    if (!this._running) return;

    if (this._startTime === null) this._startTime = timestamp;
    const elapsed = timestamp - this._startTime;

    let allDone = true;

    for (const entry of this._entries) {
      if (entry.completed) continue;

      if (elapsed >= entry.startAt && !entry.started) {
        entry.started = true;
        // Manually drive the tween by hooking into its update
        entry._localStart = timestamp;
        entry.tween.emit('start');
      }

      if (entry.started) {
        const localElapsed = Math.max(0, timestamp - entry._localStart);
        let t = Math.min(localElapsed / entry.tween.duration, 1);
        const value = entry.tween.from + (entry.tween.to - entry.tween.from) * entry.tween.easingFn(t);
        entry.tween.emit('update', value);

        if (t >= 1) {
          entry.completed = true;
          entry.tween.emit('complete');
        } else {
          allDone = false;
        }
      } else {
        allDone = false;
      }
    }

    if (!allDone) {
      this._rafId = requestAnimationFrame(ts => this._tick(ts));
    } else {
      this._running = false;
      this.emit('complete');
    }
  }
}
