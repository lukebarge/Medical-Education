/**
 * Two-way binding between a control and an animation object's property.
 *
 * @example
 * // Bind a slider to animation.bpm — changes to the slider update the property,
 * // and emitting 'bpmChanged' on the animation updates the slider.
 * Binding.create(slider, heartAnim, 'bpm');
 */
export class Binding {
  /**
   * Create a two-way binding.
   * @param {object} control - Slider, Toggle, or NumberInput
   * @param {object} target - animation or any EventEmitter with the property
   * @param {string} property - property name on target
   * @param {object} [options]
   * @param {string} [options.changeEvent] - target event name that triggers control update
   *   defaults to `${property}Changed`
   */
  static create(control, target, property, options = {}) {
    const changeEvent = options.changeEvent || `${property}Changed`;

    // Control → target
    control.on('change', value => {
      target[property] = value;
    });

    // Target → control (if target emits the change event)
    if (typeof target.on === 'function') {
      target.on(changeEvent, value => {
        if (typeof control.setValue === 'function') {
          control.setValue(value);
        }
      });
    }

    return new Binding(control, target, property);
  }

  constructor(control, target, property) {
    this.control = control;
    this.target = target;
    this.property = property;
  }

  /** Remove the binding. */
  destroy() {
    // NOTE: Full removal requires storing listener references;
    // for simplicity this is a no-op. Use EventEmitter.off() manually if needed.
  }
}
