import gsap from 'gsap';
import { SvgAnimation } from '../core/SvgAnimation.js';
import heartSvgRaw from '../../anatomical-heart-svgrepo-com.svg?raw';

// Unique ID counter so multiple instances don't share SVG defs IDs
let _uid = 0;

// Parse the anatomical heart SVG once at module load time
const _heartSvgEl = new DOMParser()
  .parseFromString(heartSvgRaw, 'image/svg+xml')
  .documentElement;

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

    // The anatomical SVG has viewBox "0 0 36 36"; translate by (-18,-18) centres it at origin.
    svg.setAttribute('viewBox', '-20 -20 40 40');

    // ── Defs — glow filter only ────────────────────────────────────────────
    const defs = this._el('defs');
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

    // Clone all child nodes from the parsed anatomical SVG, centred at origin
    const inner = this._el('g', { transform: 'translate(-18 -18)' });
    for (const child of _heartSvgEl.childNodes) {
      inner.appendChild(child.cloneNode(true));
    }
    this._heartGroup.appendChild(inner);
    svg.appendChild(this._heartGroup);

    // ── Labels (positioned on the anatomical heart, in centred coordinates) ─
    this._labelGroup = this._el('g', {
      'font-size': '2.5', 'font-family': 'sans-serif', fill: '#fff',
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
      'pointer-events': 'none',
    });
    const labels = [
      { text: 'LV', x: -8,  y:  4 },
      { text: 'RV', x:  5,  y:  4 },
      { text: 'LA', x: -8,  y: -8 },
      { text: 'RA', x:  5,  y: -8 },
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
