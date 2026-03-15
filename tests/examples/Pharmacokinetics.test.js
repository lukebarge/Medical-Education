import { describe, it, expect, vi } from 'vitest';
import { Pharmacokinetics } from '../../src/examples/Pharmacokinetics.js';

function mockCanvas(w = 800, h = 600) {
  const ctx = {
    save: vi.fn(), restore: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    fillText: vi.fn(), setLineDash: vi.fn(),
    set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {},
    set font(_) {}, set textAlign(_) {}, set textBaseline(_) {}
  };
  return { ctx, width: w, height: h, clear: vi.fn() };
}

describe('Pharmacokinetics', () => {
  it('initializes with Cmax=100, halfLife=4', () => {
    const pk = new Pharmacokinetics(mockCanvas(), { Cmax: 100, halfLife: 4 });
    expect(pk.Cmax).toBe(100);
    expect(pk.halfLife).toBe(4);
  });

  it('_concentration returns 0 at t=0', () => {
    const pk = new Pharmacokinetics(mockCanvas());
    expect(pk._concentration(0)).toBe(0);
  });

  it('_concentration returns Cmax near tmax', () => {
    const pk = new Pharmacokinetics(mockCanvas(), { Cmax: 100, tmax: 1, halfLife: 4 });
    const c = pk._concentration(pk.tmax);
    expect(c).toBeGreaterThan(0);
  });

  it('_concentration decreases after tmax', () => {
    const pk = new Pharmacokinetics(mockCanvas(), { Cmax: 100, tmax: 1, halfLife: 4 });
    const c1 = pk._concentration(1);
    const c2 = pk._concentration(8);
    expect(c2).toBeLessThan(c1);
  });

  it('setHalfLife updates halfLife', () => {
    const pk = new Pharmacokinetics(mockCanvas());
    pk.setHalfLife(2);
    expect(pk.halfLife).toBe(2);
  });

  it('setCmax updates Cmax and resets', () => {
    const pk = new Pharmacokinetics(mockCanvas(), { Cmax: 100 });
    pk._simTime = 10;
    pk.setCmax(200);
    expect(pk.Cmax).toBe(200);
    expect(pk._simTime).toBe(0);
  });

  it('reset clears simulation state', () => {
    const pk = new Pharmacokinetics(mockCanvas());
    pk._simTime = 15;
    pk.reset();
    expect(pk._simTime).toBe(0);
  });

  it('_update advances simTime', () => {
    const pk = new Pharmacokinetics(mockCanvas(), { playSpeed: 1 });
    pk._update(3000); // 3000ms = 1 hour at default msPerHour=3000
    expect(pk._simTime).toBeGreaterThan(0);
  });
});
