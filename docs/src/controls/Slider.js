import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Range slider control with live value display.
 *
 * @example
 * const slider = new Slider({
 *   label: 'Heart Rate',
 *   min: 40, max: 200, step: 1, value: 72, unit: 'bpm',
 *   onChange: v => heart.setBPM(v)
 * });
 * panel.add(slider);
 */
export class Slider extends EventEmitter {
  /**
   * @param {object} options
   * @param {string} options.label
   * @param {number} options.min
   * @param {number} options.max
   * @param {number} [options.step=1]
   * @param {number} options.value - initial value
   * @param {string} [options.unit='']
   * @param {Function} [options.onChange] - shorthand for .on('change', fn)
   */
  constructor(options = {}) {
    super();
    this.label = options.label || '';
    this.min = options.min !== undefined ? options.min : 0;
    this.max = options.max !== undefined ? options.max : 100;
    this.step = options.step !== undefined ? options.step : 1;
    this._value = options.value !== undefined ? options.value : this.min;
    this.unit = options.unit || '';

    if (options.onChange) this.on('change', options.onChange);

    this._input = null;
    this._valueEl = null;
  }

  /** Get current value. */
  getValue() {
    return this._value;
  }

  /** Set value programmatically (also updates DOM). */
  setValue(v) {
    this._value = Math.min(this.max, Math.max(this.min, v));
    if (this._input) {
      this._input.value = this._value;
      if (this._valueEl) this._valueEl.textContent = this._formatValue();
    }
    return this;
  }

  /** Create and return the DOM element. */
  createElement() {
    const div = document.createElement('div');
    div.className = 'anim2d-control';

    const label = document.createElement('label');
    const labelText = document.createTextNode(this.label);
    this._valueEl = document.createElement('span');
    this._valueEl.className = 'anim2d-value';
    this._valueEl.textContent = this._formatValue();
    label.appendChild(labelText);
    label.appendChild(this._valueEl);

    this._input = document.createElement('input');
    this._input.type = 'range';
    this._input.min = this.min;
    this._input.max = this.max;
    this._input.step = this.step;
    this._input.value = this._value;

    this._input.addEventListener('input', () => {
      this._value = parseFloat(this._input.value);
      this._valueEl.textContent = this._formatValue();
      this.emit('change', this._value);
    });

    div.appendChild(label);
    div.appendChild(this._input);
    return div;
  }

  _formatValue() {
    const v = Number.isInteger(this.step) ? this._value : this._value.toFixed(2);
    return `${v}${this.unit ? ' ' + this.unit : ''}`;
  }
}
