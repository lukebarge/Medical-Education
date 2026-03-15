import { Animation } from '../core/Animation.js';
import { WaveForm } from '../effects/WaveForm.js';

/**
 * Action potential animation showing nerve impulse propagation.
 * Displays a scrolling voltage waveform with ion channel activity.
 *
 * Parameters:
 *   - threshold: mV, default -55 (more negative = harder to trigger)
 *   - conductionVelocity: relative 0.5–3, default 1
 *   - refractoryPeriod: ms, default 2
 *
 * @example
 * const ap = new ActionPotential(canvas, { threshold: -55 });
 * ap.play();
 * ap.trigger(); // manually trigger an impulse
 */
export class ActionPotential extends Animation {
  constructor(canvas, params = {}) {
    super(canvas, params);
    this.threshold = params.threshold !== undefined ? params.threshold : -55;
    this.conductionVelocity = params.conductionVelocity !== undefined ? params.conductionVelocity : 1;
    this.refractoryPeriod = params.refractoryPeriod !== undefined ? params.refractoryPeriod : 2;
    this._showLabels = params.showLabels !== undefined ? params.showLabels : true;

    // Resting membrane potential
    this._restingPotential = -70;
    this._voltage = this._restingPotential;
    this._phase = 'rest';  // rest | depolarization | repolarization | refractory
    this._phaseTimer = 0;
    this._autoFire = params.autoFire !== undefined ? params.autoFire : true;
    this._autoFireInterval = params.autoFireInterval !== undefined ? params.autoFireInterval : 1500; // ms
    this._lastFire = 0;
    this._elapsed = 0;

    // WaveForm for voltage trace
    this._waveform = new WaveForm(canvas, {
      x: 20,
      y: 20,
      width: canvas.width - 40,
      height: canvas.height * 0.55,
      yMin: -90,
      yMax: 50,
      color: '#00ff88',
      lineWidth: 2,
      scrolling: true,
      maxPoints: 400,
      background: '#0a0a0a',
      showAxes: true,
      axisColor: '#444'
    });
    this._waveform.addLabel('Threshold', this.threshold, '#ffaa00');
    this._waveform.addLabel('Resting (-70mV)', -70, '#666');
  }

  setThreshold(mV) {
    this.threshold = mV;
    // Update waveform label
    this._waveform._labels = this._waveform._labels.filter(l => l.label !== 'Threshold');
    this._waveform.addLabel('Threshold', this.threshold, '#ffaa00');
    return this;
  }

  setConductionVelocity(v) {
    this.conductionVelocity = Math.max(0.1, v);
    return this;
  }

  setRefractoryPeriod(ms) {
    this.refractoryPeriod = Math.max(0.5, ms);
    return this;
  }

  /** Manually trigger an action potential. */
  trigger() {
    if (this._phase === 'rest') {
      this._phase = 'depolarization';
      this._phaseTimer = 0;
      this.emit('trigger');
    }
    return this;
  }

  showLabels(show) {
    this._showLabels = show;
    return this;
  }

  reset() {
    this._voltage = this._restingPotential;
    this._phase = 'rest';
    this._phaseTimer = 0;
    this._elapsed = 0;
  }

  _update(dt) {
    this._elapsed += dt;
    this._phaseTimer += dt;

    // Auto fire
    if (this._autoFire && this._phase === 'rest') {
      if (this._elapsed - this._lastFire > this._autoFireInterval / this.conductionVelocity) {
        this._lastFire = this._elapsed;
        this._phase = 'depolarization';
        this._phaseTimer = 0;
        this.emit('trigger');
      }
    }

    // State machine for action potential phases
    const speedMult = this.conductionVelocity;
    switch (this._phase) {
      case 'depolarization': {
        // Fast Na+ influx: -70 → +30 mV in ~0.5ms
        const duration = 0.5 / speedMult;
        this._voltage = this._restingPotential + (30 - this._restingPotential) * Math.min(this._phaseTimer / duration, 1);
        if (this._phaseTimer >= duration) {
          this._phase = 'repolarization';
          this._phaseTimer = 0;
          this.emit('depolarization');
        }
        break;
      }
      case 'repolarization': {
        // K+ efflux: +30 → -80 mV in ~1ms (undershoot)
        const duration = 1.0 / speedMult;
        this._voltage = 30 + (-80 - 30) * Math.min(this._phaseTimer / duration, 1);
        if (this._phaseTimer >= duration) {
          this._phase = 'refractory';
          this._phaseTimer = 0;
          this.emit('repolarization');
        }
        break;
      }
      case 'refractory': {
        // Return to resting: -80 → -70 mV
        const duration = this.refractoryPeriod / speedMult;
        this._voltage = -80 + (-70 - (-80)) * Math.min(this._phaseTimer / duration, 1);
        if (this._phaseTimer >= duration) {
          this._phase = 'rest';
          this._voltage = this._restingPotential;
          this.emit('refractory');
        }
        break;
      }
      case 'rest':
      default:
        this._voltage = this._restingPotential + Math.sin(this._elapsed * 0.001) * 0.5;
        break;
    }

    this._waveform.push(this._voltage);
  }

  _draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();

    this._waveform.draw(ctx);

    // Ion channel diagram below waveform
    const y = this.canvas.height * 0.65;
    this._drawIonChannels(ctx, y);

    if (this._showLabels) {
      ctx.save();
      ctx.font = '12px monospace';
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText(`Phase: ${this._phase}`, 25, this.canvas.height * 0.62);
      ctx.fillText(`Vm: ${this._voltage.toFixed(1)} mV`, 160, this.canvas.height * 0.62);
      ctx.fillText(`Threshold: ${this.threshold} mV`, 300, this.canvas.height * 0.62);
      ctx.restore();
    }
  }

  _drawIonChannels(ctx, y) {
    const w = this.canvas.width;
    ctx.save();
    ctx.translate(w / 2, y + 40);

    // Membrane
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(-w * 0.45, -15, w * 0.9, 30);
    ctx.strokeStyle = '#2a5a8c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w * 0.45, -15, w * 0.9, 30);

    // Na+ channel
    this._drawChannel(ctx, -80, 'Na⁺', this._phase === 'depolarization' ? '#ff6644' : '#446688');

    // K+ channel
    this._drawChannel(ctx, 0, 'K⁺', this._phase === 'repolarization' ? '#44ff66' : '#446688');

    // Labels
    ctx.fillStyle = '#aaa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Extracellular', 0, -25);
    ctx.fillText('Intracellular', 0, 35);

    ctx.restore();
  }

  _drawChannel(ctx, x, label, color) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.fillStyle = color;
    ctx.fillRect(-12, -20, 24, 40);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-12, -20, 24, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}
