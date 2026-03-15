import gsap from 'gsap';
import { SvgAnimation } from '../core/SvgAnimation.js';

// Unique ID counter so multiple instances don't share SVG defs IDs
let _uid = 0;

// Heart bezier path — coordinates match the original Canvas implementation
// (hw=60, hh=55, center at 0,0)
const HEART_PATH =
  'M 0,-8.25 ' +
  'C -6,-55 -60,-49.5 -60,-16.5 ' +
  'C -60,11 -18,33 0,55 ' +
  'C 18,33 60,11 60,-16.5 ' +
  'C 60,-49.5 6,-55 0,-8.25 Z';

/**
 * Heart beat animation — SVG + GSAP implementation.
 *
 * Replaces the Canvas/rAF version. A GSAP timeline drives the cardiac
 * cycle (systole → diastole → rest) at the requested BPM. All shape
 * geometry lives in a static SVG; GSAP animates scale and the glow filter.
 *
 * Parameters:
 *   - bpm: beats per minute (default 72)
 *   - contractility: contraction strength 0–1 (default 0.7)
 *   - sarcomereLength: 1.6–2.6 μm, Frank-Starling depth (default 2.2)
 *   - showLabels: show LV/RV/LA/RA text labels (default true)
 *   - width / height: SVG CSS size in px (defaults 400 × 360)
 *
 * @example
 * const heart = new HeartBeat('#container', { bpm: 72 });
 * heart.play();
 * heart.setBPM(100);
 */
export class HeartBeat extends SvgAnimation {
  /**
   * @param {string|Element} container
   * @param {object} [params]
   * @param {number} [params.bpm=72]
   * @param {number} [params.contractility=0.7]
   * @param {number} [params.sarcomereLength=2.2]
   * @param {boolean} [params.showLabels=true]
   * @param {number} [params.width=400]
   * @param {number} [params.height=360]
   */
  constructor(container, params = {}) {
    super(container, { width: 400, height: 360, ...params });
    this.bpm = params.bpm ?? 72;
    this.contractility = params.contractility ?? 0.7;
    this.sarcomereLength = params.sarcomereLength ?? 2.2;
    this._showLabels = params.showLabels ?? true;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  setBPM(bpm) {
    this.bpm = Math.max(1, bpm);
    this._rebuildTimeline();
    this.emit('bpmChanged', this.bpm);
    return this;
  }

  setContractility(v) {
    this.contractility = Math.max(0, Math.min(1, v));
    this._rebuildTimeline();
    return this;
  }

  setSarcomereLength(v) {
    this.sarcomereLength = Math.max(1.6, Math.min(2.6, v));
    this._rebuildTimeline();
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    if (this._labelGroup) this._labelGroup.style.display = show ? '' : 'none';
    return this;
  }

  triggerArrhythmia() {
    const originalBPM = this.bpm;
    this.setBPM(this.bpm * 2.5);
    setTimeout(() => this.setBPM(originalBPM), 3000);
    this.emit('arrhythmia');
    return this;
  }

  // ─── SvgAnimation overrides ───────────────────────────────────────────────

  _setup(svg) {
    const id = ++_uid;

    // viewBox centres the heart (hw=60, hh=55) with room for glow
    svg.setAttribute('viewBox', '-85 -75 170 150');

    // ── Defs ──────────────────────────────────────────────────────────────
    const defs = this._el('defs');

    // Linear gradient — dark red → red → darker red
    const lg = this._el('linearGradient', {
      id: `hbGrad${id}`,
      x1: '-1', y1: '-1', x2: '1', y2: '1',
      gradientUnits: 'objectBoundingBox',
    });
    lg.appendChild(this._el('stop', { offset: '0%',   'stop-color': '#c0392b' }));
    lg.appendChild(this._el('stop', { offset: '50%',  'stop-color': '#e74c3c' }));
    lg.appendChild(this._el('stop', { offset: '100%', 'stop-color': '#922b21' }));
    defs.appendChild(lg);

    // Drop-shadow filter for systolic glow
    const filter = this._el('filter', { id: `hbGlow${id}`, x: '-30%', y: '-30%', width: '160%', height: '160%' });
    this._glowBlur = this._el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '0', result: 'blur' });
    const merge = this._el('feMerge');
    merge.appendChild(this._el('feMergeNode', { in: 'blur' }));
    merge.appendChild(this._el('feMergeNode', { in: 'SourceGraphic' }));
    filter.appendChild(this._glowBlur);
    filter.appendChild(merge);
    defs.appendChild(filter);

    svg.appendChild(defs);

    // ── Heart group (scaled during beat) ──────────────────────────────────
    this._heartGroup = this._el('g', { filter: `url(#hbGlow${id})` });

