import { describe, it, expect, vi } from 'vitest';
import { Slider } from '../../src/controls/Slider.js';

describe('Slider', () => {
  it('initializes with given value', () => {
    const s = new Slider({ label: 'HR', min: 40, max: 200, value: 72 });
    expect(s.getValue()).toBe(72);
  });

  it('setValue clamps to min', () => {
    const s = new Slider({ min: 40, max: 200, value: 72 });
    s.setValue(10);
    expect(s.getValue()).toBe(40);
  });

  it('setValue clamps to max', () => {
    const s = new Slider({ min: 40, max: 200, value: 72 });
    s.setValue(300);
    expect(s.getValue()).toBe(200);
  });

  it('onChange shorthand works', () => {
    const fn = vi.fn();
    const s = new Slider({ min: 0, max: 100, value: 50, onChange: fn });
    s.emit('change', 75);
    expect(fn).toHaveBeenCalledWith(75);
  });

  it('createElement returns a DOM element', () => {
    const s = new Slider({ label: 'Test', min: 0, max: 10, value: 5 });
    const el = s.createElement();
    expect(el.tagName).toBe('DIV');
    expect(el.querySelector('input[type=range]')).toBeTruthy();
  });

  it('input event fires change', () => {
    const fn = vi.fn();
    const s = new Slider({ min: 0, max: 100, value: 50 });
    s.on('change', fn);
    const el = s.createElement();
    const input = el.querySelector('input');
    input.value = '75';
    input.dispatchEvent(new Event('input'));
    expect(fn).toHaveBeenCalledWith(75);
  });
});
