/**
 * @nexart/ui-renderer - Canvas Scaler
 * 
 * Scales canvas resolution for preview rendering.
 * Preview renderer does NOT render at full mint resolution.
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  CANVAS SCALING — PERFORMANCE CRITICAL                                   ║
 * ║                                                                          ║
 * ║  Max dimension: 900px                                                    ║
 * ║  Preserves aspect ratio                                                  ║
 * ║  Uses CSS scaling for display                                            ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  ARCHITECTURAL INVARIANT (v0.8.2+):                                      ║
 * ║                                                                          ║
 * ║  Scaling is a RENDERING concern, NOT a SEMANTIC one.                     ║
 * ║                                                                          ║
 * ║  - Canvas buffer: scaled (renderWidth × renderHeight)                    ║
 * ║  - Runtime width/height: ALWAYS original protocol dimensions             ║
 * ║  - Context transform: ctx.scale() maps original → render space           ║
 * ║                                                                          ║
 * ║  This ensures sketch math works identically in preview and Code Mode.    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { CANVAS_LIMITS } from './preview-types';

export interface ScaledDimensions {
  /** Scaled width for rendering */
  renderWidth: number;
  /** Scaled height for rendering */
  renderHeight: number;
  /** Original width */
  originalWidth: number;
  /** Original height */
  originalHeight: number;
  /** Scale factor applied */
  scaleFactor: number;
  /** Whether scaling was applied */
  wasScaled: boolean;
}

/**
 * Calculate scaled dimensions for preview rendering.
 * Maintains aspect ratio, caps at MAX_DIMENSION.
 */
export function calculateScaledDimensions(
  width: number,
  height: number
): ScaledDimensions {
  const maxDim = Math.max(width, height);
  
  // If already within limits, no scaling needed
  if (maxDim <= CANVAS_LIMITS.MAX_DIMENSION) {
    return {
      renderWidth: width,
      renderHeight: height,
      originalWidth: width,
      originalHeight: height,
      scaleFactor: 1,
      wasScaled: false,
    };
  }

  // Calculate scale factor to fit within limits
  const scaleFactor = CANVAS_LIMITS.MAX_DIMENSION / maxDim;
  
  return {
    renderWidth: Math.round(width * scaleFactor),
    renderHeight: Math.round(height * scaleFactor),
    originalWidth: width,
    originalHeight: height,
    scaleFactor,
    wasScaled: true,
  };
}

/**
 * Apply scaled dimensions to a canvas element.
 * Sets canvas internal resolution and CSS display size.
 */
export function applyScaledDimensions(
  canvas: HTMLCanvasElement,
  dimensions: ScaledDimensions
): void {
  // Set canvas internal resolution (what we actually render)
  canvas.width = dimensions.renderWidth;
  canvas.height = dimensions.renderHeight;

  // Set CSS display size (visual size in the UI)
  // This allows the canvas to display at a larger size while rendering at lower resolution
  if (dimensions.wasScaled) {
    canvas.style.width = `${dimensions.originalWidth}px`;
    canvas.style.height = `${dimensions.originalHeight}px`;
  }
}

/**
 * Scale coordinates from original space to render space.
 * Used when the sketch uses original coordinates but canvas is scaled.
 */
export function scaleCoordinate(
  value: number,
  scaleFactor: number
): number {
  return value * scaleFactor;
}

/**
 * Create a scaling transform for the canvas context.
 * This allows sketches to use original coordinates while rendering at scaled resolution.
 */
export function applyScaleTransform(
  ctx: CanvasRenderingContext2D,
  scaleFactor: number
): void {
  if (scaleFactor !== 1) {
    ctx.scale(scaleFactor, scaleFactor);
  }
}

/**
 * Reapply context scale after canvas resize.
 * 
 * NOTE:
 * Canvas resizing resets the 2D context transform.
 * The UI renderer downsamples the canvas for performance,
 * so we must reapply the internal scale factor once after resize.
 * This runtime is preview-only and intentionally non-deterministic.
 * 
 * @param canvas - The canvas element
 * @param dimensions - The scaled dimensions object
 */
export function reapplyContextScale(
  canvas: HTMLCanvasElement,
  dimensions: ScaledDimensions
): void {
  if (!dimensions.wasScaled) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Canvas resize resets transform — must restore it
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Reapply internal renderer scale (NOT clientWidth-based)
  // This is calculated from render dimensions, not DOM size
  const scaleFactor = dimensions.renderWidth / dimensions.originalWidth;
  ctx.scale(scaleFactor, scaleFactor);
}

/**
 * Clear the canvas ignoring any active transforms.
 * Ensures full canvas is cleared even when scaled.
 * 
 * @param ctx - The 2D rendering context
 * @param canvas - The canvas element (for dimensions)
 */
export function clearCanvasIgnoringTransform(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