    // Outer heart shape
    this._heartGroup.appendChild(this._el('path', {
      d: HEART_PATH,
      fill: `url(#hbGrad${id})`,
      stroke: '#7b241c',
      'stroke-width': '2',
    }));

    // Chambers — drawn as ellipses at contraction cv=1
    // LV: cx=-16.8, cy=5.5, rx=16.8, ry=19.25, rotate=-11.5°
    this._lv = this._el('ellipse', { cx: '-16.8', cy: '5.5', rx: '16.8', ry: '19.25',
      fill: 'rgba(100,0,0,0.5)', transform: 'rotate(-11.5 -16.8 5.5)' });
    // RV: cx=13.2, cy=8.25, rx=14.4, ry=16.5, rotate=11.5°
    this._rv = this._el('ellipse', { cx: '13.2',  cy: '8.25', rx: '14.4', ry: '16.5',
      fill: 'rgba(120,50,50,0.4)',  transform: 'rotate(11.5 13.2 8.25)' });
    // LA: cx=-15, cy=-27.5, rx=12, ry=9.9, rotate=-5.7°
    this._la = this._el('ellipse', { cx: '-15',   cy: '-27.5', rx: '12',   ry: '9.9',
      fill: 'rgba(180,80,80,0.5)',  transform: 'rotate(-5.7 -15 -27.5)' });
    // RA: cx=12, cy=-26.4, rx=10.8, ry=8.8, rotate=5.7°
    this._ra = this._el('ellipse', { cx: '12',    cy: '-26.4', rx: '10.8', ry: '8.8',
      fill: 'rgba(160,100,100,0.4)', transform: 'rotate(5.7 12 -26.4)' });

    // Interventricular septum line
    const septum = this._el('line', {
      x1: '-3', y1: '-12', x2: '1', y2: '36',
      stroke: 'rgba(80,0,0,0.6)', 'stroke-width': '3',
    });

    for (const el of [this._lv, this._rv, this._la, this._ra, septum]) {
      this._heartGroup.appendChild(el);
    }
    svg.appendChild(this._heartGroup);

    // ── Labels (drawn on top, outside the scaled group) ───────────────────
    this._labelGroup = this._el('g', {
      'font-size': '11', 'font-family': 'sans-serif', fill: '#fff',
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
    });
    const labels = [
      { text: 'LV', x: -16.8, y: 5.5 },
      { text: 'RV', x: 13.2,  y: 8.25 },
      { text: 'LA', x: -15,   y: -27.5 },
      { text: 'RA', x: 12,    y: -26.4 },
    ];
    for (const { text, x, y } of labels) {
      const t = this._el('text', { x, y });
      t.textContent = text;
      this._labelGroup.appendChild(t);
    }
    if (!this._showLabels) this._labelGroup.style.display = 'none';
    svg.appendChild(this._labelGroup);
  }

  _createTimeline() {
    // Frank-Starling: sarcomere length adds to contraction depth
    const frankStarling = (this.sarcomereLength - 1.6) / 1.0;
    const strength = this.contractility * (0.5 + 0.5 * frankStarling);

    const contractX = 1 - strength * 0.18;
    const contractY = 1 - strength * 0.14;
    const chamberScale = 1 - strength * 0.3; // chambers shrink during systole
    const glowPeak = 12 * strength;

    const beatSec = 60 / this.bpm;       // seconds per beat
    const systole = beatSec * 0.35;      // 35% of beat
    const diastole = beatSec * 0.65;     // 65% of beat

    const tl = gsap.timeline({ repeat: -1, onRepeat: () => this.emit('beat') });

    // ── Systole: contract ──────────────────────────────────────────────────
    tl.to(this._heartGroup, {
      scaleX: contractX, scaleY: contractY,
      svgOrigin: '0 0',
      duration: systole * 0.5,
      ease: 'power2.in',
      onStart: () => this.emit('systole'),
    });

    // Glow ramps up in parallel with contraction
    tl.to(this._glowBlur, {
      attr: { stdDeviation: glowPeak },
      duration: systole * 0.5,
      ease: 'power2.in',
    }, '<');

    // ── Relaxation ────────────────────────────────────────────────────────
    tl.to(this._heartGroup, {
      scaleX: 1, scaleY: 1,
      svgOrigin: '0 0',
      duration: systole * 0.5,
      ease: 'power2.out',
      onStart: () => this.emit('diastole'),
    });

    tl.to(this._glowBlur, {
      attr: { stdDeviation: 0 },
      duration: systole * 0.5,
      ease: 'power2.out',
    }, '<');

    // ── Diastolic rest ────────────────────────────────────────────────────
    tl.to({}, { duration: diastole });

    return tl;
  }
}
