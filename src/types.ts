/**
 * @nexart/ui-renderer v0.2.0 - Type Definitions
 *
 * Declarative system authoring types for NexArt Protocol.
 * This SDK is non-canonical and for authoring/preview only.
 */

export type BackgroundTexture = 'none' | 'noise' | 'grain';

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

export type SystemElement =
  | DotsElement
  | LinesElement
  | WavesElement
  | GridElement
  | FlowFieldElement
  | OrbitsElement;

export type MotionSource = 'none' | 'time' | 'seed';

export interface MotionConfig {
  source: MotionSource;
  speed?: number;
}

export interface NexArtSystemInput {
  version?: string;
  seed: number;
  background: BackgroundConfig;
  elements: SystemElement[];
  motion?: MotionConfig;
}

export interface NexArtSystem {
  protocol: 'nexart';
  systemVersion: string;
  seed: number;
  background: BackgroundConfig;
  elements: SystemElement[];
  motion: MotionConfig;
  deterministic: boolean;
  createdAt: string;
}

export interface PreviewOptions {
  mode?: 'static' | 'loop';
  showBadge?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
