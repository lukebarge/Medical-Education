import { Animation } from '../core/Animation.js';

/**
 * Physics simulation of the heart pumping against systemic vascular resistance.
 *
 * Models hemodynamics using Ohm's law analogy (ΔP = CO × SVR) and
 * Frank–Starling afterload reduction.
 *
 * Physics equations:
 *   SV  = EDV × EF × [1 / (0.7 + 0.3 × SVR)]   (afterload reduces stroke volume)
 *   CO  = HR × SV / 1000                          (L/min)
 *   MAP = CO × SVR × 18                           (mmHg, scaled for normal ≈ 93)
 *   PP  = SV / arterial_compliance                (pulse pressure)
 *   SBP = MAP + PP/3
 *   DBP = MAP − 2×PP/3
 *   Arteriole lumen ∝ 1/SVR^0.5                   (Poiseuille visual proxy)
 *
 * @example
 * const sim = new VascularResistance(canvas, { heartRate: 72, svr: 1.0 });
 * sim.play();
 * sim.setSVR(2.5);  // simulate hypertension
 */
export class VascularResistance extends Animation {
  constructor(canvas, params = {}) {
    super(canvas, params);

    this.heartRate    = params.heartRate    ?? 72;
    this.svr          = params.svr          ?? 1.0;   // relative, 1=normal
    this.contractility = params.contractility ?? 1.0; // 0.2–2.0
    this.preload      = params.preload      ?? 1.0;   // 0.4–1.8

    // Derived hemodynamics (recomputed on parameter change)
    this.strokeVolume  = 0;
    this.cardiacOutput = 0;
    this.map = 0;
    this.sbp = 0;
    this.dbp = 0;

    // Beat timing
    this._timeSinceLastBeat = 0;
    this._systoleProgress   = 0;
    this._isSystole         = false;
    this._systoleDuration   = 300; // ms

    // Aortic pressure waveform history
    this._pressureHistory     = [];
    this._maxPressurePoints   = 350;
    this._currentPressure     = 80;

    // Blood particle pool
    this._particles            = [];
    this._particleSpawnTimer   = 0;

    // Centerline paths (arterial loop and venous return)
    this._artPath = [
      { x: 126, y: 140 },   // aortic valve
      { x: 312, y: 140 },   // aorta
      { x: 455, y: 140 },   // arteriole end
      { x: 510, y: 140 },   // capillary bed
      { x: 510, y: 178 },   // connector down
    ];
    this._venPath = [
      { x: 510, y: 196 },
      { x: 510, y: 228 },   // venous start
      { x: 126, y: 228 },   // vein return
      { x: 126, y: 192 },   // back to heart
    ];

    this._artLen = this._pathLen(this._artPath);
    this._venLen = this._pathLen(this._venPath);

    this._computeHemodynamics();
  }

  // ─── Public setters ───────────────────────────────────────────────────────

  setSVR(v) {
    this.svr = Math.max(0.3, Math.min(4.0, v));
    this._computeHemodynamics();
    return this;
  }

  setHeartRate(v) {
    this.heartRate = Math.max(20, Math.min(200, v));
    this._computeHemodynamics();
    return this;
  }

  setContractility(v) {
    this.contractility = Math.max(0.2, Math.min(2.0, v));
    this._computeHemodynamics();
    return this;
  }

  setPreload(v) {
    this.preload = Math.max(0.4, Math.min(1.8, v));
    this._computeHemodynamics();
    return this;
  }

  // ─── Hemodynamic model ────────────────────────────────────────────────────

  _computeHemodynamics() {
    const edv = 120 * this.preload;                                  // mL
    const ef  = Math.min(0.95, 0.65 * this.contractility);          // ejection fraction

    // Frank-Starling: higher SVR (afterload) reduces stroke volume
    const sv  = edv * ef * (1 / (0.7 + 0.3 * this.svr));
    this.strokeVolume = Math.max(10, Math.min(160, sv));

    this.cardiacOutput = Math.max(0.3, (this.heartRate * this.strokeVolume) / 1000);

    // Ohm's law for circulation: MAP = CO × SVR
    this.map = this.cardiacOutput * 18 * this.svr;

    const pp   = this.strokeVolume / 1.5;   // pulse pressure (SV / compliance)
    this.sbp   = this.map + pp / 3;
    this.dbp   = Math.max(20, this.map - (2 * pp) / 3);

    // Systole shortens at higher HR (Bazett-like)
    this._systoleDuration = Math.min(380, Math.max(180,
      300 * Math.pow(72 / this.heartRate, 0.3)
    ));
  }

  // ─── Animation loop ───────────────────────────────────────────────────────

