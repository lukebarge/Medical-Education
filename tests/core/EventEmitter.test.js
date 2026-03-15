import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../../src/core/EventEmitter.js';

describe('EventEmitter', () => {
  it('calls listener on emit', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('test', fn);
    ee.emit('test', 42);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('supports multiple listeners for same event', () => {
    const ee = new EventEmitter();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    ee.on('ev', fn1);
    ee.on('ev', fn2);
    ee.emit('ev');
    expect(fn1).toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it('off removes a listener', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.on('ev', fn);
    ee.off('ev', fn);
    ee.emit('ev');
    expect(fn).not.toHaveBeenCalled();
  });

  it('once fires only once', () => {
    const ee = new EventEmitter();
    const fn = vi.fn();
    ee.once('ev', fn);
    ee.emit('ev');
    ee.emit('ev');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('emit with no listeners does not throw', () => {
    const ee = new EventEmitter();
    expect(() => ee.emit('nonexistent')).not.toThrow();
  });
});
