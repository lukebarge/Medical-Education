import { describe, it, expect } from 'vitest';
import { Tween, Easing } from '../../src/core/Tween.js';

describe('Tween', () => {
  it('valueAt interpolates correctly', () => {
    const t = new Tween({ from: 0, to: 100, duration: 1000 });
    expect(t.valueAt(0)).toBe(0);
    expect(t.valueAt(0.5)).toBe(50);
    expect(t.valueAt(1)).toBe(100);
  });

  it('valueAt uses easing', () => {
    const t = new Tween({ from: 0, to: 100, duration: 1000, easing: 'easeIn' });
    const v = t.valueAt(0.5);
    // easeIn at 0.5 = 0.5*0.5 = 0.25 → value = 25
    expect(v).toBeCloseTo(25, 1);
  });

  it('accepts custom easing function', () => {
    const t = new Tween({ from: 0, to: 10, duration: 100, easing: x => x * x });
    expect(t.valueAt(0.5)).toBeCloseTo(2.5, 1);
  });
});

describe('Easing', () => {
  it('linear returns t unchanged', () => {
    expect(Easing.linear(0.3)).toBe(0.3);
  });

  it('easeIn(0)=0 and easeIn(1)=1', () => {
    expect(Easing.easeIn(0)).toBe(0);
    expect(Easing.easeIn(1)).toBe(1);
  });

  it('easeOut(0)=0 and easeOut(1)=1', () => {
    expect(Easing.easeOut(0)).toBe(0);
    expect(Easing.easeOut(1)).toBe(1);
  });

  it('easeInOut(0)=0, easeInOut(0.5) < 0.6, easeInOut(1)=1', () => {
    expect(Easing.easeInOut(0)).toBe(0);
    expect(Easing.easeInOut(1)).toBe(1);
    expect(Easing.easeInOut(0.5)).toBeLessThan(0.6);
  });

  it('bounce returns 1 at t=1', () => {
    expect(Easing.bounce(1)).toBeCloseTo(1, 1);
  });
});
