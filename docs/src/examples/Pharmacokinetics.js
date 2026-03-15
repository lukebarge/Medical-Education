import { Animation } from '../core/Animation.js';
import { WaveForm } from '../effects/WaveForm.js';

/**
 * Pharmacokinetics (PK) curve animation showing drug concentration over time.
 * Generates and animates a concentration-time curve based on a one-compartment model.
 *
 * Parameters:
 *   - Cmax: peak concentration mg/L (default 100)
 *   - tmax: time to peak in hours (default 1)
 *   - halfLife: elimination half-life in hours (default 4)
 *   - Vd: volume of distribution L (default 30)
 *   - playSpeed: how fast to animate (default 1)
 *
 * @example
 * const pk = new Pharmacokinetics(canvas, { Cmax: 80, halfLife: 6 });
 * pk.play();
 * pk.setHalfLife(3); // shorter half-life = faster elimination
 */
export class Pharmacokinetics extends Animation {
  constructor(canvas, params = {}) {
    super(canvas, params);
    this.Cmax = params.Cmax !== undefined ? params.Cmax : 100;
    this.tmax = params.tmax !== undefined ? params.tmax : 1;
    this.halfLife = params.halfLife !== undefined ? params.halfLife : 4;
    this.Vd = params.Vd !== undefined ? params.Vd : 30;
    this._showLabels = params.showLabels !== undefined ? params.showLabels : true;
    this.playSpeed = params.playSpeed !== undefined ? params.playSpeed : 1;

    this._simTime = 0;       // simulated time in hours
    this._maxSimTime = 24;   // show 24 hours
    this._elapsed = 0;
    this._msPerHour = 3000 / this.playSpeed; // real ms per sim hour

    this._waveform = new WaveForm(canvas, {
      x: 60,
      y: 30,
      width: canvas.width - 80,
      height: canvas.height - 100,
      yMin: 0,
      yMax: this.Cmax * 1.2,
      color: '#3399ff',
      lineWidth: 2.5,
      scrolling: false,
      maxPoints: 500,
      background: '#fafafa',
      showAxes: true,
      axisColor: '#ccc'
    });

    this._points = [];
    this._currentConc = 0;
  }

  setCmax(v) {
    this.Cmax = Math.max(1, v);
    this._reset();
    return this;
  }

  setHalfLife(h) {
    this.halfLife = Math.max(0.1, h);
    this._reset();
    return this;
  }

  setTmax(h) {
    this.tmax = Math.max(0.01, h);
    this._reset();
    return this;
  }

  setVd(v) {
    this.Vd = Math.max(1, v);
    this._reset();
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    return this;
  }

  _reset() {
    this._simTime = 0;
    this._elapsed = 0;
    this._points = [];
    this._waveform._data = [];
    this._waveform.yMax = this.Cmax * 1.2;
    this._currentConc = 0;
  }

  reset() {
    this._reset();
  }

  /**
   * Bateman equation: C(t) = Cmax * (e^(-ke*t) - e^(-ka*t)) / normalization
   */
  _concentration(t) {
    if (t <= 0) return 0;
    const ke = Math.LN2 / this.halfLife;       // elimination rate constant
    const ka = Math.LN2 / (this.tmax * 0.3);  // absorption rate constant (faster)
    const norm = Math.exp(-ke * this.tmax) - Math.exp(-ka * this.tmax);
    if (Math.abs(norm) < 1e-10) return 0;
    return this.Cmax * (Math.exp(-ke * t) - Math.exp(-ka * t)) / norm;
  }

  _update(dt) {
    if (this._simTime >= this._maxSimTime) return;

    this._elapsed += dt;
    const hoursElapsed = this._elapsed / this._msPerHour;
    const targetSimTime = Math.min(hoursElapsed, this._maxSimTime);

    // Add points between last simTime and targetSimTime
    const step = 0.05; // hours
    while (this._simTime < targetSimTime) {
      this._simTime += step;
      const c = Math.max(0, this._concentration(this._simTime));
      this._waveform.push(c);
      this._currentConc = c;
      this._points.push({ t: this._simTime, c });
    }

    if (this._simTime >= this._maxSimTime) {
      this.emit('complete');
    }
  }

  _draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    this._waveform.draw(ctx);
    this._drawAxesLabels(ctx);

    if (this._showLabels) {
      this._drawAnnotations(ctx);
    }
  }

  _drawAxesLabels(ctx) {
    const { x, y, width, height } = this._waveform;
    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#666';

    // X axis: time labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = 0; t <= this._maxSimTime; t += 4) {
      const px = x + (t / this._maxSimTime) * width;
      ctx.fillText(`${t}h`, px, y + height + 5);
    }
    ctx.fillText('Time (hours)', x + width / 2, y + height + 20);

    // Y axis: concentration labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const val = (i / steps) * this.Cmax * 1.2;
      const py = y + height - (i / steps) * height;
      ctx.fillText(val.toFixed(0), x - 5, py);
    }

    // Y axis title (rotated)
    ctx.save();
    ctx.translate(15, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Concentration (mg/L)', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  _drawAnnotations(ctx) {
    const { x, y, width, height } = this._waveform;
    ctx.save();

    // Cmax marker
    const cmaxX = x + (this.tmax / this._maxSimTime) * width;
    const cmaxY = y + height - (this.Cmax / (this.Cmax * 1.2)) * height;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cmaxX, y + height);
    ctx.lineTo(cmaxX, cmaxY);
    ctx.moveTo(x, cmaxY);
    ctx.lineTo(cmaxX, cmaxY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cmax label
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Cmax = ${this.Cmax} mg/L`, cmaxX + 5, cmaxY);
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText(`tmax = ${this.tmax}h`, cmaxX + 5, cmaxY + 14);

    // Half-life marker
    const thalf = this.tmax + this.halfLife;
    const chalvX = x + (thalf / this._maxSimTime) * width;
    const chalvY = y + height - (this.Cmax * 0.5 / (this.Cmax * 1.2)) * height;

    if (thalf < this._maxSimTime) {
      ctx.strokeStyle = '#9933aa';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chalvX, y + height);
      ctx.lineTo(chalvX, chalvY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#9933aa';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`t½ = ${this.halfLife}h`, chalvX, chalvY - 8);
    }

    // Current concentration
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#3399ff';
    ctx.textAlign = 'right';
    ctx.fillText(`Current: ${this._currentConc.toFixed(1)} mg/L`, x + width - 5, y + 15);

    // PK parameters box
    const bx = x + width - 140;
    const by = y + 35;
    ctx.fillStyle = 'rgba(240,240,255,0.85)';
    ctx.strokeStyle = '#aac';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(bx, by, 130, 70);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Vd = ${this.Vd} L`, bx + 8, by + 8);
    ctx.fillText(`ke = ${(Math.LN2 / this.halfLife).toFixed(3)} h⁻¹`, bx + 8, by + 24);
    ctx.fillText(`AUC ≈ ${(this.Cmax * this.halfLife / Math.LN2 * 0.9).toFixed(0)} mg·h/L`, bx + 8, by + 40);
    ctx.fillText(`t = ${Math.min(this._simTime, this._maxSimTime).toFixed(1)}h`, bx + 8, by + 56);

    ctx.restore();
  }
}
