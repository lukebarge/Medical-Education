/**
 * Stateless 2D drawing helpers wrapping CanvasRenderingContext2D.
 * All methods receive a ctx as the first argument.
 */
export const Renderer = {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} r - radius
   * @param {object} style - { fill, stroke, lineWidth, opacity }
   */
  drawCircle(ctx, x, y, r, style = {}) {
    ctx.save();
    applyStyle(ctx, style);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (style.fill) ctx.fill();
    if (style.stroke) ctx.stroke();
    ctx.restore();
  },

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {object} style
   */
  drawRect(ctx, x, y, w, h, style = {}) {
    ctx.save();
    applyStyle(ctx, style);
    ctx.beginPath();
    if (style.radius) {
      roundRect(ctx, x, y, w, h, style.radius);
    } else {
      ctx.rect(x, y, w, h);
    }
    if (style.fill) ctx.fill();
    if (style.stroke) ctx.stroke();
    ctx.restore();
  },

  /**
   * Draw a polyline or bezier path.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<[number,number]>} points
   * @param {object} style - { stroke, lineWidth, fill, closed, smooth }
   */
  drawPath(ctx, points, style = {}) {
    if (!points || points.length < 2) return;
    ctx.save();
    applyStyle(ctx, style);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);

    if (style.smooth) {
      for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i][0] + points[i + 1][0]) / 2;
        const my = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
      }
      const last = points[points.length - 1];
      ctx.lineTo(last[0], last[1]);
    } else {
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
    }

    if (style.closed) ctx.closePath();
    if (style.fill) ctx.fill();
    if (style.stroke) ctx.stroke();
    ctx.restore();
  },

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {object} style - { font, fill, stroke, align, baseline, maxWidth }
   */
  drawText(ctx, text, x, y, style = {}) {
    ctx.save();
    ctx.font = style.font || '14px sans-serif';
    ctx.textAlign = style.align || 'left';
    ctx.textBaseline = style.baseline || 'alphabetic';
    if (style.opacity !== undefined) ctx.globalAlpha = style.opacity;
    if (style.fill) {
      ctx.fillStyle = style.fill;
      ctx.fillText(text, x, y, style.maxWidth);
    }
    if (style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.lineWidth || 1;
      ctx.strokeText(text, x, y, style.maxWidth);
    }
    ctx.restore();
  },

  /**
   * Draw an arrow from (x1,y1) to (x2,y2).
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {object} style - { stroke, lineWidth, headSize }
   */
  drawArrow(ctx, x1, y1, x2, y2, style = {}) {
    const headSize = style.headSize || 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    applyStyle(ctx, style);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headSize * Math.cos(angle - Math.PI / 6),
      y2 - headSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headSize * Math.cos(angle + Math.PI / 6),
      y2 - headSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = style.stroke || '#000';
    ctx.fill();
    ctx.restore();
  },

  /**
   * Clear a rectangular area.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} w
   * @param {number} h
   */
  clear(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  },

  /**
   * Create a linear gradient.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {Array<{offset: number, color: string}>} stops
   */
  linearGradient(ctx, x1, y1, x2, y2, stops) {
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    stops.forEach(s => grad.addColorStop(s.offset, s.color));
    return grad;
  },

  /**
   * Create a radial gradient.
   */
  radialGradient(ctx, x1, y1, r1, x2, y2, r2, stops) {
    const grad = ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
    stops.forEach(s => grad.addColorStop(s.offset, s.color));
    return grad;
  }
};

function applyStyle(ctx, style) {
  if (style.opacity !== undefined) ctx.globalAlpha = style.opacity;
  if (style.fill) ctx.fillStyle = style.fill;
  if (style.stroke) ctx.strokeStyle = style.stroke;
  if (style.lineWidth !== undefined) ctx.lineWidth = style.lineWidth;
  if (style.lineDash) ctx.setLineDash(style.lineDash);
  if (style.lineCap) ctx.lineCap = style.lineCap;
  if (style.lineJoin) ctx.lineJoin = style.lineJoin;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
