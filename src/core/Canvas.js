import { EventEmitter } from './EventEmitter.js';

/**
 * Manages a <canvas> element with HiDPI/retina scaling and optional resize support.
 *
 * @example
 * const canvas = new Canvas('#app', { width: 800, height: 600 });
 * canvas.ctx   // CanvasRenderingContext2D
 * canvas.element
 */
export class Canvas extends EventEmitter {
  /**
   * @param {string|HTMLCanvasElement} target - CSS selector or canvas element
   * @param {object} [options]
   * @param {number} [options.width=800]
   * @param {number} [options.height=600]
   * @param {boolean} [options.autoResize=false] - Watch container size via ResizeObserver
   */
  constructor(target, options = {}) {
    super();
    const { width = 800, height = 600, autoResize = false } = options;

    if (typeof target === 'string') {
      this.element = document.querySelector(target);
      if (!this.element) {
        this.element = document.createElement('canvas');
        const container = document.querySelector(target.replace('canvas', '').trim()) || document.body;
        container.appendChild(this.element);
      }
    } else {
      this.element = target;
    }

    this.ctx = this.element.getContext('2d');
    this._dpr = window.devicePixelRatio || 1;
    this.resize(width, height);

    if (autoResize && typeof ResizeObserver !== 'undefined') {
      this._observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
          const { width: w, height: h } = entry.contentRect;
          this.resize(w, h);
          this.emit('resize', { width: w, height: h });
        }
      });
      this._observer.observe(this.element.parentElement || document.body);
    }
  }

  /**
   * Resize canvas, applying device pixel ratio for crisp rendering.
   * @param {number} width - CSS pixel width
   * @param {number} height - CSS pixel height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.element.width = width * this._dpr;
    this.element.height = height * this._dpr;
    this.element.style.width = width + 'px';
    this.element.style.height = height + 'px';
    this.ctx.scale(this._dpr, this._dpr);
  }

  /** Clear the entire canvas */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  destroy() {
    if (this._observer) this._observer.disconnect();
  }
}
