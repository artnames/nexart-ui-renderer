/**
 * Unified Renderer - Handles background, primitive, and sketch elements
 * Dispatches rendering per element type in order: background → primitive → sketch
 * All elements render to the same canvas/context with shared timing
 */

import type { UnifiedSystem, UnifiedElement, PreviewOptions, ColorPalette, SketchElement, BackgroundElement, PrimitiveElement } from '../types';
import { compileBackgroundPreset, getPaletteColors } from '../presets/backgrounds';
import { compilePrimitive } from '../presets/primitives';
import { wrapSketch, validateSketchSafety } from '../presets/sketch-wrapper';
import { createPreviewRuntime } from './preview-runtime';
import { calculateScaledDimensions, applyScaledDimensions, reapplyContextScale, clearCanvasIgnoringTransform } from './canvas-scaler';
import { createFpsThrottle, shouldRenderFrame, recordFrame, resetThrottle } from './frame-budget';
import { PREVIEW_FPS, CANVAS_LIMITS } from './preview-types';

function validateSketchElement(element: SketchElement): void {
  const { safe, warnings } = validateSketchSafety(element.code);
  if (!safe) {
    throw new Error(`Unsafe sketch code: ${warnings.join(', ')}`);
  }
  if (warnings.length > 0) {
    console.warn('[SDK] Sketch warnings:', warnings);
  }
}

export interface UnifiedRenderer {
  render: () => void;
  start: () => void;
  stop: () => void;
  destroy: () => void;
  isCanonical: false;
  isArchival: false;
}

function inferPalette(elements: UnifiedElement[]): ColorPalette {
  for (const el of elements) {
    if (el.type === 'background' && el.palette) {
      return el.palette;
    }
  }
  return 'offwhite-dark';
}

function extractFunctionBody(code: string, funcName: string): string {
  const pattern = new RegExp(`function\\s+${funcName}\\s*\\(\\s*\\)\\s*\\{`);
  const match = code.match(pattern);
  if (!match || match.index === undefined) return '';

  const startIndex = match.index + match[0].length;
  let braceCount = 1;
  let i = startIndex;

  while (i < code.length && braceCount > 0) {
    if (code[i] === '{') braceCount++;
    if (code[i] === '}') braceCount--;
    i++;
  }

  return code.slice(startIndex, i - 1).trim();
}

function extractDrawCode(code: string): string {
  const body = extractFunctionBody(code, 'draw');
  return body || code.trim();
}

function extractSetupCode(code: string): string {
  return extractFunctionBody(code, 'setup');
}

function compileBackgroundElement(element: BackgroundElement, palette: ColorPalette): { setup: string; draw: string } {
  const code = compileBackgroundPreset(
    element.preset,
    element.palette || palette,
    element.loop || { duration: 120 }
  );
  return {
    setup: extractSetupCode(code),
    draw: extractDrawCode(code),
  };
}

function compilePrimitiveElement(element: PrimitiveElement, foreground: string): { setup: string; draw: string } {
  const primitiveCode = compilePrimitive(
    {
      name: element.name,
      count: element.count,
      strokeWeight: element.strokeWeight,
      motion: element.motion,
      color: element.color,
      opacity: element.opacity,
    },
    foreground
  );
  return { setup: '', draw: primitiveCode };
}

function compileSketchElement(element: SketchElement): { setup: string; draw: string } {
  validateSketchElement(element);
  const wrapped = wrapSketch({
    code: element.code,
    normalize: element.normalize !== false,
  });
  return {
    setup: extractSetupCode(wrapped),
    draw: extractDrawCode(wrapped),
  };
}

