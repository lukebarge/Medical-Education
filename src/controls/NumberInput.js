import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Numeric text input with optional min/max validation.
 *
 * @example
 * const input = new NumberInput({
 *   label: 'Sarcomere Length',
 *   value: 2.2, min: 1.6, max: 2.6, step: 0.01, unit: 'μm',
 *   onChange: v => heart.setSarcomereLength(v)
 * });
 */
export class NumberInput extends EventEmitter {
  /**
   * @param {object} options
   * @param {string} options.label
   * @param {number} options.value
   * @param {number} [options.min]
   * @param {number} [options.max]
   * @param {number} [options.step=1]
   * @param {string} [options.unit='']
   * @param {Function} [options.onChange]
   */
  constructor(options = {}) {
    super();
    this.label = options.label || '';
    this._value = options.value !== undefined ? options.value : 0;
    this.min = options.min;
    this.max = options.max;
    this.step = options.step !== undefined ? options.step : 1;
    this.unit = options.unit || '';
    if (options.onChange) this.on('change', options.onChange);
    this._input = null;
  }

  getValue() {
    return this._value;
  }

  setValue(v) {
    this._value = this._clamp(v);
    if (this._input) this._input.value = this._value;
    return this;
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'anim2d-control';

    const labelEl = document.createElement('label');
    labelEl.appendChild(document.createTextNode(
      this.unit ? `${this.label} (${this.unit})` : this.label
    ));

    this._input = document.createElement('input');
    this._input.type = 'number';
    this._input.value = this._value;
    if (this.min !== undefined) this._input.min = this.min;
    if (this.max !== undefined) this._input.max = this.max;
    this._input.step = this.step;

    this._input.addEventListener('change', () => {
      const parsed = parseFloat(this._input.value);
      if (!isNaN(parsed)) {
        this._value = this._clamp(parsed);
        this._input.value = this._value;
        this.emit('change', this._value);
      }
    });

    div.appendChild(labelEl);
    div.appendChild(this._input);
    return div;
  }

  _clamp(v) {
    if (this.min !== undefined && v < this.min) return this.min;
    if (this.max !== undefined && v > this.max) return this.max;
    return v;
  }
}
