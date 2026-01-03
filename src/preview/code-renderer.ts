/**
 * @nexart/ui-renderer v0.8.0 - Code Mode Renderer
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PREVIEW RENDERER — LIGHTWEIGHT, NON-AUTHORITATIVE                       ║
 * ║                                                                          ║
 * ║  This renderer is a preview-only runtime.                                ║
 * ║  It does not guarantee determinism or protocol compliance.               ║
 * ║                                                                          ║
 * ║  Performance Limits (MANDATORY):                                         ║
 * ║  - Max frames: 30                                                        ║
 * ║  - Max total time: 500ms                                                 ║
 * ║  - Max canvas dimension: 900px                                           ║
 * ║  - Frame stride: render every 3rd frame                                  ║
 * ║                                                                          ║
 * ║  For minting, export, or validation: use @nexart/codemode-sdk            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { NexArtCodeSystem, PreviewOptions } from '../types';
import {
  PREVIEW_BUDGET,
  CANVAS_LIMITS,
  type PreviewRenderResult,
} from './preview-types';
import {
  createFrameBudget,
  canRenderFrame,
  recordFrame,
  getElapsedMs,
  resetBudget,
  shouldSkipFrame,
} from './frame-budget';
import {
  calculateScaledDimensions,
  applyScaledDimensions,
  reapplyContextScale,
  clearCanvasIgnoringTransform,
} from './canvas-scaler';
import { createPreviewRuntime, type PreviewP5Runtime } from './preview-runtime';

const PROTOCOL_VERSION = '1.2.0';

let activeRendererInstance: CodeRenderer | null = null;

export interface CodeRenderer {
  render: () => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  isCanonical: false;
  isArchival: false;
}

/**
 * Normalize VAR array.
 * Preview version clamps instead of throwing for better UX.
 */
function normalizeVars(vars?: number[]): number[] {
  if (!vars || !Array.isArray(vars)) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  const result: number[] = [];
  for (let i = 0; i < Math.min(vars.length, 10); i++) {
    const v = vars[i];
    if (typeof v === 'number' && Number.isFinite(v)) {
      result.push(Math.max(0, Math.min(100, v)));
    } else {
      result.push(0);
    }
  }
  while (result.length < 10) result.push(0);
  return result;
}


