import { Animation } from '../core/Animation.js';

/**
 * Breathing cycle animation showing lung inflation and deflation.
 *
 * Parameters:
 *   - rate: breaths per minute (default 14)
 *   - tidalVolume: relative volume 0.1–1.0 (default 0.5)
 *   - airwayResistance: 0–1, higher = slower fill (default 0.3)
 *   - showLabels: toggle labels
 *
 * @example
 * const breath = new Breathing(canvas, { rate: 14 });
 * breath.play();
 * breath.setRate(20);
 */
export class Breathing extends Animation {
  constructor(canvas, params = {}) {
    super(canvas, params);
    this.rate = params.rate !== undefined ? params.rate : 14;
    this.tidalVolume = params.tidalVolume !== undefined ? params.tidalVolume : 0.5;
    this.airwayResistance = params.airwayResistance !== undefined ? params.airwayResistance : 0.3;
    this._showLabels = params.showLabels !== undefined ? params.showLabels : true;
    this.x = params.x !== undefined ? params.x : canvas.width / 2;
    this.y = params.y !== undefined ? params.y : canvas.height / 2;
    this.scale = params.scale !== undefined ? params.scale : 1;

    this._phase = 0;    // 0..1 within one cycle
    this._inflation = 0; // 0..1 current lung volume
  }

  setRate(rate) {
    this.rate = Math.max(1, rate);
    this.emit('rateChanged', this.rate);
    return this;
  }

  setTidalVolume(v) {
    this.tidalVolume = Math.max(0.1, Math.min(1.0, v));
    return this;
  }

  setAirwayResistance(v) {
    this.airwayResistance = Math.max(0, Math.min(1.0, v));
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    return this;
  }

  reset() {
    this._phase = 0;
    this._inflation = 0;
  }

  _update(dt) {
    const cycleDuration = 60000 / this.rate;
    this._phase += dt / cycleDuration;
    if (this._phase >= 1) {
      this._phase -= 1;
      this.emit('breathCycle');
    }

    // Inhale: 0..0.4,  Exhale: 0.4..1.0
    // Resistance slows fill rate
    const speed = 1 - this.airwayResistance * 0.7;
    if (this._phase < 0.4) {
      const t = this._phase / 0.4;
      const target = this.tidalVolume * Math.sin(t * Math.PI * 0.5);
      this._inflation += (target - this._inflation) * speed * 0.15;
      if (!this._inhaling && this._phase > 0.05) {
        this._inhaling = true;
        this.emit('inhale');
      }
    } else {
      const t = (this._phase - 0.4) / 0.6;
      const target = this.tidalVolume * (1 - Math.sin(t * Math.PI * 0.5));
      this._inflation += (target - this._inflation) * speed * 0.12;
      if (this._inhaling && this._phase > 0.6) {
        this._inhaling = false;
        this.emit('exhale');
      }
    }
  }

  _draw(ctx) {
    const { x, y, scale } = this;
    const inf = this._inflation;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const gap = 20;
    const baseW = 85;
    const baseH = 120;

    // Draw left and right lungs
    this._drawLung(ctx, -gap - baseW * 0.5, 0, baseW, baseH, inf, 'left');
    this._drawLung(ctx, gap + baseW * 0.5, 0, baseW, baseH, inf, 'right');

    // Trachea
    ctx.beginPath();
    ctx.moveTo(0, -baseH * 0.6);
    ctx.lineTo(0, -baseH * 0.2);
    ctx.moveTo(0, -baseH * 0.3);
    ctx.lineTo(-gap - baseW * 0.2, -baseH * 0.1);
    ctx.moveTo(0, -baseH * 0.3);
    ctx.lineTo(gap + baseW * 0.2, -baseH * 0.1);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    if (this._showLabels) {
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#555';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Left Lung', -gap - baseW * 0.5, baseH * 0.3);
      ctx.fillText('Right Lung', gap + baseW * 0.5, baseH * 0.3);
      ctx.fillText(`Volume: ${(inf * 100).toFixed(0)}%`, 0, baseH * 0.6);
    }

    ctx.restore();
  }

  _drawLung(ctx, cx, cy, w, h, inflation, side) {
    const scaleX = 1 + inflation * 0.25;
    const scaleY = 1 + inflation * 0.2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scaleX, scaleY);

    const hw = w / 2;
    const hh = h / 2;
    const sign = side === 'left' ? -1 : 1;

    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.8);
    ctx.bezierCurveTo(
      sign * hw * 0.3, -hh,
      sign * hw, -hh * 0.7,
      sign * hw, -hh * 0.1
    );
    ctx.bezierCurveTo(
      sign * hw, hh * 0.5,
      sign * hw * 0.5, hh,
      0, hh
    );
    ctx.bezierCurveTo(
      -sign * hw * 0.1, hh,
      -sign * hw * 0.2, hh * 0.4,
      0, 0
    );
    ctx.closePath();

    const alpha = 0.5 + inflation * 0.3;
    ctx.fillStyle = `rgba(220,140,140,${alpha})`;
    ctx.fill();
    ctx.strokeStyle = '#c0605a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bronchiole detail
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.3);
    ctx.bezierCurveTo(sign * hw * 0.3, -hh * 0.1, sign * hw * 0.6, hh * 0.2, sign * hw * 0.5, hh * 0.5);
    ctx.strokeStyle = 'rgba(180,80,80,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}
