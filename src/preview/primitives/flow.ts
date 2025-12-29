/**
 * Flow Field Primitive Renderer
 */

import type { FlowFieldElement } from '../../types.js';

export function renderFlowField(
  ctx: CanvasRenderingContext2D,
  el: FlowFieldElement,
  width: number,
  height: number,
  random: () => number,
  seed: number,
  t: number
): void {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;

  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity * 0.6;
  ctx.lineWidth = 1;

  const noise2D = (x: number, y: number): number => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 0.001) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let i = 0; i < el.particles; i++) {
    let x = random() * width;
    let y = random() * height;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const steps = 15 + Math.floor(random() * 20);

    for (let s = 0; s < steps; s++) {
      const noiseVal = noise2D(x / el.resolution, y / el.resolution + t * 0.3);
      const angle = noiseVal * Math.PI * 4 * el.strength;

      x += Math.cos(angle) * 3;
      y += Math.sin(angle) * 3;

      if (x < 0 || x > width || y < 0 || y > height) break;

      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