export function renderCodeModeSystem(
  system: NexArtCodeSystem,
  canvas: HTMLCanvasElement,
  options: PreviewOptions = {}
): CodeRenderer {
  console.log('[UIRenderer] Preview mode → lightweight runtime with budget limits');
  console.log(`[UIRenderer] Budget: max ${PREVIEW_BUDGET.MAX_FRAMES} frames, ${PREVIEW_BUDGET.MAX_TOTAL_TIME_MS}ms`);

  if (activeRendererInstance) {
    activeRendererInstance.destroy();
    activeRendererInstance = null;
  }

  const { showBadge = true, onPreview, onComplete, onError } = options;

  const scaled = calculateScaledDimensions(system.width, system.height);
  if (scaled.wasScaled) {
    console.log(`[UIRenderer] Canvas scaled: ${system.width}x${system.height} → ${scaled.renderWidth}x${scaled.renderHeight}`);
  }
  applyScaledDimensions(canvas, scaled);

  // NOTE: Canvas resizing resets the 2D context transform.
  // Reapply scale factor once after resize for correct rendering.
  reapplyContextScale(canvas, scaled);

  const ctx = canvas.getContext('2d')!;
  let animationId: number | null = null;
  let isRunning = false;
  let isDestroyed = false;
  const budget = createFrameBudget();

  const normalizedVars = normalizeVars(system.vars);

  let runtime: PreviewP5Runtime | null = null;
  let setupFn: (() => void) | null = null;
  let drawFn: (() => void) | null = null;

  const compileSource = () => {
    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║  ARCHITECTURAL INVARIANT — DO NOT CHANGE                              ║
    // ║                                                                       ║
    // ║  Runtime width/height MUST always equal protocol dimensions.          ║
    // ║  DO NOT pass scaled values (renderWidth/renderHeight) here.           ║
    // ║                                                                       ║
    // ║  Scaling is a RENDERING concern handled by ctx.scale().               ║
    // ║  width/height are SEMANTIC values used by sketch math.                ║
    // ║                                                                       ║
    // ║  Passing scaled dimensions breaks loop animations and geometry.       ║
    // ║  This invariant is locked for v0.x — see CHANGELOG v0.8.2.            ║
    // ╚═══════════════════════════════════════════════════════════════════════╝
    runtime = createPreviewRuntime(
      canvas,
      scaled.originalWidth,   // ← Protocol dimension (e.g. 1950)
      scaled.originalHeight,  // ← Protocol dimension (e.g. 2400)
      system.seed ?? 12345,
      normalizedVars
    );

    const totalFrames = system.totalFrames ?? 120;
    runtime.totalFrames = totalFrames;

    try {
      const globalVars = Object.keys(runtime);
      const globalValues = Object.values(runtime);

      const wrappedSource = `
        ${system.source}
        if (typeof setup === 'function') __registerSetup(setup);
        if (typeof draw === 'function') __registerDraw(draw);
      `;

      const registerSetup = (fn: () => void) => { setupFn = fn; };
      const registerDraw = (fn: () => void) => { drawFn = fn; };

      globalVars.push('__registerSetup', '__registerDraw');
      globalValues.push(registerSetup, registerDraw);

      const fn = new Function(...globalVars, wrappedSource);
      fn(...globalValues);
    } catch (error) {
      console.warn('[UIRenderer] Compile error:', error);
    }
  };

  const drawBadge = () => {
    if (!showBadge) return;
    const text = '⚠️ Preview';
    ctx.font = '10px -apple-system, sans-serif';
    const metrics = ctx.measureText(text);
    const padding = 6;
    const badgeWidth = metrics.width + padding * 2;
    const badgeHeight = 18;
    const x = scaled.renderWidth - badgeWidth - 6;
    const y = 6;

    ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, badgeWidth, badgeHeight, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff9999';
    ctx.fillText(text, x + padding, y + 13);
  };

  const renderBlackCanvas = (error: Error) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, scaled.renderWidth, scaled.renderHeight);
    ctx.fillStyle = '#ff6666';
    ctx.font = '12px monospace';
    ctx.fillText('[Preview Error]', 10, 20);
    ctx.fillText(error.message.slice(0, 60), 10, 36);
  };

  const renderStatic = () => {
    try {
      compileSource();
      
      if (setupFn) {
        setupFn();
      }

      drawBadge();
      onPreview?.(canvas);

      canvas.toBlob((blob) => {
        if (blob) {
          onComplete?.({ type: 'image', blob });
        }
      }, 'image/png');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn('[UIRenderer] Static render error:', err.message);
      renderBlackCanvas(err);
      onError?.(err);
    }
  };

  const renderLoop = () => {
    if (isDestroyed) return;

    try {
      compileSource();

      if (!drawFn) {
        console.warn('[UIRenderer] Loop mode: no draw() function found, using static');
        renderStatic();
        return;
      }

      const totalFrames = system.totalFrames ?? 120;
      let frameCount = 0;

      if (setupFn) {
        setupFn();
      }

      resetBudget(budget);
      isRunning = true;

      const loop = () => {
        if (!isRunning || isDestroyed) return;

        if (!canRenderFrame(budget)) {
          console.log(`[UIRenderer] Budget exhausted: ${budget.exhaustionReason}`);
          isRunning = false;
          return;
        }

        frameCount++;

        if (!shouldSkipFrame(frameCount)) {
          if (runtime) {
            runtime.frameCount = frameCount;
            runtime.t = (frameCount % totalFrames) / totalFrames;
            runtime.time = runtime.t;
            runtime.tGlobal = runtime.t;
          }

          try {
            clearCanvasIgnoringTransform(ctx, canvas);
            if (drawFn) drawFn();
            drawBadge();
            recordFrame(budget);
          } catch (error) {
            console.warn('[UIRenderer] Draw error:', error);
          }
        }

        animationId = requestAnimationFrame(loop);
      };

      animationId = requestAnimationFrame(loop);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn('[UIRenderer] Loop render error:', err.message);
      renderBlackCanvas(err);
      onError?.(err);
    }
  };

  const render = () => {
    if (isDestroyed) return;
    if (system.mode === 'static') {
      renderStatic();
    } else {
      renderLoop();
    }
  };

  const start = () => {
    if (isDestroyed) return;
    stop();
    if (system.mode === 'loop') {
      renderLoop();
    } else {
      renderStatic();
    }
  };

  const stop = () => {
    isRunning = false;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const destroy = () => {
    isDestroyed = true;
    stop();
    clearCanvasIgnoringTransform(ctx, canvas);
    runtime = null;
    setupFn = null;
    drawFn = null;
    if (activeRendererInstance === renderer) {
      activeRendererInstance = null;
    }
  };

  const renderer: CodeRenderer = {
    render,
    start,
    stop,
    destroy,
    isCanonical: false as const,
    isArchival: false as const,
  };

  activeRendererInstance = renderer;

  return renderer;
}
