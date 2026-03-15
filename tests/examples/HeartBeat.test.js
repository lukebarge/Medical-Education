import { describe, it, expect, vi } from 'vitest';
import { HeartBeat } from '../../src/examples/HeartBeat.js';

function mockCanvas(w = 800, h = 600) {
  const ctx = {
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(),
    rotate: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), bezierCurveTo: vi.fn(),
    ellipse: vi.fn(), fillText: vi.fn(), closePath: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {},
    set font(_) {}, set textAlign(_) {}, set textBaseline(_) {},
    set shadowColor(_) {}, set shadowBlur(_) {}
  };
  return { ctx, width: w, height: h, clear: vi.fn() };
}

describe('HeartBeat', () => {
  it('initializes with default bpm=72', () => {
    const heart = new HeartBeat(mockCanvas());
    expect(heart.bpm).toBe(72);
  });

  it('setBPM updates bpm', () => {
    const heart = new HeartBeat(mockCanvas());
    heart.setBPM(100);
    expect(heart.bpm).toBe(100);
  });

  it('setBPM emits bpmChanged', () => {
    const fn = vi.fn();
    const heart = new HeartBeat(mockCanvas());
    heart.on('bpmChanged', fn);
    heart.setBPM(120);
    expect(fn).toHaveBeenCalledWith(120);
  });

  it('setSarcomereLength clamps to [1.6, 2.6]', () => {
    const heart = new HeartBeat(mockCanvas());
    heart.setSarcomereLength(0.5);
    expect(heart.sarcomereLength).toBe(1.6);
    heart.setSarcomereLength(5.0);
    expect(heart.sarcomereLength).toBe(2.6);
  });

  it('reset clears phase', () => {
    const heart = new HeartBeat(mockCanvas());
    heart._phase = 0.8;
    heart.reset();
    expect(heart._phase).toBe(0);
  });

  it('_update advances phase', () => {
    const heart = new HeartBeat(mockCanvas(), { bpm: 60 });
    heart._update(500); // 500ms = 0.5 beats at 60bpm
    expect(heart._phase).toBeCloseTo(0.5, 2);
  });

  it('_draw does not throw', () => {
    const canvas = mockCanvas();
    const heart = new HeartBeat(canvas);
    expect(() => heart._draw(canvas.ctx)).not.toThrow();
  });
});
