/**
 * @nexart/ui-renderer
 * Version: 0.9.0
 *
 * Lightweight Preview Runtime for NexArt Protocol
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PREVIEW RUNTIME — NON-AUTHORITATIVE                                     ║
 * ║                                                                          ║
 * ║  This renderer is a preview-only runtime.                                ║
 * ║  It does not guarantee determinism or protocol compliance.               ║
 * ║                                                                          ║
 * ║  Performance Limits:                                                     ║
 * ║  - FPS: Native RAF (~60 FPS)                                             ║
 * ║  - Max canvas dimension: 900px                                           ║
 * ║  - Budget: 1800 frames / 5 minutes (configurable)                        ║
 * ║                                                                          ║
 * ║  v0.9.0 Features:                                                        ║
 * ║  - Budget exceed callbacks + overlay                                     ║
 * ║  - getPreviewStats() for observability                                   ║
 * ║  - createPreviewRuntime() as recommended entrypoint                      ║
 * ║  - toCanonicalRequest() for handoff to @nexart/codemode-sdk              ║
 * ║                                                                          ║
 * ║  For canonical output: use @nexart/codemode-sdk                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export { createSystem, validateSystem, isCodeModeSystem, isDeclarativeSystem, isUnifiedModeSystem } from './system';
export { compileSystem, serializeSystem } from './compiler';
export { previewSystem } from './preview/renderer';
export { renderCodeModeSystem } from './preview/code-renderer';
export { renderUnifiedSystem } from './preview/unified-renderer';
export { compileBackgroundPreset, getPaletteColors } from './presets/backgrounds';
export { compilePrimitive } from './presets/primitives';
export { wrapSketch, validateSketchSafety } from './presets/sketch-wrapper';
export {
  getCapabilities,
  getPrimitiveTypes,
  getPrimitivesByCategory,
  getPrimitiveInfo,
  isPrimitiveValid,
  getMotionSources,
  getBackgroundTextures,
} from './capabilities';

export {
  createPreviewEngine,
  renderStaticPreview,
  stopActivePreview,
  toCanonicalRequest,
} from './preview/preview-engine';

export {
  PREVIEW_FPS,
  PREVIEW_BUDGET,
  CANVAS_LIMITS,
  type RuntimeProfile,
  type PreviewMode,
  type PreviewEngineConfig,
  type PreviewRenderResult,
  type PreviewRenderer,
  type PreviewStats,
  type BudgetExceededInfo,
  type BudgetExceedReason,
  type BudgetBehavior,
  type CanonicalRequest,
  type FpsThrottleState,
} from './preview/preview-types';

export { type FrameBudgetState } from './preview/frame-budget';

export {
  createFpsThrottle,
  shouldRenderFrame,
  recordFrame,
  resetThrottle,
  createFrameBudget,
  canRenderFrame,
  resetBudget,
  shouldSkipFrame,
  getElapsedMs,
} from './preview/frame-budget';

export {
  calculateScaledDimensions,
  applyScaledDimensions,
  type ScaledDimensions,
} from './preview/canvas-scaler';

export type {
  NexArtSystemInput,
  NexArtSystem,
  DeclarativeSystemInput,
  DeclarativeSystem,
  CodeSystem,
  NexArtCodeSystem,
  UnifiedSystemInput,
  UnifiedSystem,
  UnifiedElement,
  BackgroundElement,
  PrimitiveElement,
  SketchElement,
  BackgroundPreset,
  PrimitiveName,
  ColorPalette,
  MotionSpeed,
  StrokeWeightAuto,
  LoopConfig,
  DeclarativeElement,
  SystemElement,
  DotsElement,
  LinesElement,
  WavesElement,
  GridElement,
  FlowFieldElement,
  OrbitsElement,
  BackgroundConfig,
  MotionConfig,
  PreviewOptions,
  ValidationResult,
} from './types';

export { AESTHETIC_DEFAULTS, SDK_VERSION as TYPE_SDK_VERSION } from './types';

export type {
  Capabilities,
  PrimitiveCapability,
  ParameterSpec,
} from './capabilities';

// ============================================================================
// v0.9.0 RECOMMENDED ENTRYPOINT
// ============================================================================

/**
 * createPreviewRuntime - Recommended entrypoint for AI coding agents.
 * 
 * This is an alias for createPreviewEngine with sensible defaults.
 * Use this as the primary way to create previews.
 * 
 * @example
 * ```typescript
 * import { createPreviewRuntime } from '@nexart/ui-renderer';
 * 
 * const runtime = createPreviewRuntime({
 *   canvas: document.getElementById('canvas'),
 *   source: 'function draw() { circle(width/2, height/2, 100); }',
 *   mode: 'loop',
 *   width: 1950,
 *   height: 2400,
 *   onBudgetExceeded: (info) => console.log('Budget exceeded:', info),
 * });
 * 
 * runtime.startLoop();
 * console.log(runtime.getPreviewStats());
 * ```
 */
export { createPreviewEngine as createPreviewRuntime } from './preview/preview-engine';

export const SDK_VERSION = '0.9.1';
export const PROTOCOL_VERSION = '0.9';
export const IS_CANONICAL = false;
export const IS_ARCHIVAL = false;
export const RENDERER = '@nexart/ui-renderer';
export const PRIMITIVES_ARE_CANONICAL = false;
