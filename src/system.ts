/**
 * @nexart/ui-renderer v0.8.0 - System Creation & Validation
 *
 * Opinionated generative design system with aesthetic guardrails.
 * Supports background, primitive, and sketch element types.
 * Lightweight preview runtime — soft validation, no protocol errors.
 */

import type {
  NexArtSystemInput,
  NexArtSystem,
  DeclarativeSystemInput,
  DeclarativeSystem,
  CodeSystem,
  NexArtCodeSystem,
  UnifiedSystemInput,
  UnifiedSystem,
  UnifiedElement,
  SystemElement,
  ValidationResult,
  BackgroundConfig,
  MotionConfig,
  AESTHETIC_DEFAULTS,
  SDK_VERSION,
} from './types';

const CURRENT_VERSION = '0.8';

function isCodeSystem(input: NexArtSystemInput): input is CodeSystem {
  return 'type' in input && (input as any).type === 'code';
}

function isUnifiedSystem(input: NexArtSystemInput): input is UnifiedSystemInput {
  if (!('elements' in input) || !Array.isArray((input as any).elements)) {
    return false;
  }
  const elements = (input as any).elements as any[];
  return elements.length > 0 && elements.some(
    (el: any) => el.type === 'background' || el.type === 'primitive' || el.type === 'sketch'
  );
}

function isDeclarativeInput(input: NexArtSystemInput): input is DeclarativeSystemInput {
  return 'elements' in input && 'background' in input && Array.isArray((input as any).elements);
}

const VALID_ELEMENT_TYPES = ['dots', 'lines', 'waves', 'grid', 'flowField', 'orbits'] as const;
const VALID_MOTION_SOURCES = ['none', 'time', 'seed'] as const;
const VALID_TEXTURES = ['none', 'noise', 'grain'] as const;
const VALID_BACKGROUND_PRESETS = ['layered-waves', 'soft-noise-field', 'orbital-lines', 'flowing-stripes', 'minimal-grid'] as const;
const VALID_PRIMITIVE_NAMES = [
  'dots', 'lines', 'waves', 'stripes', 'circles', 'grid',
  'polygons', 'diamonds', 'hexgrid', 'stars', 'concentricSquares',
  'spirals', 'rays', 'orbits', 'rings', 'arcs', 'radialLines', 'petals',
  'flow', 'particles', 'bubbles',
  'crosshatch', 'chevrons', 'zigzag', 'weave', 'moire',
  'curves', 'noise', 'mesh', 'branches',
] as const;
const VALID_PALETTES = ['offwhite-dark', 'midnight', 'warm-neutral', 'ocean', 'sunset', 'forest'] as const;

