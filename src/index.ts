/**
 * @nexart/ui-renderer
 * Version: 0.8.2
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
 * ║  - Max frames: 30                                                        ║
 * ║  - Max total time: 500ms                                                 ║
 * ║  - Max canvas dimension: 900px                                           ║
 * ║  - Frame stride: render every 3rd frame                                  ║
 * ║                                                                          ║
 * ║  Use Cases:                                                              ║
 * ║  - Editor live preview                                                   ║
 * ║  - Builder dashboards                                                    ║
 * ║  - Background generative art                                             ║
 * ║  - Static or loop previews                                               ║
 * ║                                                                          ║
 * ║  NOT For:                                                                ║
 * ║  - Minting / export                                                      ║
 * ║  - ByX                                                                   ║
 * ║  - Protocol validation                                                   ║
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
} from './preview/preview-engine';

export {
  PREVIEW_BUDGET,
  CANVAS_LIMITS,
  type RuntimeProfile,
  type PreviewMode,
  type PreviewEngineConfig,
  type PreviewRenderResult,
  type PreviewRenderer,
  type FrameBudgetState,
} from './preview/preview-types';

export {
  createFrameBudget,
  canRenderFrame,
  recordFrame,
  resetBudget,
  shouldSkipFrame,
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

export const SDK_VERSION = '0.8.2';
export const PROTOCOL_VERSION = '0.8';
export const IS_CANONICAL = false;
export const IS_ARCHIVAL = false;
export const RENDERER = '@nexart/ui-renderer';
export const PRIMITIVES_ARE_CANONICAL = false;
