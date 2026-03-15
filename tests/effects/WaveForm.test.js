import { describe, it, expect, vi } from 'vitest';
import { WaveForm } from '../../src/effects/WaveForm.js';

function mockCanvas(w = 800, h = 600) {
  return { width: w, height: h };
}

describe('WaveForm', () => {
  it('push adds data points', () => {
    const wf = new WaveForm(mockCanvas(), { maxPoints: 100 });
    wf.push(0.5);
    wf.push(0.8);
    expect(wf._data.length).toBe(2);
  });

  it('push respects maxPoints', () => {
    const wf = new WaveForm(mockCanvas(), { maxPoints: 3 });
    wf.push(1);
    wf.push(2);
    wf.push(3);
    wf.push(4);
    expect(wf._data.length).toBe(3);
    expect(wf._data[0]).toBe(2); // oldest dropped
  });

  it('setData sets playback data', () => {
    const wf = new WaveForm(mockCanvas());
    wf.setData([1, 2, 3, 4, 5]);
    expect(wf._playData.length).toBe(5);
    expect(wf._playIndex).toBe(0);
  });

  it('play mode advances through data on update', () => {
    const wf = new WaveForm(mockCanvas(), { maxPoints: 50 });
    wf.setData([10, 20, 30, 40]);
    wf.play();
    wf.update(100); // should push some points
    expect(wf._data.length).toBeGreaterThan(0);
  });

  it('addLabel stores label', () => {
    const wf = new WaveForm(mockCanvas());
    wf.addLabel('Test', 0.5, '#ff0');
    expect(wf._labels.length).toBe(1);
    expect(wf._labels[0].label).toBe('Test');
  });

  it('emits complete when playback finishes', () => {
    const wf = new WaveForm(mockCanvas(), { maxPoints: 100 });
    const fn = vi.fn();
    wf.on('complete', fn);
    wf.setData([1, 2]);
    wf.play();
    wf.update(10000); // fast forward
    expect(fn).toHaveBeenCalled();
  });
});