  _update(dt) {
    const beatInterval = 60000 / this.heartRate;
    this._timeSinceLastBeat += dt;

    if (!this._isSystole && this._timeSinceLastBeat >= beatInterval) {
      this._isSystole         = true;
      this._systoleProgress   = 0;
      this._timeSinceLastBeat = 0;
      this.emit('beat', { co: this.cardiacOutput, map: this.map });
    }

    if (this._isSystole) {
      this._systoleProgress += dt / this._systoleDuration;
      if (this._systoleProgress >= 1) {
        this._systoleProgress = 1;
        this._isSystole       = false;
      }
    }

    this._updatePressure(dt);
    this._updateParticles(dt);
  }

  _updatePressure(dt) {
    const { sbp, dbp } = this;
    const sp = this._systoleProgress;

    if (this._isSystole) {
      if (sp < 0.25) {
        // Isovolumetric contraction → rapid pressure rise
        this._currentPressure = dbp + (sbp - dbp) * (sp / 0.25);
      } else if (sp < 0.65) {
        // Ejection: pressure falls from SBP toward MAP+15
        const t = (sp - 0.25) / 0.40;
        this._currentPressure = sbp - (sbp - (dbp + 22)) * t;
      } else {
        // Dicrotic notch (closure of aortic valve)
        const t = (sp - 0.65) / 0.35;
        const notch = 10 * Math.sin(t * Math.PI);
        this._currentPressure = dbp + 22 - notch;
      }
    } else {
      // Diastolic runoff: exponential decay toward DBP
      const tau = Math.max(150, 280 / Math.sqrt(this.svr));
      this._currentPressure += (dbp - this._currentPressure) * (dt / tau);
    }

    this._pressureHistory.push(this._currentPressure);
    if (this._pressureHistory.length > this._maxPressurePoints) {
      this._pressureHistory.shift();
    }
  }

  _updateParticles(dt) {
    const co      = Math.max(0.5, this.cardiacOutput);
    const baseInterval = 220 * (5 / co);
    // Burst spawn during ejection phase
    const interval = (this._isSystole && this._systoleProgress < 0.6)
      ? baseInterval / 3 : baseInterval;

    this._particleSpawnTimer += dt;
    if (this._particleSpawnTimer >= interval && this._particles.length < 90) {
      this._particleSpawnTimer = 0;
      this._particles.push({ t: 0, venous: false, off: (Math.random() - 0.5) * 7 });
      if (Math.random() < 0.55) {
        this._particles.push({ t: 0, venous: true, off: (Math.random() - 0.5) * 9 });
      }
    }

    // Advance particles along path; speed ∝ cardiac output
    const speed = 0.15 * (co / 5.0); // px/ms
    for (const p of this._particles) {
      p.t += (speed * dt) / (p.venous ? this._venLen : this._artLen);
    }
    this._particles = this._particles.filter(p => p.t < 1);
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────

  _draw(ctx) {
    const W = this.canvas.width, H = this.canvas.height;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    this._drawVessels(ctx);
    this._drawParticles(ctx);
    this._drawHeart(ctx);
    this._drawMetrics(ctx);
    this._drawPressureWaveform(ctx);
  }

  _drawHeart(ctx) {
    const cx = 75, cy = 183;
    const sp = this._systoleProgress;

    // LV contracts during systole, fills during diastole
    const fillFraction = this._isSystole
      ? 1 - sp * 0.22 * Math.min(2, this.contractility)
      : 1 + Math.min(0.05, (this._timeSinceLastBeat / (60000 / this.heartRate)) * 0.05);
    const s = Math.max(0.72, Math.min(1.06, fillFraction));

    ctx.save();
    ctx.translate(cx, cy);

    if (this._isSystole && sp < 0.45) {
      ctx.shadowColor = '#ef5350';
      ctx.shadowBlur  = 18 * (1 - sp / 0.45);
    }

    const rw = 46 * s, rh = 57 * s;
    const grad = ctx.createRadialGradient(-10, -12, 4, 0, 0, rw + 8);
    grad.addColorStop(0, '#e53935');
    grad.addColorStop(1, '#4a0000');

    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ff6659';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LV', 0, 0);

    ctx.restore();

    // Phase label
    const phase = this._isSystole
      ? (sp < 0.65 ? 'Systole' : 'Iso. Relaxation')
      : 'Diastole';
    ctx.save();
    ctx.fillStyle = this._isSystole ? '#ef9a9a' : '#90caf9';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(phase, cx, cy + 64);
    ctx.restore();
  }

