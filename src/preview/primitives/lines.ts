/**
 * Lines Primitive Renderer
 */

import type { LinesElement } from '../../types';

export function renderLines(
  ctx: CanvasRenderingContext2D,
  el: LinesElement,
  width: number,
  height: number,
  random: () => number,
  t: number
): void {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;

  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;

  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < el.count; i++) {
    const thickness = el.thickness[0] + random() * (el.thickness[1] - el.thickness[0]);
    ctx.lineWidth = thickness;

    ctx.beginPath();

    switch (el.direction) {
      case 'horizontal': {
        const y = (i / el.count) * height;
        const wobble = Math.sin(i * 0.5 + t * 2) * 10;
        ctx.moveTo(0, y + wobble);
        ctx.lineTo(width, y + wobble);
        break;
      }

      case 'vertical': {
        const x = (i / el.count) * width;
        const wobble = Math.sin(i * 0.5 + t * 2) * 10;
        ctx.moveTo(x + wobble, 0);
        ctx.lineTo(x + wobble, height);
        break;
      }

      case 'diagonal': {
        const offset = (i / el.count) * (width + height) - height;
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset + height, height);
        break;
      }

      case 'radial': {
        const angle = (i / el.count) * Math.PI * 2 + t * 0.2;
        const len = Math.min(width, height) * 0.4;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        break;
      }
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
