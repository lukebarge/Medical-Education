import { Animation } from '../core/Animation.js';
import { ParticleSystem } from '../effects/ParticleSystem.js';
import { FlowPath } from '../effects/FlowPath.js';

/**
 * Drug absorption animation showing particles traversing absorption pathways.
 * Supports oral, IV, and sublingual routes.
 *
 * Parameters:
 *   - dose: mg (10–1000)
 *   - absorptionRate: 0.1–2.0 (bioavailability/rate)
 *   - route: 'oral' | 'IV' | 'sublingual'
 *
 * @example
 * const da = new DrugAbsorption(canvas, { route: 'oral', dose: 500 });
 * da.play();
 * da.setDose(250);
 */
export class DrugAbsorption extends Animation {
  constructor(canvas, params = {}) {
    super(canvas, params);
    this.dose = params.dose !== undefined ? params.dose : 500;
    this.absorptionRate = params.absorptionRate !== undefined ? params.absorptionRate : 1.0;
    this.route = params.route || 'oral';
    this._showLabels = params.showLabels !== undefined ? params.showLabels : true;

    this._absorbed = 0;
    this._elapsed = 0;
    this._flowPaths = [];
    this._particleSystems = [];

    this._buildRoute();
  }

  setDose(dose) {
    this.dose = Math.max(1, dose);
    this._buildRoute();
    return this;
  }

  setAbsorptionRate(rate) {
    this.absorptionRate = Math.max(0.1, rate);
    this._buildRoute();
    return this;
  }

  setRoute(route) {
    this.route = route;
    this._buildRoute();
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    return this;
  }

  reset() {
    this._absorbed = 0;
    this._elapsed = 0;
    this._buildRoute();
  }

  _buildRoute() {
    this._flowPaths = [];
    this._particleSystems = [];

    const w = this.canvas.width;
    const h = this.canvas.height;
    const particleCount = Math.max(5, Math.round(this.dose / 20));
    const speed = this.absorptionRate;

    if (this.route === 'oral') {
      // Mouth → esophagus → stomach → intestine → bloodstream
      this._flowPaths.push(new FlowPath({
        path: [
          [w * 0.5, h * 0.05],
          [w * 0.5, h * 0.2],
          [w * 0.45, h * 0.35],
          [w * 0.4, h * 0.5],
          [w * 0.55, h * 0.65],
          [w * 0.6, h * 0.75],
          [w * 0.7, h * 0.7],
          [w * 0.85, h * 0.6]
        ],
        particleCount,
        speed,
        color: t => `hsl(${120 + t * 60}, 70%, 50%)`,
        particleRadius: 4,
        showPath: true,
        pathColor: '#dde',
        pathWidth: 8,
        spread: 2
      }));
    } else if (this.route === 'IV') {
      // Direct vein → heart → systemic circulation
      this._flowPaths.push(new FlowPath({
        path: [
          [w * 0.1, h * 0.3],
          [w * 0.3, h * 0.3],
          [w * 0.45, h * 0.35],
          [w * 0.5, h * 0.5],
          [w * 0.6, h * 0.55],
          [w * 0.8, h * 0.5]
        ],
        particleCount: Math.round(particleCount * 1.5), // higher bioavailability
        speed: speed * 1.5,
        color: '#cc2244',
        particleRadius: 5,
        showPath: true,
        pathColor: '#ffbbcc',
        pathWidth: 10,
        spread: 3
      }));
    } else if (this.route === 'sublingual') {
      // Under tongue → sublingual veins → superior vena cava
      this._flowPaths.push(new FlowPath({
        path: [
          [w * 0.5, h * 0.15],
          [w * 0.5, h * 0.25],
          [w * 0.45, h * 0.3],
          [w * 0.4, h * 0.4],
          [w * 0.45, h * 0.5],
          [w * 0.55, h * 0.55],
          [w * 0.75, h * 0.5]
        ],
        particleCount: Math.round(particleCount * 1.2),
        speed: speed * 1.3,
        color: '#aa44cc',
        particleRadius: 4,
        showPath: true,
        pathColor: '#ddbbee',
        pathWidth: 7,
        spread: 2
      }));
    }

    this._flowPaths.forEach(fp => fp.play());
  }

  _update(dt) {
    this._elapsed += dt;
    this._flowPaths.forEach(fp => fp.update(dt));

    // Track absorbed amount (simplified first-order kinetics)
    const ka = this.absorptionRate * 0.001;
    const remaining = this.dose - this._absorbed;
    if (remaining > 0) {
      this._absorbed += remaining * ka * dt * 0.01;
      this._absorbed = Math.min(this._absorbed, this.dose * (this.route === 'IV' ? 1.0 : 0.8));
    }
  }

  _draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    this._flowPaths.forEach(fp => fp.draw(ctx));

    if (this._showLabels) {
      this._drawLabels(ctx);
    }
  }

  _drawLabels(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#333';

    // Route badge
    ctx.fillStyle = this.route === 'IV' ? '#cc2244' : this.route === 'sublingual' ? '#aa44cc' : '#2244cc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Route: ${this.route.toUpperCase()}`, 15, 25);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(`Dose: ${this.dose} mg`, 15, 45);
    ctx.fillText(`Absorbed: ${this._absorbed.toFixed(1)} mg (${(this._absorbed / this.dose * 100).toFixed(0)}%)`, 15, 62);
    ctx.fillText(`Absorption rate: ${this.absorptionRate.toFixed(1)}×`, 15, 79);

    // Progress bar
    const barW = 200;
    const barH = 10;
    const bx = 15;
    const by = 90;
    ctx.fillStyle = '#ddd';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#2a7a2a';
    ctx.fillRect(bx, by, barW * (this._absorbed / this.dose), barH);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);

    ctx.restore();
  }
}
