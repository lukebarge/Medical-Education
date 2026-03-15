import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Animation } from '../../src/core/Animation.js';

// Minimal canvas mock
function mockCanvas() {
  return {
    ctx: { clearRect: vi.fn(), save: vi.fn(), restore: vi.fn() },
    width: 800,
    height: 600,
    clear: vi.fn()
  };
}

describe('Animation', () => {
  it('starts in stopped state', () => {
    const anim = new Animation(mockCanvas());
    expect(anim._running).toBe(false);
  });

  it('setSpeed updates speed', () => {
    const anim = new Animation(mockCanvas());
    anim.setSpeed(2.5);
    expect(anim.speed).toBe(2.5);
  });

  it('play sets _running to true', () => {
    const canvas = mockCanvas();
    // Mock rAF
    global.requestAnimationFrame = vi.fn();
    const anim = new Animation(canvas);
    anim.play();
    expect(anim._running).toBe(true);
    anim.pause(); // clean up
  });

  it('pause sets _running to false', () => {
    global.requestAnimationFrame = vi.fn();
    global.cancelAnimationFrame = vi.fn();
    const anim = new Animation(mockCanvas());
    anim.play();
    anim.pause();
    expect(anim._running).toBe(false);
  });

  it('stop calls reset and sets _running false', () => {
    global.requestAnimationFrame = vi.fn();
    global.cancelAnimationFrame = vi.fn();
    const anim = new Animation(mockCanvas());
    anim.reset = vi.fn();
    anim.play();
    anim.stop();
    expect(anim._running).toBe(false);
    expect(anim.reset).toHaveBeenCalled();
  });

  it('emits start event on play', () => {
    global.requestAnimationFrame = vi.fn();
    const anim = new Animation(mockCanvas());
    const fn = vi.fn();
    anim.on('start', fn);
    anim.play();
    expect(fn).toHaveBeenCalled();
    anim.pause();
  });
});
