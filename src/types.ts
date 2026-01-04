/**
 * @nexart/ui-renderer v0.8.6 - Type Definitions
 *
 * Lightweight Preview Runtime for NexArt Protocol.
 * This SDK is non-canonical and for preview only.
 * 
 * Performance-optimized with budget limits:
 * - Max frames: 30
 * - Max total time: 500ms
 * - Max canvas dimension: 900px
 */

export const SDK_VERSION = '0.8.6';

export const AESTHETIC_DEFAULTS = {
  background: { r: 246, g: 245, b: 242 },
  foreground: { r: 45, g: 45, b: 45 },
  strokeWeight: { min: 0.5, max: 4, default: 1.5 },
  density: { min: 3, max: 50, default: 12 },
  motion: { speed: 0.5, easing: 'sinusoidal' },
  margins: { ratio: 0.08 },
  loop: { defaultFrames: 120 },
} as const;

export type MotionSpeed = 'slow' | 'medium' | 'fast';
export type StrokeWeightAuto = 'auto' | 'thin' | 'medium' | 'thick' | number;

export interface LoopConfig {
  duration: number;
  fps?: number;
}

export type BackgroundPreset =
  | 'layered-waves'
  | 'soft-noise-field'
  | 'orbital-lines'
  | 'flowing-stripes'
  | 'minimal-grid';

export type ColorPalette =
  | 'offwhite-dark'
  | 'midnight'
  | 'warm-neutral'
  | 'ocean'
  | 'sunset'
  | 'forest';

export interface BackgroundElement {
  type: 'background';
  preset: BackgroundPreset;
  palette?: ColorPalette;
  loop?: LoopConfig;
  seed?: number;
}

export type PrimitiveName =
  | 'waves'
  | 'dots'
  | 'lines'
  | 'grid'
  | 'flow'
  | 'orbits'
  | 'circles'
  | 'stripes'
  | 'spirals'
  | 'rays'
  | 'stars'
  | 'polygons'
  | 'hexgrid'
  | 'arcs'
  | 'crosshatch'
  | 'chevrons'
  | 'zigzag'
  | 'rings'
  | 'diamonds'
  | 'bubbles'
  | 'mesh'
  | 'curves'
  | 'noise'
  | 'particles'
  | 'petals'
  | 'branches'
  | 'weave'
  | 'moire'
  | 'radialLines'
  | 'concentricSquares';

export interface PrimitiveElement {
  type: 'primitive';
  name: PrimitiveName;
  count?: number;
  strokeWeight?: StrokeWeightAuto;
  motion?: MotionSpeed;
  color?: string;
  opacity?: number;
  loop?: LoopConfig;
  seed?: number;
}

export interface SketchElement {
  type: 'sketch';
  code: string;
  totalFrames?: number;
  seed?: number;
  normalize?: boolean;
}

export type UnifiedElement = BackgroundElement | PrimitiveElement | SketchElement;

export interface UnifiedSystemInput {
  version?: string;
  seed?: number;
  width?: number;
  height?: number;
  elements: UnifiedElement[];
  loop?: LoopConfig;
}

export interface UnifiedSystem {
  protocol: 'nexart';
  systemType: 'unified';
  systemVersion: string;
  seed: number;
  width: number;
  height: number;
  elements: UnifiedElement[];
  loop: LoopConfig;
  deterministic: true;
  createdAt: string;
}

export type BackgroundTexture = 'none' | 'noise' | 'grain';

export interface CodeSystem {
  type: 'code';
  source: string;
  mode: 'static' | 'loop';
  width: number;
  height: number;
  seed?: number;
  totalFrames?: number;
  vars?: number[];
}

export interface BackgroundConfig {
  color: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;
  };
  texture?: BackgroundTexture;
}

export interface DotsElement {
  type: 'dots';
  distribution: 'random' | 'radial' | 'grid' | 'spiral';
  count: number;
  size: [number, number];
  color?: string;
  opacity?: number;
}

export interface LinesElement {
  type: 'lines';
  direction: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
  count: number;
  thickness: [number, number];
  color?: string;
  opacity?: number;
}

export interface WavesElement {
  type: 'waves';
  axis: 'x' | 'y';
  amplitude: number;
  frequency: number;
  count?: number;
  color?: string;
  opacity?: number;
}

export interface GridElement {
  type: 'grid';
  rows: number;
  cols: number;
  cellSize?: number;
  shape: 'square' | 'circle' | 'diamond';
  color?: string;
  opacity?: number;
}

export interface FlowFieldElement {
  type: 'flowField';
  resolution: number;
  strength: number;
  particles: number;
  color?: string;
  opacity?: number;
}

export interface OrbitsElement {
  type: 'orbits';
  count: number;
  radius: [number, number];
  dotCount: number;
  speed?: number;
  color?: string;
  opacity?: number;
}

export type DeclarativeElement =
  | DotsElement
  | LinesElement
  | WavesElement
  | GridElement
  | FlowFieldElement
  | OrbitsElement;

export type SystemElement = DeclarativeElement;

export type MotionSource = 'none' | 'time' | 'seed';

export interface MotionConfig {
  source: MotionSource;
  speed?: number;
}

export interface DeclarativeSystemInput {
  version?: string;
  seed: number;
  background: BackgroundConfig;
  elements: SystemElement[];
  motion?: MotionConfig;
}

export interface DeclarativeSystem {
  protocol: 'nexart';
  systemType: 'declarative';
  systemVersion: string;
  seed: number;
  background: BackgroundConfig;
  elements: SystemElement[];
  motion: MotionConfig;
  deterministic: boolean;
  createdAt: string;
}

export interface NexArtCodeSystem {
  protocol: 'nexart';
  systemType: 'code';
  systemVersion: string;
  source: string;
  mode: 'static' | 'loop';
  width: number;
  height: number;
  seed: number;
  totalFrames?: number;
  vars?: number[];
  deterministic: boolean;
  createdAt: string;
}

export type NexArtSystemInput = DeclarativeSystemInput | CodeSystem | UnifiedSystemInput;
export type NexArtSystem = DeclarativeSystem | NexArtCodeSystem | UnifiedSystem;

export interface PreviewOptions {
  mode?: 'static' | 'loop';
  showBadge?: boolean;
  onPreview?: (canvas: HTMLCanvasElement) => void;
  onComplete?: (result: { type: 'image' | 'video'; blob: Blob }) => void;
  onError?: (error: Error) => void;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
