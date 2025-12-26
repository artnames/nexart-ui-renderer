/**
 * @nexart/ui-renderer v0.2.0 - System Creation & Validation
 *
 * Declarative system authoring for NexArt Protocol.
 */

import type {
  NexArtSystemInput,
  NexArtSystem,
  SystemElement,
  ValidationResult,
  BackgroundConfig,
  MotionConfig,
} from './types';

const CURRENT_VERSION = '0.2';

const VALID_ELEMENT_TYPES = ['dots', 'lines', 'waves', 'grid', 'flowField', 'orbits'] as const;
const VALID_MOTION_SOURCES = ['none', 'time', 'seed'] as const;
const VALID_TEXTURES = ['none', 'noise', 'grain'] as const;

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

export function validateSystem(input: NexArtSystemInput): ValidationResult {
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

  const system: NexArtSystem = {
    protocol: 'nexart',
    systemVersion: input.version || CURRENT_VERSION,
    seed: input.seed,
    background: {
      color: input.background.color,
      texture: input.background.texture || 'none',
      ...(input.background.gradient && { gradient: input.background.gradient }),
    },
    elements: input.elements.map((el) => ({
      ...el,
      opacity: el.opacity ?? 1,
    })),
    motion: input.motion || { source: 'none' },
    deterministic: true,
    createdAt: new Date().toISOString(),
  };

  return system;
}
