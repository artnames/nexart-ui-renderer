/**
 * @nexart/ui-renderer - Preview Engine
 * 
 * Lightweight, non-authoritative preview executor.
 * Safe, interruptible, and performant.
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PREVIEW ENGINE — NON-CANONICAL                                          ║
 * ║                                                                          ║
 * ║  This engine is a preview-only runtime.                                  ║
 * ║  It does not guarantee determinism or protocol compliance.               ║
 * ║                                                                          ║
 * ║  Usage:                                                                  ║
 * ║  - Editor live preview                                                   ║
 * ║  - Builder dashboards                                                    ║
 * ║  - Background generative art                                             ║
 * ║  - Static or loop previews                                               ║
 * ║                                                                          ║
 * ║  NOT for:                                                                ║
 * ║  - Minting / export                                                      ║
 * ║  - ByX                                                                   ║
 * ║  - Protocol validation                                                   ║
 * ║                                                                          ║
 * ║  For canonical output: use @nexart/codemode-sdk                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  type PreviewEngineConfig,
  type PreviewRenderResult,
  type PreviewRenderer,
  PREVIEW_BUDGET,
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
} from './canvas-scaler';
import { createPreviewRuntime, type PreviewP5Runtime } from './preview-runtime';

let activePreviewRenderer: PreviewEngine | null = null;

class PreviewEngine implements PreviewRenderer {
  private canvas: HTMLCanvasElement;
  private runtime: PreviewP5Runtime | null = null;
  private setupFn: (() => void) | null = null;
  private drawFn: (() => void) | null = null;
  private animationFrameId: number | null = null;
  private budget = createFrameBudget();
  private config: PreviewEngineConfig;
  private running = false;
  private internalFrameCount = 0;

  readonly isCanonical = false as const;
  readonly isArchival = false as const;

  constructor(config: PreviewEngineConfig) {
    this.config = config;
    this.canvas = config.canvas;
    this.initialize();
  }

  private initialize(): void {
    const scaled = calculateScaledDimensions(this.config.width, this.config.height);
    applyScaledDimensions(this.canvas, scaled);

    // NOTE: Canvas resizing resets the 2D context transform.
    // Reapply scale factor once after resize for correct rendering.
    reapplyContextScale(this.canvas, scaled);

    // ╔═══════════════════════════════════════════════════════════════════════╗
    // ║  ARCHITECTURAL INVARIANT — DO NOT CHANGE                              ║
    // ║  Runtime width/height MUST equal protocol dimensions.                 ║
    // ║  DO NOT pass renderWidth/renderHeight — breaks loop animations.       ║
    // ║  Scaling is handled by ctx.scale(), not by changing width/height.     ║
    // ╚═══════════════════════════════════════════════════════════════════════╝
    this.runtime = createPreviewRuntime(
      this.canvas,
      scaled.originalWidth,   // ← Protocol dimension
      scaled.originalHeight,  // ← Protocol dimension
      this.config.seed ?? 12345,
      this.config.vars ?? []
    );

    const totalFrames = this.config.totalFrames ?? 120;
    this.runtime.totalFrames = totalFrames;

    try {
      const fn = this.compileSource(this.config.source);
      fn();
    } catch (error) {
      console.warn('[PreviewEngine] Error compiling source:', error);
    }
  }

  private compileSource(source: string): () => void {
    const runtime = this.runtime!;
    const self = this;

    const globalVars = Object.keys(runtime);
    const globalValues = Object.values(runtime);

    globalVars.push('setup', 'draw');

    const wrappedSource = `
      ${source}
      if (typeof setup === 'function') __registerSetup(setup);
      if (typeof draw === 'function') __registerDraw(draw);
    `;

    const registerSetup = (fn: () => void) => { self.setupFn = fn; };
    const registerDraw = (fn: () => void) => { self.drawFn = fn; };

    globalValues.push(registerSetup, registerDraw);
    globalVars.push('__registerSetup', '__registerDraw');

    const fn = new Function(...globalVars, wrappedSource);
    return () => fn(...globalValues);
  }

  renderStatic(): PreviewRenderResult {
    resetBudget(this.budget);

    try {
      if (this.setupFn) {
        this.setupFn();
      }
      recordFrame(this.budget);

      return {
        success: true,
        framesRendered: 1,
        executionTimeMs: getElapsedMs(this.budget),
        terminatedEarly: false,
      };
    } catch (error) {
      console.warn('[PreviewEngine] Static render error:', error);
      return {
        success: false,
        framesRendered: 0,
        executionTimeMs: getElapsedMs(this.budget),
        terminatedEarly: true,
        terminationReason: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  startLoop(): void {
    if (this.running) return;
    
    if (activePreviewRenderer && activePreviewRenderer !== this) {
      activePreviewRenderer.stopLoop();
    }
    activePreviewRenderer = this;

    this.running = true;
    resetBudget(this.budget);
    this.internalFrameCount = 0;

    try {
      if (this.setupFn) {
        this.setupFn();
      }
    } catch (error) {
      console.warn('[PreviewEngine] Setup error:', error);
    }

    this.scheduleNextFrame();
  }

  private scheduleNextFrame(): void {
    if (!this.running) return;

    this.animationFrameId = requestAnimationFrame(() => {
      if (!this.running) return;

      if (!canRenderFrame(this.budget)) {
        this.running = false;
        return;
      }

      this.internalFrameCount++;

      if (!shouldSkipFrame(this.internalFrameCount)) {
        try {
          if (this.runtime) {
            this.runtime.frameCount = this.internalFrameCount;
            const totalFrames = this.config.totalFrames ?? 120;
            this.runtime.t = this.internalFrameCount / totalFrames;
            this.runtime.time = this.runtime.t;
            this.runtime.tGlobal = this.runtime.t;
          }

          if (this.drawFn) {
            this.drawFn();
          }
          recordFrame(this.budget);
        } catch (error) {
          console.warn('[PreviewEngine] Draw error:', error);
        }
      }

      this.scheduleNextFrame();
    });
  }

  stopLoop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (activePreviewRenderer === this) {
      activePreviewRenderer = null;
    }
  }

  isRendering(): boolean {
    return this.running;
  }

  destroy(): void {
    this.stopLoop();
    this.runtime = null;
    this.setupFn = null;
    this.drawFn = null;
  }
}

/**
 * Create a preview renderer for the given configuration.
 * 
 * This is the main entry point for preview rendering.
 */
export function createPreviewEngine(config: PreviewEngineConfig): PreviewRenderer {
  return new PreviewEngine(config);
}

/**
 * Render a static preview (single frame).
 */
export function renderStaticPreview(config: PreviewEngineConfig): PreviewRenderResult {
  const engine = new PreviewEngine(config);
  const result = engine.renderStatic();
  engine.destroy();
  return result;
}

/**
 * Stop any active preview renderer.
 */
export function stopActivePreview(): void {
  if (activePreviewRenderer) {
    activePreviewRenderer.stopLoop();
    activePreviewRenderer = null;
  }
}
