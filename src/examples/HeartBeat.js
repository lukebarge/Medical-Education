import { Animation } from '../core/Animation.js';

// Number of pre-baked contraction frames (0 = relaxed, N-1 = fully contracted)
const FRAME_COUNT = 64;
// Offscreen frame dimensions (large enough for heart + max shadow blur)
const FRAME_W = 160;
const FRAME_H = 150;
// Heart center within each frame
const FC_X = FRAME_W / 2;
const FC_Y = FRAME_H / 2;

/**
 * Heart beat animation showing the cardiac cycle (systole and diastole).
 *
 * Uses a game-dev sprite approach: all FRAME_COUNT heart frames are rendered
 * once at init into OffscreenCanvas objects. Every animation tick just calls
 * ctx.drawImage() to blit the right frame — no bezier curves rebuilt at runtime.
 * Dynamic overlays (labels) are still drawn live on top.
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
    this._phase = 0;
    this._beatProgress = 0;
    this._isContracted = false;

    // Pre-bake all heart frames into OffscreenCanvases once
    this._frames = this._bakeSprites();
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

  // ─── Sprite baking (runs once at init) ────────────────────────────────────

  /**
   * Pre-render every contraction level to an OffscreenCanvas.
   * Returns an array of FRAME_COUNT OffscreenCanvas objects.
   */
  _bakeSprites() {
    const frames = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const contraction = i / (FRAME_COUNT - 1); // 0..1
      const oc = new OffscreenCanvas(FRAME_W, FRAME_H);
      const ctx = oc.getContext('2d');
      ctx.translate(FC_X, FC_Y);
      this._renderHeartFrame(ctx, contraction);
      frames.push(oc);
    }
    return frames;
  }

  /**
   * Render one heart frame (heart shape + chambers) at a given contraction level.
   * This is called only during sprite baking, not on every animation tick.
   */
  _renderHeartFrame(ctx, c) {
    const baseW = 120;
    const baseH = 110;
    const contractX = 1 - c * 0.18;
    const contractY = 1 - c * 0.14;

    // Bake the shadow/glow into the frame so drawImage carries it for free
    if (c > 0.3) {
      ctx.shadowColor = 'rgba(200,0,0,0.3)';
      ctx.shadowBlur = 15 * c;
    }

    ctx.save();
    ctx.scale(contractX, contractY);
    this._drawHeartShape(ctx, 0, 0, baseW, baseH);
    ctx.restore();

    ctx.shadowBlur = 0;

    ctx.save();
    ctx.scale(contractX, contractY);
    this._drawChambers(ctx, 0, 0, baseW, baseH, c);
    ctx.restore();
  }

  // ─── Animation loop ────────────────────────────────────────────────────────

  _update(dt) {
    const beatDuration = 60000 / this.bpm;
    this._phase += dt / beatDuration;
    if (this._phase >= 1) {
      this._phase -= 1;
      this.emit('beat');
    }

    // Systole: 0..0.35 of cycle  |  Diastole: 0.35..1.0
    if (this._phase < 0.35) {
      const t = this._phase / 0.35;
      const frankStarling = (this.sarcomereLength - 1.6) / 1.0;
      const strength = this.contractility * (0.5 + 0.5 * frankStarling);
      this._beatProgress = Math.sin(t * Math.PI) * strength;
      if (!this._isContracted && t > 0.5) {
        this._isContracted = true;
        this.emit('systole');
      }
    } else {
      this._beatProgress *= 0.92;
      if (this._isContracted && this._phase > 0.6) {
        this._isContracted = false;
        this.emit('diastole');
      }
    }
  }

  _draw(ctx) {
    const { x, y, scale: s } = this;

    // Pick the pre-baked frame nearest to the current contraction level
    const frameIdx = Math.round(this._beatProgress * (FRAME_COUNT - 1));
    const frame = this._frames[Math.max(0, Math.min(FRAME_COUNT - 1, frameIdx))];

    // Blit the sprite — no path construction, no bezier math
    const dw = frame.width * s;
    const dh = frame.height * s;
    ctx.drawImage(frame, x - dw / 2, y - dh / 2, dw, dh);

    // Labels are dynamic text — still drawn live on top of the sprite
    if (this._showLabels) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      this._drawLabels(ctx, 120, 110);
      ctx.restore();
    }
  }

  // ─── Internal drawing helpers (used only during _bakeSprites) ─────────────

  _drawHeartShape(ctx, cx, cy, w, h) {
    const hw = w / 2;
    const hh = h / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy - hh * 0.15);
    ctx.bezierCurveTo(cx - hw * 0.1, cy - hh, cx - hw, cy - hh * 0.9, cx - hw, cy - hh * 0.3);
    ctx.bezierCurveTo(cx - hw, cy + hh * 0.2, cx - hw * 0.3, cy + hh * 0.6, cx, cy + hh);
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

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx - hw * 0.28, cy + hh * 0.1, hw * 0.28 * cv, hh * 0.35 * cv, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,0,0,0.5)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx + hw * 0.22, cy + hh * 0.15, hw * 0.24 * cv, hh * 0.3 * cv, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,50,50,0.4)';
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.05, cy - hh * 0.2);
    ctx.lineTo(cx + hw * 0.02, cy + hh * 0.6);
    ctx.strokeStyle = 'rgba(80,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx - hw * 0.25, cy - hh * 0.5, hw * 0.2, hh * 0.18, -0.1, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,80,80,0.5)';
    ctx.fill();

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
