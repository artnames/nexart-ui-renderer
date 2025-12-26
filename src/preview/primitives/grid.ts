/**
 * Grid Primitive Renderer
 */

import type { GridElement } from '../../types';

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  el: GridElement,
  width: number,
  height: number,
  random: () => number,
  t: number
): void {
  const color = el.color || 'white';
  const opacity = el.opacity ?? 1;

  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;

  const cellW = width / el.cols;
  const cellH = height / el.rows;
  const baseSize = el.cellSize || Math.min(cellW, cellH) * 0.4;

  for (let row = 0; row < el.rows; row++) {
    for (let col = 0; col < el.cols; col++) {
      const x = cellW * (col + 0.5);
      const y = cellH * (row + 0.5);

      const pulse = 1 + Math.sin((row + col) * 0.5 + t * 3) * 0.2;
      const size = baseSize * pulse;

      ctx.beginPath();

      switch (el.shape) {
        case 'circle':
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          break;

        case 'square':
          ctx.rect(x - size / 2, y - size / 2, size, size);
          break;

        case 'diamond':
          ctx.moveTo(x, y - size / 2);
          ctx.lineTo(x + size / 2, y);
          ctx.lineTo(x, y + size / 2);
          ctx.lineTo(x - size / 2, y);
          ctx.closePath();
          break;
      }

      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}
