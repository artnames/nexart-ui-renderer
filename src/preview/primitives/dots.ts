/**
 * Dots Primitive Renderer
 */

import type { DotsElement } from '../../types.js';

export function renderDots(
  ctx: CanvasRenderingContext2D,
  el: DotsElement,
  width: number,
  height: number,
  random: () => number,
  t: number
): void {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;

  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;

  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < el.count; i++) {
    let x: number, y: number;
    const size = el.size[0] + random() * (el.size[1] - el.size[0]);

    switch (el.distribution) {
      case 'random':
        x = random() * width;
        y = random() * height;
        break;

      case 'radial': {
        const angle = random() * Math.PI * 2;
        const radius = random() * Math.min(width, height) * 0.45;
        x = cx + Math.cos(angle + t * 0.5) * radius;
        y = cy + Math.sin(angle + t * 0.5) * radius;
        break;
      }

      case 'grid': {
        const cols = Math.ceil(Math.sqrt(el.count));
        const rows = Math.ceil(el.count / cols);
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellW = width / cols;
        const cellH = height / rows;
        x = cellW * (col + 0.5) + (random() - 0.5) * cellW * 0.3;
        y = cellH * (row + 0.5) + (random() - 0.5) * cellH * 0.3;
        break;
      }

      case 'spiral': {
        const spiralAngle = (i / el.count) * Math.PI * 8 + t;
        const spiralRadius = (i / el.count) * Math.min(width, height) * 0.45;
        x = cx + Math.cos(spiralAngle) * spiralRadius;
        y = cy + Math.sin(spiralAngle) * spiralRadius;
        break;
      }

      default:
        x = random() * width;
        y = random() * height;
    }

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
