import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Container that groups controls and mounts them into a DOM element.
 *
 * @example
 * const panel = new ControlPanel('#controls', { title: 'Simulation Parameters' });
 * panel.add(slider);
 * panel.add(toggle);
 * panel.mount();
 */
export class ControlPanel extends EventEmitter {
  /**
   * @param {string|HTMLElement} target - CSS selector or DOM element
   * @param {object} [options]
   * @param {string} [options.title]
   * @param {string} [options.theme='light'] - 'light' | 'dark'
   */
  constructor(target, options = {}) {
    super();
    this._target = typeof target === 'string' ? document.querySelector(target) : target;
    this.title = options.title || '';
    this.theme = options.theme || 'light';
    this._controls = [];
    this._element = null;
  }

  /**
   * Add a control to the panel.
   * @param {object} control - Slider, Toggle, NumberInput, or Button
   */
  add(control) {
    this._controls.push(control);
    // If already mounted, append immediately
    if (this._element) {
      const el = control.createElement();
      this._element.querySelector('.anim2d-panel-body').appendChild(el);
    }
    return this;
  }

  /** Mount the panel into the target DOM element. */
  mount() {
    if (!this._target) {
      console.warn('[ControlPanel] Target element not found');
      return this;
    }

    this._element = document.createElement('div');
    this._element.className = `anim2d-panel anim2d-panel--${this.theme}`;
    this._element.innerHTML = this._styles() + (this.title
      ? `<div class="anim2d-panel-title">${this.title}</div>`
      : '');

    const body = document.createElement('div');
    body.className = 'anim2d-panel-body';

    for (const control of this._controls) {
      body.appendChild(control.createElement());
    }

    this._element.appendChild(body);
    this._target.appendChild(this._element);
    return this;
  }

  /** Remove the panel from the DOM. */
  destroy() {
    if (this._element) this._element.remove();
    return this;
  }

  _styles() {
    if (document.getElementById('anim2d-panel-styles')) return '';
    const style = document.createElement('style');
    style.id = 'anim2d-panel-styles';
    style.textContent = `
      .anim2d-panel {
        font-family: system-ui, sans-serif;
        font-size: 13px;
        background: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 12px 16px;
        min-width: 220px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .anim2d-panel--dark {
        background: #1e1e1e;
        border-color: #444;
        color: #eee;
      }
      .anim2d-panel-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ddd;
      }
      .anim2d-panel--dark .anim2d-panel-title { border-color: #444; }
      .anim2d-control { margin-bottom: 10px; }
      .anim2d-control label {
        display: flex; justify-content: space-between;
        margin-bottom: 4px; font-size: 12px; color: #555;
      }
      .anim2d-panel--dark .anim2d-control label { color: #aaa; }
      .anim2d-control input[type=range] { width: 100%; cursor: pointer; }
      .anim2d-control input[type=number] {
        width: 100%; padding: 3px 6px; border: 1px solid #ccc;
        border-radius: 4px; font-size: 12px; box-sizing: border-box;
      }
      .anim2d-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
      .anim2d-toggle input { width: auto; cursor: pointer; }
      .anim2d-btn {
        width: 100%; padding: 6px 12px; border: 1px solid #ccc;
        border-radius: 4px; background: #fff; cursor: pointer;
        font-size: 12px; transition: background 0.15s;
      }
      .anim2d-btn:hover { background: #e8e8e8; }
      .anim2d-panel--dark .anim2d-btn { background: #333; border-color: #555; color: #eee; }
      .anim2d-panel--dark .anim2d-btn:hover { background: #444; }
      .anim2d-value { font-weight: 600; color: #333; }
      .anim2d-panel--dark .anim2d-value { color: #fff; }
    `;
    document.head.appendChild(style);
    return '';
  }
}
