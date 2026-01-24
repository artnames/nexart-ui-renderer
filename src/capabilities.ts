/**
 * @nexart/ui-renderer v0.9.0 - Capabilities Discovery
 *
 * Exposes SDK capabilities for AI tools and builders.
 * Lightweight preview runtime — no protocol enforcement.
 *
 * ⚠️ PREVIEW ONLY
 * This SDK provides preview rendering with performance limits.
 * For canonical output: use @nexart/codemode-sdk
 */

export interface PrimitiveCapability {
  name: string;
  category: 'basic' | 'geometric' | 'radial' | 'flow' | 'patterns' | 'organic';
  description: string;
  compilesTo: 'codemode';
  isCanonical: false;
  parameters: {
    count: ParameterSpec;
    color: ParameterSpec;
    opacity: ParameterSpec;
    strokeWeight: ParameterSpec;
    motion: ParameterSpec;
  };
}

export interface ParameterSpec {
  type: 'number' | 'string' | 'enum' | 'tuple' | 'boolean';
  required: boolean;
  description: string;
  min?: number;
  max?: number;
  options?: string[];
  tupleLength?: number;
  default?: unknown;
}

export interface Capabilities {
  version: string;
  isCanonical: false;
  isArchival: false;
  renderer: '@nexart/ui-renderer';

  primitivesMeta: {
    notice: string;
    count: number;
    categories: string[];
    compilesTo: 'codemode';
    isCanonical: false;
  };

  primitives: PrimitiveCapability[];

  background: {
    color: ParameterSpec;
    texture: ParameterSpec;
    gradient: {
      type: ParameterSpec;
      colors: ParameterSpec;
      angle: ParameterSpec;
    };
  };

  motion: {
    sources: string[];
    speed: ParameterSpec;
  };

  limits: {
    maxElements: number;
    maxCount: number;
    maxPrimitives: number;
  };
}

const SHARED_PARAMS = {
  count: {
    type: 'number' as const,
    required: false,
    description: 'Element count (clamped to 3-50)',
    min: 3,
    max: 50,
    default: 12,
  },
  color: {
    type: 'string' as const,
    required: false,
    description: 'CSS color string (e.g., "#ffffff", "rgb(255,255,255)")',
    default: 'foreground color from palette',
  },
  opacity: {
    type: 'number' as const,
    required: false,
    description: 'Opacity from 0.1 to 1',
    min: 0.1,
    max: 1,
    default: 1,
  },
  strokeWeight: {
    type: 'enum' as const,
    required: false,
    description: 'Stroke thickness preset or number (0.5-4)',
    options: ['auto', 'thin', 'medium', 'thick'],
    default: 'auto',
  },
  motion: {
    type: 'enum' as const,
    required: false,
    description: 'Animation speed preset',
    options: ['slow', 'medium', 'fast'],
    default: 'slow',
  },
};

function createPrimitive(
  name: string,
  category: PrimitiveCapability['category'],
  description: string
): PrimitiveCapability {
  return {
    name,
    category,
    description,
    compilesTo: 'codemode',
    isCanonical: false,
    parameters: { ...SHARED_PARAMS },
  };
}

