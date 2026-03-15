import { EventEmitter } from '../core/EventEmitter.js';

/**
 * Animated scrolling waveform / line graph for real-time data visualization.
 * Works in two modes:
 * - **push mode**: call wf.push(value) to add data points in real-time
 * - **play mode**: wf.setData(array); wf.play() to animate through recorded data
 *
 * @example
 * // EKG-style scrolling
 * const wf = new WaveForm(canvas, {
 *   x: 20, y: 100, width: 600, height: 200,
 *   scrolling: true, color: '#00ff00', yMin: -80, yMax: 40
 * });
 * scene.add(wf);
 * // push values from your simulation:
 * wf.push(voltage);
 */
export class WaveForm extends EventEmitter {
  /**
   * @param {import('../core/Canvas.js').Canvas} canvas
   * @param {object} options
   * @param {number} [options.x=0]
   * @param {number} [options.y=0]
   * @param {number} [options.width] - defaults to canvas width
   * @param {number} [options.height=150]
   * @param {number} [options.yMin=-1]
   * @param {number} [options.yMax=1]
   * @param {string} [options.color='#00cc00']
   * @param {number} [options.lineWidth=2]
   * @param {boolean} [options.scrolling=true]
   * @param {number} [options.maxPoints=500]
   * @param {string} [options.background] - optional background fill
   * @param {boolean} [options.showAxes=true]
   * @param {string} [options.axisColor='#666']
   */
  constructor(canvas, options = {}) {
    super();
    this.canvas = canvas;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.width = options.width || canvas.width;
    this.height = options.height || 150;
    this.yMin = options.yMin !== undefined ? options.yMin : -1;
    this.yMax = options.yMax !== undefined ? options.yMax : 1;
    this.color = options.color || '#00cc00';
    this.lineWidth = options.lineWidth || 2;
    this.scrolling = options.scrolling !== undefined ? options.scrolling : true;
    this.maxPoints = options.maxPoints || 500;
    this.background = options.background || null;
    this.showAxes = options.showAxes !== undefined ? options.showAxes : true;
    this.axisColor = options.axisColor || '#666';

    this._data = [];
    this._playData = [];
    this._playIndex = 0;
    this._playing = false;
    this._playSpeed = 1;
    this._labels = [];
  }

  /**
   * Push a new data value (real-time mode).
   * @param {number} value
   */
  push(value) {
    this._data.push(value);
    if (this._data.length > this.maxPoints) {
      this._data.shift();
    }
    return this;
  }

  /**
   * Set a pre-recorded dataset for playback mode.
   * @param {number[]} data
   */
  setData(data) {
    this._playData = data;
    this._playIndex = 0;
    return this;
  }

  /**
   * Add a labeled annotation at a specific value position.
   * @param {string} label
   * @param {number} value - y axis value
   * @param {string} [color='#ffcc00']
   */
  addLabel(label, value, color = '#ffcc00') {
    this._labels.push({ label, value, color });
    return this;
  }

  /** Start playing through setData() dataset. */
  play(speed = 1) {
    this._playing = true;
    this._playSpeed = speed;
    return this;
  }

  /** Stop playback. */
  stopPlay() {
    this._playing = false;
    return this;
  }

  /** Update — advance play index if in play mode. Called by Scene. */
  update(dt) {
    if (this._playing && this._playData.length > 0) {
      const step = Math.max(1, Math.round(this._playSpeed * dt / 16));
      for (let i = 0; i < step; i++) {
        if (this._playIndex < this._playData.length) {
          this.push(this._playData[this._playIndex++]);
        } else {
          this._playing = false;
          this.emit('complete');
          break;
        }
      }
    }
  }

  /** Draw the waveform. Called by Scene. */
  draw(ctx) {
    const { x, y, width, height } = this;
    const data = this._data;

    ctx.save();

    // Background
    if (this.background) {
      ctx.fillStyle = this.background;
      ctx.fillRect(x, y, width, height);
    }

    // Axes
    if (this.showAxes) {
      ctx.strokeStyle = this.axisColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.stroke();

      // Zero line
      const zeroY = y + height - ((0 - this.yMin) / (this.yMax - this.yMin)) * height;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, zeroY);
      ctx.lineTo(x + width, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Labels
    for (const lbl of this._labels) {
      const ly = y + height - ((lbl.value - this.yMin) / (this.yMax - this.yMin)) * height;
      ctx.strokeStyle = lbl.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + width, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = lbl.color;
      ctx.font = '11px sans-serif';
      ctx.fillText(lbl.label, x + 4, ly - 3);
    }

    if (data.length < 2) {
      ctx.restore();
      return;
    }

    // Waveform line
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const step = this.scrolling
      ? width / Math.max(data.length - 1, 1)
      : width / (this.maxPoints - 1);

    for (let i = 0; i < data.length; i++) {
      const px = this.scrolling
        ? x + i * step
        : x + (i / (this.maxPoints - 1)) * width;
      const normalised = (data[i] - this.yMin) / (this.yMax - this.yMin);
      const py = y + height - normalised * height;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.stroke();
    ctx.restore();
  }
}
