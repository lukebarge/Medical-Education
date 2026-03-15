import { EventEmitter } from '../core/EventEmitter.js';

/**
 * A 2D particle emitter with basic physics (velocity, gravity, lifetime, fade).
 *
 * @example
 * const ps = new ParticleSystem({
 *   emitter: { x: 100, y: 100 },
 *   count: 200,
 *   velocity: { x: [-1, 1], y: [-2, 0] },
 *   lifetime: [500, 1500],
 *   gravity: 0.05,
 *   color: '#ff4444',
 *   radius: 3
 * });
 * scene.add(ps);
 * ps.emit(); // burst
 */
export class ParticleSystem extends EventEmitter {
  /**
   * @param {object} options
   * @param {{ x: number, y: number }} [options.emitter] - emission origin
   * @param {number} [options.count=50] - max particles alive at once
   * @param {{ x: [min,max], y: [min,max] }} [options.velocity]
   * @param {[number,number]} [options.lifetime=[500,1000]] - ms range
   * @param {number} [options.gravity=0] - downward acceleration px/ms²
   * @param {string|Function} [options.color='#ffffff'] - color or fn(particle)=>string
   * @param {[number,number]} [options.radius=[2,4]] - particle radius range
   * @param {boolean} [options.fade=true] - fade out at end of lifetime
   * @param {{ x:[min,max], y:[min,max] }} [options.spread] - emitter spread area
   */
  constructor(options = {}) {
    super();
    this.emitter = options.emitter || { x: 0, y: 0 };
    this.count = options.count !== undefined ? options.count : 50;
    this.velocity = options.velocity || { x: [-1, 1], y: [-2, 0] };
    this.lifetime = options.lifetime || [500, 1000];
    this.gravity = options.gravity !== undefined ? options.gravity : 0;
    this.color = options.color || '#ffffff';
    this.radius = Array.isArray(options.radius) ? options.radius : [options.radius || 2, options.radius || 4];
    this.fade = options.fade !== undefined ? options.fade : true;
    this.spread = options.spread || { x: [0, 0], y: [0, 0] };

    this._particles = [];
    this._continuous = false;
    this._emitRate = options.emitRate || 10; // particles per second when continuous
    this._lastEmit = 0;
  }

  /** Emit a burst of `count` particles. */
  emit(count) {
    const n = count !== undefined ? count : this.count;
    for (let i = 0; i < n; i++) {
      this._particles.push(this._createParticle());
    }
    return this;
  }

  /** Start continuous emission. */
  start() {
    this._continuous = true;
    return this;
  }

  /** Stop continuous emission (existing particles continue). */
  stop() {
    this._continuous = false;
    return this;
  }

  /** Clear all particles immediately. */
  clear() {
    this._particles = [];
    return this;
  }

  /** Update particle positions. Called by Scene. */
  update(dt) {
    // Continuous emission
    if (this._continuous) {
      this._lastEmit += dt;
      const interval = 1000 / this._emitRate;
      while (this._lastEmit >= interval && this._particles.length < this.count) {
        this._particles.push(this._createParticle());
        this._lastEmit -= interval;
      }
      // Drain remaining time without creating particles if at capacity
      if (this._particles.length >= this.count) {
        this._lastEmit = 0;
      }
    }

    // Update existing particles
    this._particles = this._particles.filter(p => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += this.gravity * dt;
      return p.age < p.lifetime;
    });
  }

  /** Draw all particles. Called by Scene. */
  draw(ctx) {
    for (const p of this._particles) {
      const progress = p.age / p.lifetime;
      const alpha = this.fade ? 1 - progress : 1;
      ctx.save();
      ctx.globalAlpha = alpha * p.opacity;
      ctx.fillStyle = typeof this.color === 'function' ? this.color(p) : this.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _createParticle() {
    return {
      x: this.emitter.x + rand(this.spread.x),
      y: this.emitter.y + rand(this.spread.y),
      vx: rand(this.velocity.x),
      vy: rand(this.velocity.y),
      radius: rand(this.radius),
      lifetime: rand(this.lifetime),
      age: 0,
      opacity: 1
    };
  }
}

function rand(range) {
  if (!Array.isArray(range)) return range;
  return range[0] + Math.random() * (range[1] - range[0]);
}
