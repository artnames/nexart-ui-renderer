/**
 * Orbits Primitive Renderer
 */

import type { OrbitsElement } from '../../types.js';

export function renderOrbits(
  ctx: CanvasRenderingContext2D,
  el: OrbitsElement,
  width: number,
  height: number,
  random: () => number,
  t: number
): void {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;
  const speed = el.speed ?? 1;

  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;

  const cx = width / 2;
  const cy = height / 2;

  for (let o = 0; o < el.count; o++) {
    const orbitRadius =
      el.radius[0] + (random() * (el.radius[1] - el.radius[0]));
    const orbitPhase = random() * Math.PI * 2;

    for (let d = 0; d < el.dotCount; d++) {
      const angle = (d / el.dotCount) * Math.PI * 2 + t * speed + orbitPhase;
      const wobble = Math.sin(angle * 3 + t * 2) * 10;

      const x = cx + Math.cos(angle) * (orbitRadius + wobble);
      const y = cy + Math.sin(angle) * (orbitRadius + wobble);

      const size = 2 + random() * 3;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}
