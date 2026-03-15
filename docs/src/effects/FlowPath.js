import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Animates particles flowing along a bezier/polyline path.
 * Great for blood flow, nerve signals, drug transport, etc.
 *
 * @example
 * const fp = new FlowPath({
 *   path: [[0,100],[100,80],[200,120],[300,100]],
 *   particleCount: 30,
 *   speed: 1.0,
 *   color: '#cc0000',
 *   particleRadius: 4
 * });
 * scene.add(fp);
 * fp.play();
 */
export class FlowPath extends EventEmitter {
  /**
   * @param {object} options
   * @param {Array<[number,number]>} options.path - control points
   * @param {number} [options.particleCount=20]
   * @param {number} [options.speed=1] - base speed (0–path length per second)
   * @param {string|Function} [options.color='#ff4444'] - color or fn(t)=>string
   * @param {number} [options.particleRadius=4]
   * @param {boolean} [options.loop=true]
   * @param {boolean} [options.showPath=false] - draw the path underneath
   * @param {string} [options.pathColor='#cccccc']
   * @param {number} [options.pathWidth=2]
   * @param {number} [options.spread=0] - perpendicular spread around path
   */
  constructor(options = {}) {
    super();
    this.path = options.path || [];
    this.particleCount = options.particleCount !== undefined ? options.particleCount : 20;
    this.speed = options.speed !== undefined ? options.speed : 1;
    this.color = options.color || '#ff4444';
    this.particleRadius = options.particleRadius !== undefined ? options.particleRadius : 4;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.showPath = options.showPath || false;
    this.pathColor = options.pathColor || '#cccccc';
    this.pathWidth = options.pathWidth || 2;
    this.spread = options.spread || 0;

    this._running = false;
    this._particles = [];
    this._cachedPoints = [];

    if (this.path.length >= 2) {
      this._buildCache();
      this._initParticles();
    }
  }

  /** Build a lookup table of evenly-spaced points along the path. */
  _buildCache(resolution = 200) {
    this._cachedPoints = [];
    const pts = this.path;

    for (let i = 0; i < resolution; i++) {
      const t = i / (resolution - 1);
      this._cachedPoints.push(this._pointAt(t, pts));
    }
  }

  /** Get interpolated point at t (0–1) along path. */
  _pointAt(t, pts) {
    if (!pts || pts.length === 0) return { x: 0, y: 0 };
    const scaled = t * (pts.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const p1 = pts[Math.min(i, pts.length - 1)];
    const p2 = pts[Math.min(i + 1, pts.length - 1)];
    return {
      x: p1[0] + (p2[0] - p1[0]) * f,
      y: p1[1] + (p2[1] - p1[1]) * f
    };
  }

  _initParticles() {
    this._particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this._particles.push({ t: i / this.particleCount, spread: (Math.random() - 0.5) * this.spread });
    }
  }

  /** Start the flow animation. */
  play() {
    this._running = true;
    return this;
  }

  /** Pause. */
  pause() {
    this._running = false;
    return this;
  }

  /** Change speed while running. */
  setSpeed(speed) {
    this.speed = speed;
    return this;
  }

  /** Update path (rebuilds cache). */
  setPath(path) {
    this.path = path;
    this._buildCache();
    this._initParticles();
    return this;
  }

  update(dt) {
    if (!this._running || this._cachedPoints.length === 0) return;

    const delta = (this.speed * dt) / 10000;
    for (const p of this._particles) {
      p.t += delta;
      if (p.t > 1) {
        if (this.loop) {
          p.t -= 1;
          p.spread = (Math.random() - 0.5) * this.spread;
          this.emit('loop', p);
        } else {
          p.t = 1;
        }
      }
    }
  }

  draw(ctx) {
    if (this._cachedPoints.length === 0) return;
    ctx.save();

    // Draw path
    if (this.showPath && this.path.length >= 2) {
      ctx.strokeStyle = this.pathColor;
      ctx.lineWidth = this.pathWidth;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(this.path[0][0], this.path[0][1]);
      for (let i = 1; i < this.path.length; i++) {
        ctx.lineTo(this.path[i][0], this.path[i][1]);
      }
      ctx.stroke();
    }

    // Draw particles
    for (const p of this._particles) {
      const idx = Math.floor(p.t * (this._cachedPoints.length - 1));
      const pt = this._cachedPoints[Math.min(idx, this._cachedPoints.length - 1)];

      // Apply perpendicular spread
      let px = pt.x;
      let py = pt.y;
      if (this.spread > 0 && idx > 0) {
        const prev = this._cachedPoints[idx - 1];
        const dx = pt.x - prev.x;
        const dy = pt.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        px += (-dy / len) * p.spread;
        py += (dx / len) * p.spread;
      }

      ctx.beginPath();
      ctx.arc(px, py, this.particleRadius, 0, Math.PI * 2);
      ctx.fillStyle = typeof this.color === 'function' ? this.color(p.t) : this.color;
      ctx.fill();
    }

    ctx.restore();
  }
}
