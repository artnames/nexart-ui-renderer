/**
 * @nexart/ui-renderer
 * Version: 0.2.0
 *
 * Declarative System Authoring SDK for NexArt Protocol
 *
 * ⚠️ IMPORTANT DISCLAIMER
 *
 * This SDK is for authoring and preview only.
 * Canonical, archival output is produced exclusively by @nexart/codemode-sdk.
 *
 * This renderer is:
 * - NOT canonical
 * - NOT archival
 * - NOT protocol-authoritative
 *
 * Use it for:
 * - Creating NexArt systems declaratively
 * - Previewing systems in the browser
 * - Compiling systems to protocol-compatible JSON
 * - Building platforms, tools, and integrations
 */

export { createSystem, validateSystem } from './system';
export { compileSystem, serializeSystem } from './compiler';
export { previewSystem } from './preview/renderer';
export {
  getCapabilities,
  getPrimitiveTypes,
  getMotionSources,
  getBackgroundTextures,
} from './capabilities';

export type {
  NexArtSystemInput,
  NexArtSystem,
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

export type {
  Capabilities,
  PrimitiveCapability,
  ParameterSpec,
} from './capabilities';

export const SDK_VERSION = '0.2.1';
export const PROTOCOL_VERSION = '0.2';
export const IS_CANONICAL = false;
export const IS_ARCHIVAL = false;
export const RENDERER = '@nexart/ui-renderer';
