import { Animation } from '../core/Animation.js';
import { Renderer } from '../core/Renderer.js';

/**
 * Heart beat animation showing the cardiac cycle (systole and diastole).
 * Draws a schematic heart cross-section that contracts and relaxes.
 *
 * Parameters:
 *   - bpm: beats per minute (40–200)
 *   - contractility: contraction strength 0–1
 *   - sarcomereLength: 1.6–2.6 μm (Frank-Starling: affects contraction depth)
 *   - showLabels: toggle anatomical labels
 *
 * @example
 * const heart = new HeartBeat(canvas, { bpm: 72 });
 * heart.play();
 * heart.setBPM(120);
 */
export class HeartBeat extends Animation {
  /**
   * @param {import('../core/Canvas.js').Canvas} canvas
   * @param {object} [params]
   * @param {number} [params.bpm=72]
   * @param {number} [params.contractility=0.7]
   * @param {number} [params.sarcomereLength=2.2] - μm
   * @param {boolean} [params.showLabels=true]
   * @param {number} [params.x] - center x, defaults to canvas center
   * @param {number} [params.y] - center y, defaults to canvas center
   * @param {number} [params.scale=1]
   */
  constructor(canvas, params = {}) {
    super(canvas, params);
    this.bpm = params.bpm !== undefined ? params.bpm : 72;
    this.contractility = params.contractility !== undefined ? params.contractility : 0.7;
    this.sarcomereLength = params.sarcomereLength !== undefined ? params.sarcomereLength : 2.2;
    this._showLabels = params.showLabels !== undefined ? params.showLabels : true;
    this.x = params.x !== undefined ? params.x : canvas.width / 2;
    this.y = params.y !== undefined ? params.y : canvas.height / 2;
    this.scale = params.scale !== undefined ? params.scale : 1;

    // Internal animation state
    this._phase = 0;      // 0..1 within one beat cycle
    this._beatProgress = 0;  // contraction amount 0..1
    this._isContracted = false;
  }

  setBPM(bpm) {
    this.bpm = Math.max(1, bpm);
    this.emit('bpmChanged', this.bpm);
    return this;
  }

  setContractility(v) {
    this.contractility = Math.max(0, Math.min(1, v));
    return this;
  }

  setSarcomereLength(v) {
    this.sarcomereLength = Math.max(1.6, Math.min(2.6, v));
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    return this;
  }

  triggerArrhythmia() {
    // Temporarily double BPM for 3 beats then restore
    const originalBPM = this.bpm;
    this.setBPM(this.bpm * 2.5);
    setTimeout(() => this.setBPM(originalBPM), 3000);
    this.emit('arrhythmia');
    return this;
  }

  reset() {
    this._phase = 0;
    this._beatProgress = 0;
  }

  _update(dt) {
    const beatDuration = 60000 / this.bpm; // ms per beat
    this._phase += dt / beatDuration;
    if (this._phase >= 1) {
      this._phase -= 1;
      this.emit('beat');
    }

    // Systole: 0..0.35 of cycle  |  Diastole: 0.35..1.0
    if (this._phase < 0.35) {
      const t = this._phase / 0.35;
      // Frank-Starling: longer sarcomere → more forceful contraction
      const frankStarling = (this.sarcomereLength - 1.6) / 1.0; // 0..1
      const strength = this.contractility * (0.5 + 0.5 * frankStarling);
      this._beatProgress = Math.sin(t * Math.PI) * strength;
      if (!this._isContracted && t > 0.5) {
        this._isContracted = true;
        this.emit('systole');
      }
    } else {
      this._beatProgress *= 0.92; // relax
      if (this._isContracted && this._phase > 0.6) {
        this._isContracted = false;
        this.emit('diastole');
      }
    }
  }

  _draw(ctx) {
    const { x, y, scale } = this;
    const c = this._beatProgress; // contraction factor
    const s = scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    const baseW = 120;
    const baseH = 110;
    const contractX = 1 - c * 0.18;
    const contractY = 1 - c * 0.14;

    // Shadow/glow during systole
    if (c > 0.3) {
      ctx.shadowColor = 'rgba(200,0,0,0.3)';
      ctx.shadowBlur = 15 * c;
    }

    // Draw heart outline using bezier curves
    ctx.save();
    ctx.scale(contractX, contractY);
    this._drawHeartShape(ctx, 0, 0, baseW, baseH);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Internal chambers
    ctx.save();
    ctx.scale(contractX, contractY);
    this._drawChambers(ctx, 0, 0, baseW, baseH, c);
    ctx.restore();

    // Labels
    if (this._showLabels) {
      this._drawLabels(ctx, baseW, baseH);
    }

    ctx.restore();
  }

  _drawHeartShape(ctx, cx, cy, w, h) {
    const hw = w / 2;
    const hh = h / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy - hh * 0.15);
    // Left lobe
    ctx.bezierCurveTo(cx - hw * 0.1, cy - hh, cx - hw, cy - hh * 0.9, cx - hw, cy - hh * 0.3);
    ctx.bezierCurveTo(cx - hw, cy + hh * 0.2, cx - hw * 0.3, cy + hh * 0.6, cx, cy + hh);
    // Right side
    ctx.bezierCurveTo(cx + hw * 0.3, cy + hh * 0.6, cx + hw, cy + hh * 0.2, cx + hw, cy - hh * 0.3);
    ctx.bezierCurveTo(cx + hw, cy - hh * 0.9, cx + hw * 0.1, cy - hh, cx, cy - hh * 0.15);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - hw, cy - hh, cx + hw, cy + hh);
    grad.addColorStop(0, '#c0392b');
    grad.addColorStop(0.5, '#e74c3c');
    grad.addColorStop(1, '#922b21');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#7b241c';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  _drawChambers(ctx, cx, cy, w, h, contraction) {
    const hw = w / 2;
    const hh = h / 2;
    const cv = 1 - contraction * 0.3;

    // Left ventricle (bottom left)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx - hw * 0.28, cy + hh * 0.1, hw * 0.28 * cv, hh * 0.35 * cv, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,0,0,0.5)';
    ctx.fill();
    ctx.restore();

    // Right ventricle (bottom right)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx + hw * 0.22, cy + hh * 0.15, hw * 0.24 * cv, hh * 0.3 * cv, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,50,50,0.4)';
    ctx.fill();
    ctx.restore();

    // Septum
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.05, cy - hh * 0.2);
    ctx.lineTo(cx + hw * 0.02, cy + hh * 0.6);
    ctx.strokeStyle = 'rgba(80,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Left atrium (top left)
    ctx.beginPath();
    ctx.ellipse(cx - hw * 0.25, cy - hh * 0.5, hw * 0.2, hh * 0.18, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,80,80,0.5)';
    ctx.fill();

    // Right atrium (top right)
    ctx.beginPath();
    ctx.ellipse(cx + hw * 0.2, cy - hh * 0.48, hw * 0.18, hh * 0.16, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160,100,100,0.4)';
    ctx.fill();
  }

  _drawLabels(ctx, w, h) {
    const hw = w / 2;
    const hh = h / 2;
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labels = [
      { text: 'LV', x: -hw * 0.28, y: hh * 0.1 },
      { text: 'RV', x: hw * 0.22, y: hh * 0.15 },
      { text: 'LA', x: -hw * 0.25, y: -hh * 0.5 },
      { text: 'RA', x: hw * 0.2, y: -hh * 0.48 },
    ];

    for (const lbl of labels) {
      ctx.fillText(lbl.text, lbl.x, lbl.y);
    }
  }
}
