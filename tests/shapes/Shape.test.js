import { describe, it, expect, vi } from 'vitest';
import { Shape } from '../../src/shapes/Shape.js';
import { Circle } from '../../src/shapes/Circle.js';
import { Rect } from '../../src/shapes/Rect.js';
import { Text } from '../../src/shapes/Text.js';
import { Path } from '../../src/shapes/Path.js';

function mockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    rect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setLineDash: vi.fn(),
    set fillStyle(_) {},
    set strokeStyle(_) {},
    set lineWidth(_) {},
    set font(_) {},
    set textAlign(_) {},
    set textBaseline(_) {},
    set globalAlpha(_) {}
  };
}

describe('Circle', () => {
  it('initializes with defaults', () => {
    const c = new Circle();
    expect(c.radius).toBe(20);
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
  });

  it('draws when visible', () => {
    const ctx = mockCtx();
    const c = new Circle({ x: 50, y: 50, radius: 30, fill: 'red' });
    c.draw(ctx);
    expect(ctx.arc).toHaveBeenCalledWith(0, 0, 30, 0, Math.PI * 2);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('does not draw when invisible', () => {
    const ctx = mockCtx();
    const c = new Circle({ visible: false });
    c.draw(ctx);
    expect(ctx.arc).not.toHaveBeenCalled();
  });
});

describe('Rect', () => {
  it('initializes with defaults', () => {
    const r = new Rect();
    expect(r.width).toBe(50);
    expect(r.height).toBe(30);
  });

  it('draws a rect', () => {
    const ctx = mockCtx();
    const r = new Rect({ width: 100, height: 50, fill: '#fff' });
    r.draw(ctx);
    expect(ctx.rect).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });
});

describe('Text', () => {
  it('initializes with default text', () => {
    const t = new Text({ text: 'Hello' });
    expect(t.text).toBe('Hello');
  });

  it('draws text', () => {
    const ctx = mockCtx();
    const t = new Text({ text: 'Hi', fill: '#000' });
    t.draw(ctx);
    expect(ctx.fillText).toHaveBeenCalledWith('Hi', 0, 0, undefined);
  });
});

describe('Path', () => {
  it('does not draw with fewer than 2 points', () => {
    const ctx = mockCtx();
    const p = new Path({ points: [[0, 0]], stroke: 'blue' });
    p.draw(ctx);
    expect(ctx.moveTo).not.toHaveBeenCalled();
  });

  it('draws a line between 2 points', () => {
    const ctx = mockCtx();
    const p = new Path({ points: [[0, 0], [100, 100]], stroke: 'blue' });
    p.draw(ctx);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100);
  });
});

describe('Shape.animate', () => {
  it('returns tweens for valid properties', () => {
    global.requestAnimationFrame = vi.fn();
    const c = new Circle({ radius: 20 });
    const tweens = c.animate({ radius: 50 }, { duration: 300 });
    expect(tweens.length).toBe(1);
  });
});
