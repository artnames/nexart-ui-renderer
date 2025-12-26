/**
 * @nexart/ui-renderer v0.2.0 - Preview Renderer
 *
 * Renders visual approximations of NexArt systems.
 * This is NOT canonical output - for preview/exploration only.
 */

import type { NexArtSystem, PreviewOptions } from '../types';
import { renderDots } from './primitives/dots';
import { renderLines } from './primitives/lines';
import { renderWaves } from './primitives/waves';
import { renderGrid } from './primitives/grid';
import { renderFlowField } from './primitives/flow';
import { renderOrbits } from './primitives/orbits';

function createPRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseColor(color: string): string {
  const colorMap: Record<string, string> = {
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    black: '#000000',
    white: '#ffffff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    orange: '#ff8000',
    purple: '#8000ff',
    pink: '#ff0080',
    gray: '#808080',
    grey: '#808080',
  };
  return colorMap[color.toLowerCase()] || color;
}

export interface PreviewRenderer {
  render: () => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  isCanonical: false;
  isArchival: false;
}

export function previewSystem(
  system: NexArtSystem,
  canvas: HTMLCanvasElement,
  options: PreviewOptions = {}
): PreviewRenderer {
  const { mode = 'static', showBadge = true } = options;

  const width = canvas.width || 800;
  const height = canvas.height || 800;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  let animationId: number | null = null;

  const renderFrame = (t: number = 0) => {
    const random = createPRNG(system.seed);

    ctx.fillStyle = parseColor(system.background.color);
    ctx.fillRect(0, 0, width, height);

    if (system.background.gradient) {
      const g = system.background.gradient;
      let gradient: CanvasGradient;

      if (g.type === 'radial') {
        gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.max(width, height) / 2
        );
      } else {
        const angle = (g.angle || 0) * (Math.PI / 180);
        const dx = Math.cos(angle) * width;
        const dy = Math.sin(angle) * height;
        gradient = ctx.createLinearGradient(
          width / 2 - dx / 2, height / 2 - dy / 2,
          width / 2 + dx / 2, height / 2 + dy / 2
        );
      }

      g.colors.forEach((c, i) => {
        gradient.addColorStop(i / (g.colors.length - 1), parseColor(c));
      });

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    if (system.background.texture === 'noise' || system.background.texture === 'grain') {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const intensity = system.background.texture === 'noise' ? 30 : 15;

      for (let i = 0; i < data.length; i += 4) {
        const noise = (random() - 0.5) * intensity;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    for (const el of system.elements) {
      const elRandom = createPRNG(system.seed + system.elements.indexOf(el) * 1000);

      switch (el.type) {
        case 'dots':
          renderDots(ctx, el, width, height, elRandom, t);
          break;
        case 'lines':
          renderLines(ctx, el, width, height, elRandom, t);
          break;
        case 'waves':
          renderWaves(ctx, el, width, height, elRandom, t);
          break;
        case 'grid':
          renderGrid(ctx, el, width, height, elRandom, t);
          break;
        case 'flowField':
          renderFlowField(ctx, el, width, height, elRandom, system.seed, t);
          break;
        case 'orbits':
          renderOrbits(ctx, el, width, height, elRandom, t);
          break;
      }
    }

    if (showBadge) {
      drawBadge(ctx, width);
    }
  };

  const drawBadge = (ctx: CanvasRenderingContext2D, width: number) => {
    const text = '⚠️ Preview Renderer (Non-Canonical)';
    ctx.font = '12px -apple-system, sans-serif';
    const metrics = ctx.measureText(text);
    const padding = 8;
    const badgeWidth = metrics.width + padding * 2;
    const badgeHeight = 24;
    const x = width - badgeWidth - 10;
    const y = 10;

    ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, badgeWidth, badgeHeight, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff9999';
    ctx.fillText(text, x + padding, y + 16);
  };

  const render = () => {
    renderFrame(0);
  };

  const start = () => {
    stop();
    const startTime = performance.now();
    const speed = system.motion?.speed ?? 1;

    const loop = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = system.motion?.source === 'time' ? elapsed * speed : 0;
      renderFrame(t);
      animationId = requestAnimationFrame(loop);
    };

    if (mode === 'loop' && system.motion?.source !== 'none') {
      animationId = requestAnimationFrame(loop);
    } else {
      render();
    }
  };

  const stop = () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const destroy = () => {
    stop();
    ctx.clearRect(0, 0, width, height);
  };

  return {
    render,
    start,
    stop,
    destroy,
    isCanonical: false as const,
    isArchival: false as const,
  };
}
