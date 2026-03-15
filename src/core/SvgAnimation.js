import { EventEmitter } from './EventEmitter.js';
import gsap from 'gsap';

/**
 * Base class for SVG-based animations driven by GSAP timelines.
 *
 * Manages an <svg> element inside a container and exposes play/pause/stop/speed
 * controls that delegate to a GSAP timeline. Subclasses implement:
 *   - `_setup(svg)`         — create SVG elements and store refs
 *   - `_createTimeline()`   — build and return a GSAP Timeline
 *
 * @example
 * class MyAnim extends SvgAnimation {
 *   _setup(svg) { this._circle = this._el('circle', { r: 20, fill: 'red' }); svg.appendChild(this._circle); }
 *   _createTimeline() { return gsap.timeline({ repeat: -1 }).to(this._circle, { attr: { r: 40 }, duration: 1 }); }
 * }
 * const anim = new MyAnim('#container', { width: 400, height: 300 });
 * anim.play();
 */
export class SvgAnimation extends EventEmitter {
  /**
   * @param {string|Element} container - CSS selector or DOM element to host the SVG
   * @param {object} [params]
   * @param {number} [params.speed=1]
   * @param {number} [params.width=400]
   * @param {number} [params.height=300]
   */
  constructor(container, params = {}) {
    super();
    this._container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.speed = params.speed ?? 1;
    this._tl = null;

    this.svg = this._createSVG(params.width ?? 400, params.height ?? 300);
    this._container.appendChild(this.svg);
    this._setup(this.svg);
    this._tl = this._createTimeline();
    if (this._tl) this._tl.timeScale(this.speed).pause();
  }

  // ─── Playback controls ────────────────────────────────────────────────────

  play() {
    this._tl?.play();
    this.emit('start');
    return this;
  }

  pause() {
    this._tl?.pause();
    this.emit('pause');
    return this;
  }

  stop() {
    this._tl?.seek(0).pause();
    this.emit('stop');
    return this;
  }

  /**
   * @param {number} multiplier - e.g. 0.5 = half speed, 2 = double speed
   */
  setSpeed(multiplier) {
    this.speed = multiplier;
    this._tl?.timeScale(multiplier);
    return this;
  }

  /** Remove SVG from DOM and kill the GSAP timeline. */
  destroy() {
    this._tl?.kill();
    this._tl = null;
    this.svg?.remove();
  }

  // ─── Helpers for subclasses ───────────────────────────────────────────────

  /**
   * Create an SVG element in the correct namespace.
   * @param {string} tag
   * @param {object} [attrs]
   * @returns {SVGElement}
   */
  _el(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  /**
   * Rebuild the timeline (e.g. when a parameter that affects duration changes).
   * Preserves playing state.
   */
  _rebuildTimeline() {
    const wasPlaying = this._tl && !this._tl.paused();
    this._tl?.kill();
    this._tl = this._createTimeline();
    if (this._tl) {
      this._tl.timeScale(this.speed);
      if (wasPlaying) this._tl.play();
    }
  }

  // ─── Overrideable ─────────────────────────────────────────────────────────

  /** @param {SVGSVGElement} svg */
  _setup(svg) {}

  /** @returns {gsap.core.Timeline|null} */
  _createTimeline() { return null; }

  // ─── Private ──────────────────────────────────────────────────────────────

  _createSVG(cssWidth, cssHeight) {
    const svg = this._el('svg');
    svg.style.width = cssWidth + 'px';
    svg.style.height = cssHeight + 'px';
    return svg;
  }
}
