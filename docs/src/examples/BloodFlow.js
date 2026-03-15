import { Animation } from '../core/Animation.js';
import { FlowPath } from '../effects/FlowPath.js';

/**
 * Blood flow animation showing particles circulating through vessels.
 * Demonstrates the effect of vascular resistance and blood pressure.
 *
 * Parameters:
 *   - vascularResistance: 0–2 (Poiseuille's law — higher = slower flow)
 *   - pressure: 60–200 mmHg (higher = faster particles)
 *   - viscosity: 0.5–3 (higher = slower)
 *   - showLabels
 *
 * @example
 * const flow = new BloodFlow(canvas, { vascularResistance: 1.0, pressure: 120 });
 * flow.play();
 * flow.setVascularResistance(1.8);
 */
export class BloodFlow extends Animation {
  constructor(canvas, params = {}) {
    super(canvas, params);
    this.vascularResistance = params.vascularResistance !== undefined ? params.vascularResistance : 1.0;
    this.pressure = params.pressure !== undefined ? params.pressure : 120;
    this.viscosity = params.viscosity !== undefined ? params.viscosity : 1.0;
    this._showLabels = params.showLabels !== undefined ? params.showLabels : true;

    const w = canvas.width;
    const h = canvas.height;

    // Aorta path (large artery top)
    this._aortaPath = new FlowPath({
      path: [
        [w * 0.5, h * 0.1],
        [w * 0.5, h * 0.25],
        [w * 0.3, h * 0.3],
        [w * 0.15, h * 0.5],
        [w * 0.15, h * 0.75],
        [w * 0.3, h * 0.85],
        [w * 0.5, h * 0.88]
      ],
      particleCount: 18,
      speed: this._calcSpeed(),
      color: '#cc2222',
      particleRadius: 5,
      showPath: true,
      pathColor: '#ffbbbb',
      pathWidth: 12,
      spread: 3
    });

    // Pulmonary (right side, blue/deoxygenated)
    this._pulmonaryPath = new FlowPath({
      path: [
        [w * 0.5, h * 0.88],
        [w * 0.7, h * 0.85],
        [w * 0.85, h * 0.75],
        [w * 0.85, h * 0.5],
        [w * 0.7, h * 0.3],
        [w * 0.5, h * 0.25],
        [w * 0.5, h * 0.1]
      ],
      particleCount: 15,
      speed: this._calcSpeed() * 0.85,
      color: '#4466cc',
      particleRadius: 5,
      showPath: true,
      pathColor: '#bbccff',
      pathWidth: 10,
      spread: 3
    });

    this._aortaPath.play();
    this._pulmonaryPath.play();
  }

  setVascularResistance(v) {
    this.vascularResistance = Math.max(0.1, v);
    this._updateSpeed();
    this.emit('vascularResistanceChanged', this.vascularResistance);
    return this;
  }

  setPressure(p) {
    this.pressure = Math.max(10, p);
    this._updateSpeed();
    this.emit('pressureChanged', this.pressure);
    return this;
  }

  setViscosity(v) {
    this.viscosity = Math.max(0.1, v);
    this._updateSpeed();
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    return this;
  }

  // Ohm's law analogy: Flow = Pressure / Resistance
  _calcSpeed() {
    return (this.pressure / 120) / (this.vascularResistance * this.viscosity);
  }

  _updateSpeed() {
    const speed = this._calcSpeed();
    this._aortaPath.setSpeed(speed);
    this._pulmonaryPath.setSpeed(speed * 0.85);
  }

  _update(dt) {
    this._aortaPath.update(dt);
    this._pulmonaryPath.update(dt);
  }

  _draw(ctx) {
    this._aortaPath.draw(ctx);
    this._pulmonaryPath.draw(ctx);

    // Heart in center
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.strokeStyle = '#7b241c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♥', 0, 0);
    ctx.restore();

    if (this._showLabels) {
      ctx.save();
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';

      const speed = this._calcSpeed();
      ctx.fillText(`Flow = P/R = ${(this.pressure / this.vascularResistance).toFixed(0)} units`, 10, 20);
      ctx.fillText(`Resistance: ${this.vascularResistance.toFixed(1)}`, 10, 36);
      ctx.fillText(`Pressure: ${this.pressure} mmHg`, 10, 52);

      // Legend
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(10, this.canvas.height - 45, 16, 10);
      ctx.fillStyle = '#333';
      ctx.fillText('Oxygenated (arterial)', 30, this.canvas.height - 38);

      ctx.fillStyle = '#4466cc';
      ctx.fillRect(10, this.canvas.height - 28, 16, 10);
      ctx.fillStyle = '#333';
      ctx.fillText('Deoxygenated (venous)', 30, this.canvas.height - 21);

      ctx.restore();
    }
  }
}