  _drawVessels(ctx) {
    const artY  = 140;
    const venY  = 228;
    const aortaH = 20;

    // Arteriole lumen narrows with SVR (Poiseuille: d ∝ 1/R^0.25 ∝ r)
    const artH = Math.max(5, Math.round(20 / Math.pow(1 + this.svr, 0.52)));

    // ── Aorta (x 126–312) ──
    this._tube(ctx, 126, artY, 186, aortaH, '#c62828', '#ef5350');
    this._label(ctx, 218, artY - aortaH / 2 - 10, 'Aorta', '#777');

    // ── Taper: aorta → arteriole (x 312–342) ──
    this._taper(ctx, 312, artY, 30, aortaH, artH, '#b71c1c', '#7f0000');

    // ── Arterioles / resistance zone (x 342–458) ──
    this._tube(ctx, 342, artY, 116, artH, '#7f0000', '#c62828');

    // SVR label
    const svrColor = this.svr > 1.5 ? '#ff7043' : this.svr < 0.7 ? '#81c784' : '#ffd54f';
    const svrDesc  = this.svr > 1.5 ? 'Vasoconstriction' : this.svr < 0.7 ? 'Vasodilation' : 'Normal tone';
    ctx.save();
    ctx.fillStyle = svrColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Arterioles  (SVR ×${this.svr.toFixed(1)})`, 400, artY - artH / 2 - 19);
    ctx.font = '9px sans-serif';
    ctx.fillStyle = svrColor + 'bb';
    ctx.fillText(svrDesc, 400, artY - artH / 2 - 8);
    ctx.restore();

    // ── Capillary bed (x 458–510) ──
    this._capillaries(ctx, 458, artY, artH);

    // ── Right connector: art → ven ──
    ctx.save();
    ctx.fillStyle = '#2c2c5e';
    ctx.fillRect(502, artY + artH / 2, 16, venY - artY - artH / 2 - artH / 2);
    ctx.restore();

    // ── Veins / venous return (x 126–510) ──
    const venH = 22;
    this._tube(ctx, 126, venY, 384, venH, '#1a237e', '#3949ab');
    this._label(ctx, 320, venY + venH / 2 + 12, 'Venous return', '#5c6bc0');

    // ── Left connector: vein back into heart ──
    ctx.save();
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(118, artY + aortaH / 2, 10, venY - artY - aortaH / 2 - venH / 2 + 2);
    ctx.restore();
  }

  _tube(ctx, x, cy, w, lumenH, wallColor, hiColor) {
    const wh = 3;
    ctx.save();
    ctx.fillStyle = wallColor;
    ctx.fillRect(x, cy - lumenH / 2 - wh, w, wh);
    ctx.fillRect(x, cy + lumenH / 2, w, wh);
    const g = ctx.createLinearGradient(0, cy - lumenH / 2, 0, cy + lumenH / 2);
    g.addColorStop(0, wallColor);
    g.addColorStop(0.45, hiColor);
    g.addColorStop(1, wallColor);
    ctx.fillStyle = g;
    ctx.fillRect(x, cy - lumenH / 2, w, lumenH);
    ctx.restore();
  }

  _taper(ctx, x, cy, w, h1, h2, c1, c2) {
    ctx.save();
    // Wall taper top
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(x, cy - h1 / 2 - 3);
    ctx.lineTo(x + w, cy - h2 / 2 - 2);
    ctx.lineTo(x + w, cy - h2 / 2);
    ctx.lineTo(x, cy - h1 / 2);
    ctx.closePath();
    ctx.fill();
    // Wall taper bottom
    ctx.beginPath();
    ctx.moveTo(x, cy + h1 / 2 + 3);
    ctx.lineTo(x + w, cy + h2 / 2 + 2);
    ctx.lineTo(x + w, cy + h2 / 2);
    ctx.lineTo(x, cy + h1 / 2);
    ctx.closePath();
    ctx.fill();
    // Lumen fill
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, cy - h1 / 2);
    ctx.lineTo(x + w, cy - h2 / 2);
    ctx.lineTo(x + w, cy + h2 / 2);
    ctx.lineTo(x, cy + h1 / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _capillaries(ctx, x, cy, lumenH) {
    ctx.save();
    ctx.strokeStyle = '#ef9a9a';
    ctx.lineWidth = 1.5;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const cx = x + (i / (n - 1)) * 48;
      const amp = lumenH / 2 + 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - amp + 2);
      ctx.bezierCurveTo(cx - 7, cy - amp / 2, cx + 7, cy + amp / 2, cx, cy + amp - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _label(ctx, x, y, text, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _drawParticles(ctx) {
    const artH = Math.max(5, Math.round(20 / Math.pow(1 + this.svr, 0.52)));

    for (const p of this._particles) {
      const path = p.venous ? this._venPath : this._artPath;
      const pos  = this._pathAt(path, p.t);

      // Clamp y-offset to fit within lumen
      const inArt     = !p.venous && pos.x >= 342 && pos.x <= 458;
      const maxOff    = inArt ? artH / 2 - 2 : 7;
      const off       = Math.max(-maxOff, Math.min(maxOff, p.off));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y + off, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.venous ? '#5c6bc0' : '#ff5252';
      ctx.fill();
    }
  }

  _drawMetrics(ctx) {
    const W  = this.canvas.width;
    const mx = W - 160, my = 18, mw = 150, mh = 130;

    ctx.save();
    ctx.fillStyle   = 'rgba(13,17,23,0.9)';
    ctx.strokeStyle = '#2a2d35';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.rect(mx, my, mw, mh);
    ctx.fill();
    ctx.stroke();

    const rows = [
      { label: 'HR',  val: `${Math.round(this.heartRate)} bpm`,              color: '#ef9a9a' },
      { label: 'SV',  val: `${Math.round(this.strokeVolume)} mL`,            color: '#a5d6a7' },
      { label: 'CO',  val: `${this.cardiacOutput.toFixed(1)} L/min`,         color: '#4fc3f7' },
      { label: 'MAP', val: `${Math.round(this.map)} mmHg`,                   color: '#ffcc80' },
      { label: 'BP',  val: `${Math.round(this.sbp)}/${Math.round(this.dbp)}`,color: '#ef5350' },
      { label: 'SVR', val: `×${this.svr.toFixed(1)}`,                        color: '#ce93d8' },
    ];

    ctx.font = '10px monospace';
    rows.forEach((r, i) => {
      const ry = my + 18 + i * 19;
      ctx.fillStyle = '#666';
      ctx.textAlign = 'left';
      ctx.fillText(r.label, mx + 10, ry);
      ctx.fillStyle = r.color;
      ctx.textAlign = 'right';
      ctx.fillText(r.val, mx + 142, ry);
    });

    ctx.restore();
  }

  _drawPressureWaveform(ctx) {
    const W  = this.canvas.width;
    const px = 14, py = 278, pw = W - 28, ph = 175;
    const yMin = 30, yMax = 230;

    const toY = v => py + ph - ((v - yMin) / (yMax - yMin)) * ph;

    ctx.save();
    ctx.fillStyle   = '#080b10';
    ctx.strokeStyle = '#1e2530';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.fill();
    ctx.stroke();

    // Horizontal reference lines
    const refs = [
      { v: this.dbp, color: 'rgba(100,149,237,0.35)', label: `DBP ${Math.round(this.dbp)} mmHg` },
      { v: this.map, color: 'rgba(255,165,0,0.35)',   label: `MAP ${Math.round(this.map)} mmHg` },
      { v: this.sbp, color: 'rgba(220,50,50,0.4)',    label: `SBP ${Math.round(this.sbp)} mmHg` },
    ];

    for (const ref of refs) {
      const ry = toY(ref.v);
      if (ry <= py || ry >= py + ph) continue;
      ctx.strokeStyle = ref.color;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 1, ry);
      ctx.lineTo(px + pw - 1, ry);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ref.color.replace('0.35', '0.85').replace('0.4', '0.85');
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ref.label, px + pw - 4, ry - 3);
    }

    // Waveform line
    const data = this._pressureHistory;
    if (data.length >= 2) {
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const tx = px + 2 + (i / (this._maxPressurePoints - 1)) * (pw - 4);
        const ty = Math.max(py + 2, Math.min(py + ph - 2, toY(data[i])));
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Leading dot
      const last = data[data.length - 1];
      const dotX = px + 2 + ((data.length - 1) / (this._maxPressurePoints - 1)) * (pw - 4);
      const dotY = Math.max(py + 2, Math.min(py + ph - 2, toY(last)));
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#4fc3f7';
      ctx.fill();
    }

    ctx.fillStyle = '#444';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Aortic Pressure  (mmHg)', px + 6, py + 13);

    ctx.restore();
  }

  // ─── Path utilities ───────────────────────────────────────────────────────

  _pathLen(pts) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x, dy = pts[i].y - pts[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  _pathAt(pts, t) {
    const segs = pts.length - 1;
    const st   = Math.max(0, Math.min(1, t)) * segs;
    const idx  = Math.min(Math.floor(st), segs - 1);
    const frac = st - idx;
    const a    = pts[idx], b = pts[idx + 1];
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  }
}
