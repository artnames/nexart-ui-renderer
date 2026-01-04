/**
 * @nexart/ui-renderer v0.8.8 - Code Mode Renderer
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PREVIEW RENDERER — LIGHTWEIGHT, NON-AUTHORITATIVE                       ║
 * ║                                                                          ║
 * ║  This renderer is a preview-only runtime.                                ║
 * ║  It does not guarantee determinism or protocol compliance.               ║
 * ║                                                                          ║
 * ║  Performance: Native requestAnimationFrame (~60 FPS), canvas max 900px   ║
 * ║  Animation: Runs continuously until stop() is called                     ║
 * ║                                                                          ║
 * ║  For minting, export, or validation: use @nexart/codemode-sdk            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import type { NexArtCodeSystem, PreviewOptions } from '../types';
import {
  CANVAS_LIMITS,
  type PreviewRenderResult,
} from './preview-types';
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
  console.log('[UIRenderer] Preview mode → native requestAnimationFrame (~60 FPS)');
  console.log(`[UIRenderer] Canvas max ${CANVAS_LIMITS.MAX_DIMENSION}px`);

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
      // ╔═══════════════════════════════════════════════════════════════════════╗
      // ║  LIVE RUNTIME BINDING — v0.8.7 FIX                                    ║
      // ║                                                                       ║
      // ║  Time-varying properties (frameCount, t, time, tGlobal, totalFrames)  ║
      // ║  must be accessed via getters that read from the live runtime object. ║
      // ║                                                                       ║
      // ║  We use a Proxy + with() pattern to enable bare-name access to live   ║
      // ║  runtime properties. The proxy's get trap reads from runtime for      ║
      // ║  time-varying props, and from a static cache for everything else.     ║
      // ╚═══════════════════════════════════════════════════════════════════════╝
      
      // Time-varying properties that need live access
      const liveProps = new Set(['frameCount', 't', 'time', 'tGlobal', 'totalFrames']);
      
      // Cache static properties (functions, constants)
      const staticCache: Record<string, any> = {};
      for (const key of Object.keys(runtime!)) {
        if (!liveProps.has(key)) {
          staticCache[key] = (runtime as any)[key];
        }
      }
      
      const registerSetup = (fn: () => void) => { setupFn = fn; };
      const registerDraw = (fn: () => void) => { drawFn = fn; };
      
      // Build the set of all known keys (for has trap)
      const knownKeys = new Set([
        ...liveProps,
        ...Object.keys(staticCache),
        '__registerSetup',
        '__registerDraw'
      ]);
      
      // Create a proxy that provides live access to time-varying properties
      // IMPORTANT: has() must return true ONLY for known keys
      // Otherwise globals (Math, window, etc.) are masked and become undefined
      const runtimeRef = runtime!;
      const scope = new Proxy({} as Record<string, any>, {
        has: (_, prop: string) => knownKeys.has(prop),
        get: (_, prop: string) => {
          // Time-varying properties - read live from runtime
          if (liveProps.has(prop)) {
            return (runtimeRef as any)[prop];
          }
          // Special functions
          if (prop === '__registerSetup') return registerSetup;
          if (prop === '__registerDraw') return registerDraw;
          // Static properties from cache
          if (prop in staticCache) return staticCache[prop];
          // Fall through to undefined (should not hit this if has() is correct)
          return undefined;
        }
      });
      
      // Use with() to make the proxy scope available to bare variable names
      // Note: with() is safe here since we control the scope completely
      const wrappedSource = `
        with (__scope) {
          ${system.source}
          if (typeof setup === 'function') __registerSetup(setup);
          if (typeof draw === 'function') __registerDraw(draw);
        }
      `;

      const fn = new Function('__scope', wrappedSource);
      fn(scope);
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

      isRunning = true;

      // ╔═══════════════════════════════════════════════════════════════════════╗
      // ║  ANIMATION LOOP — NATIVE requestAnimationFrame (~60 FPS)              ║
      // ║                                                                       ║
      // ║  v0.8.8: Removed FPS throttle for smooth rendering matching NexArt.   ║
      // ║  Browser handles frame pacing naturally via requestAnimationFrame.    ║
      // ║  Looping uses modulo math: t = (frame % total) / total                ║
      // ║  Canvas cleared before each draw() call.                              ║
      // ╚═══════════════════════════════════════════════════════════════════════╝
      const loop = () => {
        // Schedule next frame first — loop runs until stop()
        animationId = requestAnimationFrame(loop);

        // Exit if stopped or destroyed
        if (!isRunning || isDestroyed) return;

        frameCount++;

        // Update runtime timing using modulo for natural looping
        if (runtime) {
          runtime.frameCount = frameCount;
          runtime.t = (frameCount % totalFrames) / totalFrames;
          runtime.time = runtime.t;
          runtime.tGlobal = runtime.t;
        }

        try {
          // Clear and draw
          clearCanvasIgnoringTransform(ctx, canvas);
          if (drawFn) drawFn();
          drawBadge();
        } catch (error) {
          console.warn('[UIRenderer] Draw error:', error);
        }
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