export function getCapabilities(): Capabilities {
  return {
    version: '0.9.0',
    isCanonical: false,
    isArchival: false,
    renderer: '@nexart/ui-renderer',

    primitivesMeta: {
      notice: 'Primitives are helper generators that compile to Code Mode sketches. They are NOT canonical.',
      count: 30,
      categories: ['basic', 'geometric', 'radial', 'flow', 'patterns', 'organic'],
      compilesTo: 'codemode',
      isCanonical: false,
    },

    primitives: [
      createPrimitive('dots', 'basic', 'Grid or random dot patterns with noise-based movement'),
      createPrimitive('lines', 'basic', 'Vertical wavy lines with sinusoidal motion'),
      createPrimitive('waves', 'basic', 'Horizontal wave patterns with phase animation'),
      createPrimitive('stripes', 'basic', 'Simple horizontal stripes with wave offset'),
      createPrimitive('circles', 'basic', 'Concentric pulsing circles from center'),
      createPrimitive('grid', 'basic', 'Rotating square grid with noise-based variation'),

      createPrimitive('polygons', 'geometric', 'Random rotating polygons (3-7 sides)'),
      createPrimitive('diamonds', 'geometric', 'Diamond grid with noise-driven rotation'),
      createPrimitive('hexgrid', 'geometric', 'Honeycomb hexagonal tessellation'),
      createPrimitive('stars', 'geometric', 'Scattered rotating star shapes (5-7 points)'),
      createPrimitive('concentricSquares', 'geometric', 'Nested rotating squares from center'),

      createPrimitive('spirals', 'radial', 'Multiple expanding spirals from center'),
      createPrimitive('rays', 'radial', 'Lines emanating from center with noise length'),
      createPrimitive('orbits', 'radial', 'Wobbling orbital rings around center'),
      createPrimitive('rings', 'radial', 'Alternating concentric rings with pulse'),
      createPrimitive('arcs', 'radial', 'Random partial circles at varying radii'),
      createPrimitive('radialLines', 'radial', 'Lines from inner to outer radius'),
      createPrimitive('petals', 'radial', 'Flower petal pattern radiating from center'),

      createPrimitive('flow', 'flow', 'Particle traces following noise-based flow field'),
      createPrimitive('particles', 'flow', 'Scattered particles with motion tails'),
      createPrimitive('bubbles', 'flow', 'Rising floating bubbles with wobble'),

      createPrimitive('crosshatch', 'patterns', 'Cross-hatched shading lines'),
      createPrimitive('chevrons', 'patterns', 'V-shaped wave patterns'),
      createPrimitive('zigzag', 'patterns', 'Zigzag horizontal lines'),
      createPrimitive('weave', 'patterns', 'Interlocking woven pattern'),
      createPrimitive('moire', 'patterns', 'Overlapping circle interference pattern'),

      createPrimitive('curves', 'organic', 'Random bezier curves with animated control points'),
      createPrimitive('noise', 'organic', 'Perlin noise vector field visualization'),
      createPrimitive('mesh', 'organic', 'Deformed triangular mesh with noise displacement'),
      createPrimitive('branches', 'organic', 'Fractal tree branches'),
    ],

    background: {
      color: {
        type: 'string',
        required: true,
        description: 'Background color (CSS color)',
      },
      texture: {
        type: 'enum',
        required: false,
        description: 'Background texture overlay',
        options: ['none', 'noise', 'grain'],
        default: 'none',
      },
      gradient: {
        type: {
          type: 'enum',
          required: true,
          description: 'Gradient type',
          options: ['linear', 'radial'],
        },
        colors: {
          type: 'string',
          required: true,
          description: 'Array of CSS colors (minimum 2)',
        },
        angle: {
          type: 'number',
          required: false,
          description: 'Gradient angle in degrees (linear only)',
          min: 0,
          max: 360,
        },
      },
    },

    motion: {
      sources: ['none', 'time', 'seed'],
      speed: {
        type: 'number',
        required: false,
        description: 'Animation speed multiplier',
        min: 0,
        max: 5,
        default: 1,
      },
    },

    limits: {
      maxElements: 20,
      maxCount: 50,
      maxPrimitives: 30,
    },
  };
}

export function getPrimitiveTypes(): string[] {
  return [
    'dots', 'lines', 'waves', 'stripes', 'circles', 'grid',
    'polygons', 'diamonds', 'hexgrid', 'stars', 'concentricSquares',
    'spirals', 'rays', 'orbits', 'rings', 'arcs', 'radialLines', 'petals',
    'flow', 'particles', 'bubbles',
    'crosshatch', 'chevrons', 'zigzag', 'weave', 'moire',
    'curves', 'noise', 'mesh', 'branches',
  ];
}

export function getPrimitivesByCategory(): Record<string, string[]> {
  return {
    basic: ['dots', 'lines', 'waves', 'stripes', 'circles', 'grid'],
    geometric: ['polygons', 'diamonds', 'hexgrid', 'stars', 'concentricSquares'],
    radial: ['spirals', 'rays', 'orbits', 'rings', 'arcs', 'radialLines', 'petals'],
    flow: ['flow', 'particles', 'bubbles'],
    patterns: ['crosshatch', 'chevrons', 'zigzag', 'weave', 'moire'],
    organic: ['curves', 'noise', 'mesh', 'branches'],
  };
}

export function getPrimitiveInfo(name: string): PrimitiveCapability | null {
  const caps = getCapabilities();
  return caps.primitives.find(p => p.name === name) || null;
}

export function getMotionSources(): string[] {
  return ['none', 'time', 'seed'];
}

export function getBackgroundTextures(): string[] {
  return ['none', 'noise', 'grain'];
}

export function isPrimitiveValid(name: string): boolean {
  return getPrimitiveTypes().includes(name);
}