export function renderUnifiedSystem(
  system: UnifiedSystem,
  canvas: HTMLCanvasElement,
  options: PreviewOptions = {}
): UnifiedRenderer {
  console.log('[UIRenderer] Unified preview → FPS-capped continuous animation');
  console.log(`[UIRenderer] Target: ${PREVIEW_FPS.TARGET_FPS} FPS, canvas max ${CANVAS_LIMITS.MAX_DIMENSION}px`);

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
  const throttle = createFpsThrottle();

  const palette = inferPalette(system.elements);
  const colors = getPaletteColors(palette);
  const totalFrames = system.loop?.duration ?? 120;

  const sortedElements = [...system.elements].sort((a, b) => {
    const order: Record<string, number> = { background: 0, primitive: 1, sketch: 2 };
    return (order[a.type] ?? 3) - (order[b.type] ?? 3);
  });

  const backgroundElements: { setup: string; draw: string }[] = [];
  const primitiveElements: { setup: string; draw: string }[] = [];
  const sketchElements: { setup: string; draw: string }[] = [];

  for (const element of sortedElements) {
    switch (element.type) {
      case 'background':
        backgroundElements.push(compileBackgroundElement(element, palette));
        break;
      case 'primitive':
        primitiveElements.push(compilePrimitiveElement(element, colors.foreground));
        break;
      case 'sketch':
        sketchElements.push(compileSketchElement(element));
        break;
    }
  }

  const hasElements = system.elements.length > 0;
  const hasRenderers = backgroundElements.length > 0 || primitiveElements.length > 0 || sketchElements.length > 0;

  console.log('[UIRenderer] Compiled elements:', {
    background: backgroundElements.length,
    primitive: primitiveElements.length,
    sketch: sketchElements.length,
    backgroundDrawEmpty: backgroundElements.map(e => !e.draw.trim()),
    primitiveDrawEmpty: primitiveElements.map(e => !e.draw.trim()),
    sketchDrawEmpty: sketchElements.map(e => !e.draw.trim()),
  });

  if (hasElements && !hasRenderers) {
    throw new Error('[UIRenderer] No renderers executed despite having elements');
  }

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

  const executeCode = (p: ReturnType<typeof createPreviewRuntime>, code: string, frame: number, t: number) => {
    if (!code.trim()) return;
    try {
      const wrappedCode = new Function(
        'p', 'frameCount', 't', 'time', 'tGlobal',
        `with(p) { ${code} }`
      );
      wrappedCode(p, frame, t, t * (totalFrames / 30), t);
    } catch (err) {
      console.error('[UIRenderer] Code execution error:', err);
    }
  };

  const runSetup = (p: ReturnType<typeof createPreviewRuntime>) => {
    let setupRan = false;
    
    for (const el of backgroundElements) {
      if (el.setup) {
        executeCode(p, el.setup, 0, 0);
        setupRan = true;
      }
    }

    for (const el of primitiveElements) {
      if (el.setup) {
        executeCode(p, el.setup, 0, 0);
        setupRan = true;
      }
    }

    for (const el of sketchElements) {
      if (el.setup) {
        executeCode(p, el.setup, 0, 0);
        setupRan = true;
      }
    }

    if (!setupRan) {
      p.strokeWeight(1.5);
    }
  };

  const runDraw = (p: ReturnType<typeof createPreviewRuntime>, frame: number, t: number) => {
    let elementsRendered = 0;

    const hasBackground = backgroundElements.length > 0;
    if (!hasBackground) {
      p.background(colors.background);
    }

    for (const el of backgroundElements) {
      if (el.draw) {
        console.log('[UIRenderer] background rendered');
        executeCode(p, el.draw, frame, t);
        elementsRendered++;
      }
    }

    for (const el of primitiveElements) {
      if (el.draw) {
        console.log('[UIRenderer] primitive rendered');
        executeCode(p, el.draw, frame, t);
        elementsRendered++;
      }
    }

    for (const el of sketchElements) {
      if (el.draw) {
        console.log('[UIRenderer] sketch rendered');
        executeCode(p, el.draw, frame, t);
        elementsRendered++;
      }
    }

    if (hasElements && elementsRendered === 0) {
      throw new Error('[UIRenderer] Zero renderers executed in frame despite having elements');
    }
  };

  const renderLoop = () => {
    if (isDestroyed) return;

    try {
      let frameCount = 0;
      // ╔═══════════════════════════════════════════════════════════════════════╗
      // ║  ARCHITECTURAL INVARIANT — DO NOT CHANGE                              ║
      // ║  Runtime width/height MUST equal protocol dimensions.                 ║
      // ║  DO NOT pass renderWidth/renderHeight — breaks loop animations.       ║
      // ║  Scaling is handled by ctx.scale(), not by changing width/height.     ║
      // ╚═══════════════════════════════════════════════════════════════════════╝
      const p = createPreviewRuntime(
        canvas,
        scaled.originalWidth,   // ← Protocol dimension
        scaled.originalHeight,  // ← Protocol dimension
        system.seed
      );

      runSetup(p);
      resetThrottle(throttle);
      isRunning = true;

      // ╔═══════════════════════════════════════════════════════════════════════╗
      // ║  ANIMATION LOOP — CONTINUOUS FPS-CAPPED RENDERING                     ║
      // ║                                                                       ║
      // ║  requestAnimationFrame runs continuously until stop() is called.      ║
      // ║  FPS throttle (8 FPS) prevents excessive CPU usage.                   ║
      // ║  Looping uses modulo math: t = (frame % total) / total                ║
      // ╚═══════════════════════════════════════════════════════════════════════╝
      const loop = () => {
        // Schedule next frame — loop runs until stop()
        animationId = requestAnimationFrame(loop);

        // Exit if stopped or destroyed
        if (!isRunning || isDestroyed) return;

        // FPS throttle — skip if not enough time has passed
        if (!shouldRenderFrame(throttle)) {
          return;  // Preserve current canvas
        }

        frameCount++;

        // Calculate t using modulo for natural looping
        const t = (frameCount % totalFrames) / totalFrames;

        p.randomSeed(system.seed);
        p.noiseSeed(system.seed);

        try {
          runDraw(p, frameCount, t);
          drawBadge();
          recordFrame(throttle);
        } catch (error) {
          console.warn('[UIRenderer] Draw error:', error);
        }
      };

      animationId = requestAnimationFrame(loop);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.warn('[UIRenderer] Loop render error:', err.message);
      onError?.(err);
    }
  };

  const render = () => {
    if (isDestroyed) return;
    renderLoop();
  };

  const start = () => {
    if (isDestroyed) return;
    stop();
    renderLoop();
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
  };

  const renderer: UnifiedRenderer = {
    render,
    start,
    stop,
    destroy,
    isCanonical: false as const,
    isArchival: false as const,
  };

  return renderer;
}
