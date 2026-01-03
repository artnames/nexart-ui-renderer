/**
 * @nexart/ui-renderer - Frame Budget Manager
 * 
 * Enforces hard execution limits to prevent browser freezes.
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  EXECUTION BUDGET — MANDATORY LIMITS                                     ║
 * ║                                                                          ║
 * ║  Max frames: 30                                                          ║
 * ║  Max total time: 500ms                                                   ║
 * ║  Target frame time: ~16ms                                                ║
 * ║                                                                          ║
 * ║  If limits exceeded: stop immediately, do NOT throw.                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { PREVIEW_BUDGET, type FrameBudgetState } from './preview-types';

/**
 * Create a new frame budget tracker
 */
export function createFrameBudget(): FrameBudgetState {
  return {
    framesRendered: 0,
    startTimeMs: performance.now(),
    exhausted: false,
    exhaustionReason: undefined,
  };
}

/**
 * Check if budget allows another frame.
 * Returns true if we can render, false if budget is exhausted.
 */
export function canRenderFrame(budget: FrameBudgetState): boolean {
  if (budget.exhausted) {
    return false;
  }

  // Check frame limit
  if (budget.framesRendered >= PREVIEW_BUDGET.MAX_FRAMES) {
    budget.exhausted = true;
    budget.exhaustionReason = 'frame_limit';
    return false;
  }

  // Check time limit
  const elapsedMs = performance.now() - budget.startTimeMs;
  if (elapsedMs >= PREVIEW_BUDGET.MAX_TOTAL_TIME_MS) {
    budget.exhausted = true;
    budget.exhaustionReason = 'time_limit';
    return false;
  }

  return true;
}

/**
 * Record that a frame was rendered
 */
export function recordFrame(budget: FrameBudgetState): void {
  budget.framesRendered++;
}

/**
 * Get elapsed time in milliseconds
 */
export function getElapsedMs(budget: FrameBudgetState): number {
  return performance.now() - budget.startTimeMs;
}

/**
 * Reset the frame budget for a new render cycle
 */
export function resetBudget(budget: FrameBudgetState): void {
  budget.framesRendered = 0;
  budget.startTimeMs = performance.now();
  budget.exhausted = false;
  budget.exhaustionReason = undefined;
}

/**
 * Check if we should skip this frame for performance.
 * Uses frame stride to reduce rendering load while keeping animation smooth.
 */
export function shouldSkipFrame(frameCount: number): boolean {
  return frameCount % PREVIEW_BUDGET.FRAME_STRIDE !== 0;
}
