import { describe, it, expect, vi } from 'vitest';
import { Toggle } from '../../src/controls/Toggle.js';

describe('Toggle', () => {
  it('initializes with given value', () => {
    const t = new Toggle({ label: 'Labels', value: true });
    expect(t.getValue()).toBe(true);
  });

  it('defaults to false', () => {
    const t = new Toggle({ label: 'X' });
    expect(t.getValue()).toBe(false);
  });

  it('setValue updates value', () => {
    const t = new Toggle({ value: true });
    t.setValue(false);
    expect(t.getValue()).toBe(false);
  });

  it('onChange shorthand fires', () => {
    const fn = vi.fn();
    const t = new Toggle({ value: false, onChange: fn });
    t.emit('change', true);
    expect(fn).toHaveBeenCalledWith(true);
  });

  it('createElement returns checkbox input', () => {
    const t = new Toggle({ label: 'Test', value: true });
    const el = t.createElement();
    const input = el.querySelector('input[type=checkbox]');
    expect(input).toBeTruthy();
    expect(input.checked).toBe(true);
  });

  it('checkbox change event fires toggle change', () => {
    const fn = vi.fn();
    const t = new Toggle({ value: false });
    t.on('change', fn);
    const el = t.createElement();
    const input = el.querySelector('input');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    expect(fn).toHaveBeenCalledWith(true);
  });
});
