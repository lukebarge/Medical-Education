import { describe, it, expect, vi } from 'vitest';
import { ParticleSystem } from '../../src/effects/ParticleSystem.js';

function mockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    set fillStyle(_) {},
    set globalAlpha(_) {}
  };
}

describe('ParticleSystem', () => {
  it('starts with no particles', () => {
    const ps = new ParticleSystem({ emitter: { x: 0, y: 0 } });
    expect(ps._particles.length).toBe(0);
  });

  it('emit() creates particles', () => {
    const ps = new ParticleSystem({ emitter: { x: 0, y: 0 } });
    ps.emit(5);
    expect(ps._particles.length).toBe(5);
  });

  it('update() ages particles and removes expired ones', () => {
    const ps = new ParticleSystem({
      emitter: { x: 0, y: 0 },
      lifetime: [10, 10],
      velocity: { x: [0, 0], y: [0, 0] }
    });
    ps.emit(3);
    expect(ps._particles.length).toBe(3);
    ps.update(20); // 20ms > 10ms lifetime
    expect(ps._particles.length).toBe(0);
  });

  it('clear() removes all particles', () => {
    const ps = new ParticleSystem({ emitter: { x: 0, y: 0 } });
    ps.emit(10);
    ps.clear();
    expect(ps._particles.length).toBe(0);
  });

  it('draw() calls arc for each particle', () => {
    const ps = new ParticleSystem({ emitter: { x: 50, y: 50 }, radius: [3, 3] });
    ps.emit(3);
    const ctx = mockCtx();
    ps.draw(ctx);
    expect(ctx.arc).toHaveBeenCalledTimes(3);
  });

  it('continuous emit does not exceed count', () => {
    const ps = new ParticleSystem({
      emitter: { x: 0, y: 0 },
      count: 10,
      emitRate: 1000,
      lifetime: [5000, 5000],
      velocity: { x: [0, 0], y: [0, 0] }
    });
    ps.start();
    ps.update(500);
    expect(ps._particles.length).toBeLessThanOrEqual(10);
  });
});
