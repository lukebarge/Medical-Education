import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Checkbox/switch toggle control.
 *
 * @example
 * const toggle = new Toggle({
 *   label: 'Show Labels',
 *   value: true,
 *   onChange: enabled => anim.showLabels(enabled)
 * });
 */
export class Toggle extends EventEmitter {
  /**
   * @param {object} options
   * @param {string} options.label
   * @param {boolean} [options.value=false]
   * @param {Function} [options.onChange]
   */
  constructor(options = {}) {
    super();
    this.label = options.label || '';
    this._value = options.value !== undefined ? options.value : false;
    if (options.onChange) this.on('change', options.onChange);
    this._input = null;
  }

  getValue() {
    return this._value;
  }

  setValue(v) {
    this._value = !!v;
    if (this._input) this._input.checked = this._value;
    return this;
  }

  createElement() {
    const div = document.createElement('div');
    div.className = 'anim2d-control';

    const labelEl = document.createElement('label');
    labelEl.className = 'anim2d-toggle';

    this._input = document.createElement('input');
    this._input.type = 'checkbox';
    this._input.checked = this._value;

    this._input.addEventListener('change', () => {
      this._value = this._input.checked;
      this.emit('change', this._value);
    });

    const span = document.createElement('span');
    span.textContent = this.label;

    labelEl.appendChild(this._input);
    labelEl.appendChild(span);
    div.appendChild(labelEl);
    return div;
  }
}
