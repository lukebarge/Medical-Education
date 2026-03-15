import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Action button control.
 *
 * @example
 * const btn = new Button({
 *   label: 'Trigger Arrhythmia',
 *   onClick: () => heart.triggerArrhythmia()
 * });
 */
export class Button extends EventEmitter {
  /**
   * @param {object} options
   * @param {string} options.label
   * @param {Function} [options.onClick]
   */
  constructor(options = {}) {
    super();
    this.label = options.label || 'Button';
    if (options.onClick) this.on('click', options.onClick);
    this._btn = null;
  }

  setLabel(label) {
    this.label = label;
    if (this._btn) this._btn.textContent = label;
    return this;
  }

  setDisabled(disabled) {
    if (this._btn) this._btn.disabled = disabled;
    return this;
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'anim2d-control';

    this._btn = document.createElement('button');
    this._btn.className = 'anim2d-btn';
    this._btn.textContent = this.label;
    this._btn.addEventListener('click', () => this.emit('click'));

    div.appendChild(this._btn);
    return div;
  }
}
