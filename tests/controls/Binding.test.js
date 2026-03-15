import { describe, it, expect, vi } from 'vitest';
import { Binding } from '../../src/controls/Binding.js';
import { Slider } from '../../src/controls/Slider.js';
import { EventEmitter } from '../../src/core/EventEmitter.js';

describe('Binding', () => {
  it('control change updates target property', () => {
    const slider = new Slider({ min: 0, max: 200, value: 72 });
    const target = new EventEmitter();
    target.bpm = 72;

    Binding.create(slider, target, 'bpm');
    slider.emit('change', 100);

    expect(target.bpm).toBe(100);
  });

  it('target event updates control value', () => {
    const slider = new Slider({ min: 0, max: 200, value: 72 });
    slider.setValue = vi.fn();
    const target = new EventEmitter();
    target.bpm = 72;

    Binding.create(slider, target, 'bpm');
    target.emit('bpmChanged', 90);

    expect(slider.setValue).toHaveBeenCalledWith(90);
  });

  it('returns a Binding instance', () => {
    const slider = new Slider({ min: 0, max: 100, value: 50 });
    const target = new EventEmitter();
    target.x = 50;
    const b = Binding.create(slider, target, 'x');
    expect(b).toBeInstanceOf(Binding);
  });
});
