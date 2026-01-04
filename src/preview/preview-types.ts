/**
 * @nexart/ui-renderer - Preview Runtime Types
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PREVIEW RUNTIME — NON-AUTHORITATIVE                                     ║
 * ║                                                                          ║
 * ║  This renderer is a preview-only runtime.                                ║
 * ║  It does not guarantee determinism or protocol compliance.               ║
 * ║                                                                          ║
 * ║  For minting, export, or validation: use @nexart/codemode-sdk            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Runtime profile - this renderer is preview-only.
 * Canonical execution remains SDK-only.
 */
export type RuntimeProfile = 'preview';

/**
 * FPS cap for preview rendering.
 * Replaced time/frame budget with simple FPS throttling for continuous animation.
 */
export const PREVIEW_FPS = {
  /** Target FPS for loop animations (lower = better performance) */
  TARGET_FPS: 8,
  /** Minimum milliseconds between frames */
  FRAME_INTERVAL_MS: 125, // 1000 / 8 = 125ms per frame
} as const;

/**
 * Canvas resolution limits.
 * Preview renderer does not render at full mint resolution.
 */
export const CANVAS_LIMITS = {
  /** Maximum dimension for preview canvas */
  MAX_DIMENSION: 900,
  /** Minimum dimension */
  MIN_DIMENSION: 100,
} as const;

/**
 * Preview mode options
 */
export type PreviewMode = 'static' | 'loop';

/**
 * Preview engine configuration
 */
export interface PreviewEngineConfig {
  /** Canvas element to render to */
  canvas: HTMLCanvasElement;
  /** Source code to execute */
  source: string;
  /** Preview mode */
  mode: PreviewMode;
  /** Original width (will be scaled down) */
  width: number;
  /** Original height (will be scaled down) */
  height: number;
  /** Random seed for deterministic preview */
  seed?: number;
  /** VAR array (0-10 elements, 0-100 range) */
  vars?: number[];
  /** Total frames for loop mode (for t calculation) */
  totalFrames?: number;
}

/**
 * Preview render result
 */
export interface PreviewRenderResult {
  /** Whether rendering completed successfully */
  success: boolean;
  /** Frames rendered */
  framesRendered: number;
  /** Total execution time in ms */
  executionTimeMs: number;
  /** Whether execution was terminated early due to limits */
  terminatedEarly: boolean;
  /** Termination reason if applicable */
  terminationReason?: 'frame_limit' | 'time_limit' | 'user_stop' | 'error';
  /** Error message if any (non-throwing) */
  errorMessage?: string;
}

/**
 * Preview renderer interface
 */
export interface PreviewRenderer {
  /** Render a single frame (static mode) */
  renderStatic: () => PreviewRenderResult;
  /** Start loop rendering */
  startLoop: () => void;
  /** Stop loop rendering */
  stopLoop: () => void;
  /** Destroy renderer and clean up */
  destroy: () => void;
  /** Check if currently rendering */
  isRendering: () => boolean;
  /** This renderer is NOT canonical */
  readonly isCanonical: false;
  /** This renderer is NOT archival */
  readonly isArchival: false;
}

/**
 * FPS throttle state for continuous animation
 */
export interface FpsThrottleState {
  /** Timestamp of last rendered frame */
  lastFrameTimeMs: number;
}
