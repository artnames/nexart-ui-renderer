/**
 * Waves Primitive Renderer
 */

import type { WavesElement } from '../../types.js';

export function renderWaves(
  ctx: CanvasRenderingContext2D,
  el: WavesElement,
  width: number,
  height: number,
  random: () => number,
  t: number
): void {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;
  const count = el.count || 8;

  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2;

  const maxAmp = Math.min(width, height) * 0.3 * el.amplitude;

  for (let w = 0; w < count; w++) {
    const waveOffset = w / count;
    ctx.beginPath();

    if (el.axis === 'x') {
      const baseY = height * (0.2 + waveOffset * 0.6);
      for (let x = 0; x <= width; x += 5) {
        const phase = (x / width) * Math.PI * 2 * el.frequency + t * 2 + w;
        const y = baseY + Math.sin(phase) * maxAmp;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    } else {
      const baseX = width * (0.2 + waveOffset * 0.6);
      for (let y = 0; y <= height; y += 5) {
        const phase = (y / height) * Math.PI * 2 * el.frequency + t * 2 + w;
        const x = baseX + Math.sin(phase) * maxAmp;
        if (y === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