function validateUnifiedElement(el: UnifiedElement, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Element[${index}]`;

  if (!el.type) {
    errors.push(`${prefix}: type is required`);
    return errors;
  }

  switch (el.type) {
    case 'background':
      if (!el.preset || !VALID_BACKGROUND_PRESETS.includes(el.preset)) {
        errors.push(`${prefix}: preset must be one of: ${VALID_BACKGROUND_PRESETS.join(', ')}`);
      }
      if (el.palette && !VALID_PALETTES.includes(el.palette)) {
        errors.push(`${prefix}: palette must be one of: ${VALID_PALETTES.join(', ')}`);
      }
      if (el.loop) {
        if (typeof el.loop.duration !== 'number' || el.loop.duration < 1 || el.loop.duration > 600) {
          errors.push(`${prefix}: loop.duration must be between 1 and 600`);
        }
      }
      break;

    case 'primitive':
      if (!el.name || !VALID_PRIMITIVE_NAMES.includes(el.name)) {
        errors.push(`${prefix}: name must be one of: ${VALID_PRIMITIVE_NAMES.join(', ')}`);
      }
      if (el.count !== undefined && (el.count < 1 || el.count > 100)) {
        errors.push(`${prefix}: count must be between 1 and 100`);
      }
      if (el.opacity !== undefined && (el.opacity < 0 || el.opacity > 1)) {
        errors.push(`${prefix}: opacity must be between 0 and 1`);
      }
      break;

    case 'sketch':
      if (!el.code || typeof el.code !== 'string' || el.code.trim().length === 0) {
        errors.push(`${prefix}: code is required and must be a non-empty string`);
      }
      if (el.totalFrames !== undefined && (el.totalFrames < 1 || el.totalFrames > 600)) {
        errors.push(`${prefix}: totalFrames must be between 1 and 600`);
      }
      break;

    default:
      errors.push(`${prefix}: type must be "background", "primitive", or "sketch"`);
  }

  return errors;
}

function validateUnifiedSystem(input: UnifiedSystemInput): string[] {
  const errors: string[] = [];

  if (!Array.isArray(input.elements) || input.elements.length === 0) {
    errors.push('elements array is required and must not be empty');
    return errors;
  }

  input.elements.forEach((el, i) => {
    errors.push(...validateUnifiedElement(el, i));
  });

  if (input.width !== undefined && (input.width < 1 || input.width > 4096)) {
    errors.push('width must be between 1 and 4096');
  }

  if (input.height !== undefined && (input.height < 1 || input.height > 4096)) {
    errors.push('height must be between 1 and 4096');
  }

  if (!input.loop || typeof input.loop.duration !== 'number') {
    errors.push('loop.duration is required for unified systems');
  } else if (input.loop.duration < 1 || input.loop.duration > 600) {
    errors.push('loop.duration must be between 1 and 600');
  }

  return errors;
}

function validateBackground(bg: BackgroundConfig): string[] {
  const errors: string[] = [];

  if (!bg.color || typeof bg.color !== 'string') {
    errors.push('Background color is required and must be a string');
  }

  if (bg.texture && !VALID_TEXTURES.includes(bg.texture)) {
    errors.push(`Invalid texture: ${bg.texture}. Must be one of: ${VALID_TEXTURES.join(', ')}`);
  }

  if (bg.gradient) {
    if (!['linear', 'radial'].includes(bg.gradient.type)) {
      errors.push('Gradient type must be "linear" or "radial"');
    }
    if (!Array.isArray(bg.gradient.colors) || bg.gradient.colors.length < 2) {
      errors.push('Gradient requires at least 2 colors');
    }
  }

  return errors;
}

function validateElement(el: SystemElement, index: number): string[] {
  const errors: string[] = [];
  const prefix = `Element[${index}]`;

  if (!el.type || !VALID_ELEMENT_TYPES.includes(el.type as any)) {
    errors.push(`${prefix}: Invalid type. Must be one of: ${VALID_ELEMENT_TYPES.join(', ')}`);
    return errors;
  }

  switch (el.type) {
    case 'dots':
      if (!['random', 'radial', 'grid', 'spiral'].includes(el.distribution)) {
        errors.push(`${prefix}: Invalid distribution for dots`);
      }
      if (typeof el.count !== 'number' || el.count < 1 || el.count > 10000) {
        errors.push(`${prefix}: count must be between 1 and 10000`);
      }
      if (!Array.isArray(el.size) || el.size.length !== 2) {
        errors.push(`${prefix}: size must be [min, max] array`);
      }
      break;

    case 'lines':
      if (!['horizontal', 'vertical', 'diagonal', 'radial'].includes(el.direction)) {
        errors.push(`${prefix}: Invalid direction for lines`);
      }
      if (typeof el.count !== 'number' || el.count < 1 || el.count > 500) {
        errors.push(`${prefix}: count must be between 1 and 500`);
      }
      break;

    case 'waves':
      if (!['x', 'y'].includes(el.axis)) {
        errors.push(`${prefix}: axis must be "x" or "y"`);
      }
      if (typeof el.amplitude !== 'number' || el.amplitude < 0 || el.amplitude > 1) {
        errors.push(`${prefix}: amplitude must be between 0 and 1`);
      }
      if (typeof el.frequency !== 'number' || el.frequency < 0.1 || el.frequency > 10) {
        errors.push(`${prefix}: frequency must be between 0.1 and 10`);
      }
      break;

    case 'grid':
      if (typeof el.rows !== 'number' || el.rows < 1 || el.rows > 100) {
        errors.push(`${prefix}: rows must be between 1 and 100`);
      }
      if (typeof el.cols !== 'number' || el.cols < 1 || el.cols > 100) {
        errors.push(`${prefix}: cols must be between 1 and 100`);
      }
      if (!['square', 'circle', 'diamond'].includes(el.shape)) {
        errors.push(`${prefix}: shape must be "square", "circle", or "diamond"`);
      }
      break;

    case 'flowField':
      if (typeof el.resolution !== 'number' || el.resolution < 5 || el.resolution > 100) {
        errors.push(`${prefix}: resolution must be between 5 and 100`);
      }
      if (typeof el.strength !== 'number' || el.strength < 0 || el.strength > 1) {
        errors.push(`${prefix}: strength must be between 0 and 1`);
      }
      if (typeof el.particles !== 'number' || el.particles < 10 || el.particles > 5000) {
        errors.push(`${prefix}: particles must be between 10 and 5000`);
      }
      break;

    case 'orbits':
      if (typeof el.count !== 'number' || el.count < 1 || el.count > 20) {
        errors.push(`${prefix}: count must be between 1 and 20`);
      }
      if (!Array.isArray(el.radius) || el.radius.length !== 2) {
        errors.push(`${prefix}: radius must be [min, max] array`);
      }
      if (typeof el.dotCount !== 'number' || el.dotCount < 1 || el.dotCount > 200) {
        errors.push(`${prefix}: dotCount must be between 1 and 200`);
      }
      break;
  }

  if (el.opacity !== undefined && (el.opacity < 0 || el.opacity > 1)) {
    errors.push(`${prefix}: opacity must be between 0 and 1`);
  }

  return errors;
}

function validateMotion(motion: MotionConfig): string[] {
  const errors: string[] = [];

  if (!VALID_MOTION_SOURCES.includes(motion.source)) {
    errors.push(`Invalid motion source. Must be one of: ${VALID_MOTION_SOURCES.join(', ')}`);
  }

  if (motion.speed !== undefined && (motion.speed < 0 || motion.speed > 5)) {
    errors.push('Motion speed must be between 0 and 5');
  }

  return errors;
}

function validateCodeSystem(input: CodeSystem): string[] {
  const errors: string[] = [];

  if ((input as any).type !== 'code') {
    errors.push('type must be "code"');
  }

  if (!input.source || typeof input.source !== 'string') {
    errors.push('source is required and must be a string');
  }

  if (input.source && input.source.trim().length === 0) {
    errors.push('source cannot be empty');
  }

  if (!['static', 'loop'].includes(input.mode)) {
    errors.push('mode must be "static" or "loop"');
  }

  if (typeof input.width !== 'number' || input.width < 1 || input.width > 4096) {
    errors.push('width is required and must be between 1 and 4096');
  }

  if (typeof input.height !== 'number' || input.height < 1 || input.height > 4096) {
    errors.push('height is required and must be between 1 and 4096');
  }

  if (input.mode === 'loop') {
    if (typeof input.totalFrames !== 'number' || input.totalFrames < 1 || input.totalFrames > 600) {
      errors.push('totalFrames is required for loop mode and must be between 1 and 600');
    }
    if (input.seed === undefined) {
      errors.push('seed is required for loop mode to ensure determinism');
    }
  }

  if (input.seed !== undefined && typeof input.seed !== 'number') {
    errors.push('seed must be a number');
  }

  // VAR validation (soft - clamping applied at runtime, not errors)
  // Preview renderer is permissive - clamps values instead of rejecting
  if (input.vars !== undefined) {
    if (!Array.isArray(input.vars)) {
      errors.push('vars must be an array');
    } else if (input.vars.length > 10) {
      console.warn(`[UIRenderer] VAR array has ${input.vars.length} elements, will use first 10`);
    } else {
      for (let i = 0; i < input.vars.length; i++) {
        const v = input.vars[i];
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          console.warn(`[UIRenderer] VAR[${i}] is not a valid number, will use 0`);
        } else if (v < 0 || v > 100) {
          console.warn(`[UIRenderer] VAR[${i}] = ${v} is out of 0-100 range, will be clamped`);
        }
      }
    }
  }

  return errors;
}

function validateDeclarativeSystem(input: DeclarativeSystemInput): string[] {
  const errors: string[] = [];

  if (typeof input.seed !== 'number') {
    errors.push('seed is required and must be a number');
  }

  if (!input.background) {
    errors.push('background is required');
  } else {
    errors.push(...validateBackground(input.background));
  }

  if (!Array.isArray(input.elements) || input.elements.length === 0) {
    errors.push('elements array is required and must not be empty');
  } else {
    input.elements.forEach((el, i) => {
      errors.push(...validateElement(el, i));
    });
  }

  if (input.motion) {
    errors.push(...validateMotion(input.motion));
  }

  return errors;
}

export function validateSystem(input: NexArtSystemInput): ValidationResult {
  const errors: string[] = [];

  if (isCodeSystem(input)) {
    errors.push(...validateCodeSystem(input));
  } else if (isUnifiedSystem(input)) {
    errors.push(...validateUnifiedSystem(input));
  } else if (isDeclarativeInput(input)) {
    errors.push(...validateDeclarativeSystem(input));
  } else {
    errors.push('Invalid system input: must be a code system, unified system, or declarative system');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function createSystem(input: NexArtSystemInput): NexArtSystem {
  const validation = validateSystem(input);

  if (!validation.valid) {
    throw new Error(`Invalid system: ${validation.errors.join('; ')}`);
  }

  if (isCodeSystem(input)) {
    const codeSystem: NexArtCodeSystem = {
      protocol: 'nexart',
      systemType: 'code',
      systemVersion: CURRENT_VERSION,
      source: input.source,
      mode: input.mode,
      width: input.width,
      height: input.height,
      seed: input.seed ?? Math.floor(Math.random() * 2147483647),
      totalFrames: input.totalFrames,
      vars: input.vars,
      deterministic: true,
      createdAt: new Date().toISOString(),
    };
    return codeSystem;
  }

  if (isUnifiedSystem(input)) {
    const unifiedSystem: UnifiedSystem = {
      protocol: 'nexart',
      systemType: 'unified',
      systemVersion: CURRENT_VERSION,
      seed: input.seed ?? Math.floor(Math.random() * 2147483647),
      width: input.width ?? 800,
      height: input.height ?? 800,
      elements: input.elements,
      loop: input.loop ?? { duration: 120 },
      deterministic: true,
      createdAt: new Date().toISOString(),
    };
    return unifiedSystem;
  }

  const declarativeInput = input as DeclarativeSystemInput;
  const system: DeclarativeSystem = {
    protocol: 'nexart',
    systemType: 'declarative',
    systemVersion: declarativeInput.version || CURRENT_VERSION,
    seed: declarativeInput.seed,
    background: {
      color: declarativeInput.background.color,
      texture: declarativeInput.background.texture || 'none',
      ...(declarativeInput.background.gradient && { gradient: declarativeInput.background.gradient }),
    },
    elements: declarativeInput.elements.map((el) => ({
      ...el,
      opacity: el.opacity ?? 1,
    })),
    motion: declarativeInput.motion || { source: 'none' },
    deterministic: true,
    createdAt: new Date().toISOString(),
  };

  return system;
}

export function isCodeModeSystem(system: NexArtSystem): system is NexArtCodeSystem {
  return 'systemType' in system && system.systemType === 'code';
}

export function isUnifiedModeSystem(system: NexArtSystem): system is UnifiedSystem {
  return 'systemType' in system && system.systemType === 'unified';
}

export function isDeclarativeSystem(system: NexArtSystem): system is DeclarativeSystem {
  return !('systemType' in system) || system.systemType === 'declarative';
}
