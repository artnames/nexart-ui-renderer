/**
 * @nexart/ui-renderer - Preview Engine
 * Version: 0.9.0
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
 * ║  v0.9.0 Features:                                                        ║
 * ║  - Budget exceed callbacks + overlay                                     ║
 * ║  - getPreviewStats() for observability                                   ║
 * ║  - toCanonicalRequest() for handoff to @nexart/codemode-sdk              ║
 * ║                                                                          ║
 * ║  Animation runs at native RAF cadence (~60 FPS) per v0.8.8.              ║
 * ║  Budget system uses frame count + time limits (not FPS throttling).      ║
 * ║                                                                          ║
 * ║  For canonical output: use @nexart/codemode-sdk                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import {
  type PreviewEngineConfig,
  type PreviewRenderResult,
  type PreviewRenderer,
  type PreviewStats,
  type BudgetExceededInfo,
  type BudgetExceedReason,
  type CanonicalRequest,
  PREVIEW_BUDGET,
} from './preview-types';
import {
  calculateScaledDimensions,
  applyScaledDimensions,
  reapplyContextScale,
  type ScaledDimensions,
} from './canvas-scaler';
import { createPreviewRuntime, type PreviewP5Runtime } from './preview-runtime';

const SDK_VERSION = '0.9.0';

let activePreviewRenderer: PreviewEngine | null = null;

class PreviewEngine implements PreviewRenderer {
  private canvas: HTMLCanvasElement;
  private runtime: PreviewP5Runtime | null = null;
  private setupFn: (() => void) | null = null;
  private drawFn: (() => void) | null = null;
  private animationFrameId: number | null = null;
  private config: PreviewEngineConfig;
  private running = false;
  private internalFrameCount = 0;
  private startTimeMs = 0;
  private scaled: ScaledDimensions | null = null;
  private currentStride = 1;
  private budgetExceededReason: BudgetExceedReason | null = null;
  private overlayElement: HTMLDivElement | null = null;

  readonly isCanonical = false as const;
  readonly isArchival = false as const;

  get previewScale(): number {
    return this.scaled?.scaleFactor ?? 1;
  }

  constructor(config: PreviewEngineConfig) {
    this.config = config;
    this.canvas = config.canvas;
    this.initialize();
  }

  private initialize(): void {
    this.scaled = calculateScaledDimensions(this.config.width, this.config.height);
    applyScaledDimensions(this.canvas, this.scaled);
    reapplyContextScale(this.canvas, this.scaled);

    this.runtime = createPreviewRuntime(
      this.canvas,
      this.scaled.originalWidth,
      this.scaled.originalHeight,
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

  getPreviewStats(): PreviewStats {
    const elapsed = this.startTimeMs > 0 ? performance.now() - this.startTimeMs : 0;
    return {
      mode: 'preview',
      scale: this.previewScale,
      semanticWidth: this.scaled?.originalWidth ?? this.config.width,
      semanticHeight: this.scaled?.originalHeight ?? this.config.height,
      bufferWidth: this.scaled?.renderWidth ?? this.config.width,
      bufferHeight: this.scaled?.renderHeight ?? this.config.height,
      frames: this.internalFrameCount,
      stride: this.currentStride,
      totalTimeMs: elapsed,
      ...(this.budgetExceededReason ? { budgetExceeded: { reason: this.budgetExceededReason } } : {}),
    };
  }

  toCanonicalRequest(): CanonicalRequest {
    return {
      seed: this.config.seed ?? 12345,
      vars: this.config.vars ?? [],
      code: this.config.source,
      settings: {
        width: this.config.width,
        height: this.config.height,
        mode: this.config.mode,
        totalFrames: this.config.totalFrames,
      },
      renderer: 'preview',
      uiRendererVersion: SDK_VERSION,
    };
  }

  private showBudgetOverlay(reason: BudgetExceedReason): void {
    if (this.overlayElement) return;

    const showOverlay = this.config.showOverlay ?? (this.config.budgetBehavior === 'stop');
    if (!showOverlay) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 1000;
      pointer-events: none;
    `;

    const reasonText = reason === 'frame_limit' 
      ? `Frame limit reached (${this.internalFrameCount} frames)`
      : `Time limit reached (${Math.round((performance.now() - this.startTimeMs) / 1000)}s)`;

    overlay.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">⚠️ Preview Budget Exceeded</div>
      <div style="font-size: 14px; opacity: 0.8; margin-bottom: 16px;">${reasonText}</div>
      <div style="font-size: 12px; opacity: 0.6; max-width: 280px; text-align: center;">
        Reduce sketch complexity or use @nexart/codemode-sdk for canonical execution.
      </div>
    `;

    const parent = this.canvas.parentElement;
    if (parent) {
      parent.style.position = 'relative';
      parent.appendChild(overlay);
      this.overlayElement = overlay;
    }
  }

  private removeOverlay(): void {
    if (this.overlayElement && this.overlayElement.parentElement) {
      this.overlayElement.parentElement.removeChild(this.overlayElement);
      this.overlayElement = null;
    }
  }

  private handleBudgetExceeded(reason: BudgetExceedReason): void {
    if (this.budgetExceededReason) return; // Already exceeded — fire callback only once

    this.budgetExceededReason = reason;
    const behavior = this.config.budgetBehavior ?? 'stop';

    const info: BudgetExceededInfo = {
      reason,
      framesRendered: this.internalFrameCount,
      totalTimeMs: performance.now() - this.startTimeMs,
      stride: this.currentStride,
      scale: this.previewScale,
    };

    console.warn(`[PreviewEngine] Budget exceeded: ${reason}`, info);

    if (this.config.onBudgetExceeded) {
      this.config.onBudgetExceeded(info);
    }

    if (behavior === 'stop') {
      this.showBudgetOverlay(reason);
      this.stopLoop();
    } else if (behavior === 'degrade') {
      this.currentStride = PREVIEW_BUDGET.DEGRADE_STRIDE;
    }
  }

  private checkBudget(): boolean {
    const maxFrames = this.config.maxFrames ?? PREVIEW_BUDGET.MAX_FRAMES;
    const maxTimeMs = this.config.maxTimeMs ?? PREVIEW_BUDGET.MAX_TOTAL_TIME_MS;
    const elapsed = performance.now() - this.startTimeMs;

    if (this.internalFrameCount >= maxFrames) {
      this.handleBudgetExceeded('frame_limit');
      return false;
    }

    if (elapsed >= maxTimeMs) {
      this.handleBudgetExceeded('time_limit');
      return false;
    }

    return true;
  }

  renderStatic(): PreviewRenderResult {
    const startTime = performance.now();
    this.startTimeMs = startTime;

    try {
      if (this.setupFn) {
        this.setupFn();
      }

      return {
        success: true,
        framesRendered: 1,
        executionTimeMs: performance.now() - startTime,
        terminatedEarly: false,
      };
    } catch (error) {
      console.warn('[PreviewEngine] Static render error:', error);
      return {
        success: false,
        framesRendered: 0,
        executionTimeMs: performance.now() - startTime,
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
    this.startTimeMs = performance.now();
    this.internalFrameCount = 0;
    this.currentStride = 1;
    this.budgetExceededReason = null;
    this.removeOverlay();

    try {
      if (this.setupFn) {
        this.setupFn();
      }
    } catch (error) {
      console.warn('[PreviewEngine] Setup error:', error);
    }

    this.scheduleNextFrame();
  }

  /**
   * Animation loop — runs at native RAF cadence (~60 FPS).
   * No FPS throttle per v0.8.8 decision.
   * Budget system uses frame count and time limits only.
   */
  private scheduleNextFrame(): void {
    this.animationFrameId = requestAnimationFrame(() => {
      // Always schedule next frame first (RAF continues until stop)
      this.scheduleNextFrame();

      // Exit if stopped
      if (!this.running) return;

      this.internalFrameCount++;

      // Check budget — fires callback once when exceeded
      if (!this.checkBudget()) {
        // If behavior is 'stop', loop already halted by handleBudgetExceeded
        // If behavior is 'degrade', continue with stride skipping below
        if (this.config.budgetBehavior !== 'degrade') {
          return;
        }
      }

      // Stride skip in degrade mode (render every Nth frame)
      if (this.currentStride > 1 && this.internalFrameCount % this.currentStride !== 0) {
        return;
      }

      // Update runtime timing using modulo for natural looping
      try {
        if (this.runtime) {
          this.runtime.frameCount = this.internalFrameCount;
          const totalFrames = this.config.totalFrames ?? 120;
          this.runtime.t = (this.internalFrameCount % totalFrames) / totalFrames;
          this.runtime.time = this.runtime.t;
          this.runtime.tGlobal = this.runtime.t;
        }

        if (this.drawFn) {
          this.drawFn();
        }
      } catch (error) {
        console.warn('[PreviewEngine] Draw error:', error);
      }
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
    this.removeOverlay();
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

/**
 * Create a canonical request from preview config.
 * For handoff to @nexart/codemode-sdk.
 */
export function toCanonicalRequest(config: PreviewEngineConfig): CanonicalRequest {
  return {
    seed: config.seed ?? 12345,
    vars: config.vars ?? [],
    code: config.source,
    settings: {
      width: config.width,
      height: config.height,
      mode: config.mode,
      totalFrames: config.totalFrames,
    },
    renderer: 'preview',
    uiRendererVersion: SDK_VERSION,
  };
}
