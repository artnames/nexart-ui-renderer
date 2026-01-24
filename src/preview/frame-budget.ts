/**
 * @nexart/ui-renderer - FPS Throttle
 * 
 * Simple FPS cap for continuous preview animation.
 * No frame limits, no time limits — just throttled rendering.
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FPS THROTTLE — CONTINUOUS ANIMATION                                     ║
 * ║                                                                          ║
 * ║  Target FPS: 8 (125ms per frame)                                         ║
 * ║  No frame limit — runs until stop() is called                            ║
 * ║  No time limit — runs indefinitely                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { PREVIEW_FPS, type FpsThrottleState } from './preview-types';

/**
 * Create a new FPS throttle state
 */
export function createFpsThrottle(): FpsThrottleState {
  return {
    lastFrameTimeMs: 0,
  };
}

/**
 * Check if enough time has passed to render the next frame.
 * Returns true if we should render, false if we should skip this RAF tick.
 */
export function shouldRenderFrame(throttle: FpsThrottleState): boolean {
  const now = performance.now();
  const elapsed = now - throttle.lastFrameTimeMs;
  return elapsed >= PREVIEW_FPS.FRAME_INTERVAL_MS;
}

/**
 * Record that a frame was rendered (updates last frame time)
 */
export function recordFrame(throttle: FpsThrottleState): void {
  throttle.lastFrameTimeMs = performance.now();
}

/**
 * Reset the throttle for a new render session
 */
export function resetThrottle(throttle: FpsThrottleState): void {
  throttle.lastFrameTimeMs = 0;
}

// ============================================================================
// DEPRECATED EXPORTS — kept for backward compatibility
// These will be removed in v0.9.0
// ============================================================================

/**
 * @deprecated Legacy type alias for backward compatibility.
 * Use FpsThrottleState instead.
 */
export type FrameBudgetState = FpsThrottleState;

/** @deprecated Use createFpsThrottle instead */
export function createFrameBudget(): FpsThrottleState {
  return createFpsThrottle();
}

/** 
 * @deprecated Use shouldRenderFrame instead.
 * 
 * COMPATIBILITY NOTE: This now delegates to shouldRenderFrame.
 * For legacy code that interprets `false` as "budget exhausted forever",
 * this will work correctly because:
 * - Returns true when enough time has passed (ready to render)
 * - Returns false when throttled (wait for next tick)
 * - Never permanently exhausts like the old budget system
 */
export function canRenderFrame(throttle: FpsThrottleState): boolean {
  return shouldRenderFrame(throttle);
}

/** @deprecated Use resetThrottle instead */
export function resetBudget(throttle: FpsThrottleState): void {
  resetThrottle(throttle);
}

/** @deprecated No longer used — removed frame stride. Always returns false. */
export function shouldSkipFrame(_frameCount: number): boolean {
  return false; // Never skip based on frame count
}

/** @deprecated No longer tracked. Returns 0. */
export function getElapsedMs(_throttle: FpsThrottleState): number {
  return 0;
}
