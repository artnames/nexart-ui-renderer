/**
 * @nexart/ui-renderer v0.2.0 - Capabilities Discovery
 *
 * Exposes SDK capabilities for AI tools and builders.
 * Critical for preventing hallucination and SDK bypass.
 */

export interface PrimitiveCapability {
  type: string;
  description: string;
  parameters: Record<string, ParameterSpec>;
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
    maxParticles: number;
    maxDots: number;
    maxLines: number;
    maxOrbits: number;
    maxGridSize: number;
  };
}

export function getCapabilities(): Capabilities {
  return {
    version: '0.2.0',
    isCanonical: false,
    isArchival: false,
    renderer: '@nexart/ui-renderer',

    primitives: [
      {
        type: 'dots',
        description: 'Scattered dot patterns with various distributions',
        parameters: {
          distribution: {
            type: 'enum',
            required: true,
            description: 'How dots are distributed across the canvas',
            options: ['random', 'radial', 'grid', 'spiral'],
          },
          count: {
            type: 'number',
            required: true,
            description: 'Number of dots to render',
            min: 1,
            max: 10000,
          },
          size: {
            type: 'tuple',
            required: true,
            description: 'Size range [min, max] in pixels',
            tupleLength: 2,
          },
          color: {
            type: 'string',
            required: false,
            description: 'CSS color or named color',
            default: 'white',
          },
          opacity: {
            type: 'number',
            required: false,
            description: 'Opacity from 0 to 1',
            min: 0,
            max: 1,
            default: 1,
          },
        },
      },
      {
        type: 'lines',
        description: 'Linear patterns in various directions',
        parameters: {
          direction: {
            type: 'enum',
            required: true,
            description: 'Direction of lines',
            options: ['horizontal', 'vertical', 'diagonal', 'radial'],
          },
          count: {
            type: 'number',
            required: true,
            description: 'Number of lines',
            min: 1,
            max: 500,
          },
          thickness: {
            type: 'tuple',
            required: true,
            description: 'Thickness range [min, max] in pixels',
            tupleLength: 2,
          },
          color: {
            type: 'string',
            required: false,
            description: 'CSS color or named color',
            default: 'white',
          },
          opacity: {
            type: 'number',
            required: false,
            description: 'Opacity from 0 to 1',
            min: 0,
            max: 1,
            default: 1,
          },
        },
      },
      {
        type: 'waves',
        description: 'Sinusoidal wave patterns',
        parameters: {
          axis: {
            type: 'enum',
            required: true,
            description: 'Primary axis of wave motion',
            options: ['x', 'y'],
          },
          amplitude: {
            type: 'number',
            required: true,
            description: 'Wave height as fraction of canvas (0-1)',
            min: 0,
            max: 1,
          },
          frequency: {
            type: 'number',
            required: true,
            description: 'Number of wave cycles',
            min: 0.1,
            max: 10,
          },
          count: {
            type: 'number',
            required: false,
            description: 'Number of parallel waves',
            min: 1,
            max: 50,
            default: 8,
          },
          color: {
            type: 'string',
            required: false,
            description: 'CSS color or named color',
            default: 'white',
          },
          opacity: {
            type: 'number',
            required: false,
            description: 'Opacity from 0 to 1',
            min: 0,
            max: 1,
            default: 1,
          },
        },
      },
      {
        type: 'grid',
        description: 'Regular grid of shapes',
        parameters: {
          rows: {
            type: 'number',
            required: true,
            description: 'Number of rows',
            min: 1,
            max: 100,
          },
          cols: {
            type: 'number',
            required: true,
            description: 'Number of columns',
            min: 1,
            max: 100,
          },
          shape: {
            type: 'enum',
            required: true,
            description: 'Shape at each grid point',
            options: ['square', 'circle', 'diamond'],
          },
          cellSize: {
            type: 'number',
            required: false,
            description: 'Size of each cell shape in pixels',
          },
          color: {
            type: 'string',
            required: false,
            description: 'CSS color or named color',
            default: 'white',
          },
          opacity: {
            type: 'number',
            required: false,
            description: 'Opacity from 0 to 1',
            min: 0,
            max: 1,
            default: 1,
          },
        },
      },
      {
        type: 'flowField',
        description: 'Particle traces following a noise-based vector field',
        parameters: {
          resolution: {
            type: 'number',
            required: true,
            description: 'Grid resolution for noise sampling',
            min: 5,
            max: 100,
          },
          strength: {
            type: 'number',
            required: true,
            description: 'Field influence strength (0-1)',
            min: 0,
            max: 1,
          },
          particles: {
            type: 'number',
            required: true,
            description: 'Number of particles',
            min: 10,
            max: 5000,
          },
          color: {
            type: 'string',
            required: false,
            description: 'CSS color or named color',
            default: 'white',
          },
          opacity: {
            type: 'number',
            required: false,
            description: 'Opacity from 0 to 1',
            min: 0,
            max: 1,
            default: 1,
          },
        },
      },
      {
        type: 'orbits',
        description: 'Circular orbital patterns with dots',
        parameters: {
          count: {
            type: 'number',
            required: true,
            description: 'Number of orbital rings',
            min: 1,
            max: 20,
          },
          radius: {
            type: 'tuple',
            required: true,
            description: 'Radius range [min, max] in pixels',
            tupleLength: 2,
          },
          dotCount: {
            type: 'number',
            required: true,
            description: 'Dots per orbit',
            min: 1,
            max: 200,
          },
          speed: {
            type: 'number',
            required: false,
            description: 'Rotation speed multiplier',
            min: 0,
            max: 5,
            default: 1,
          },
          color: {
            type: 'string',
            required: false,
            description: 'CSS color or named color',
            default: 'white',
          },
          opacity: {
            type: 'number',
            required: false,
            description: 'Opacity from 0 to 1',
            min: 0,
            max: 1,
            default: 1,
          },
        },
      },
    ],

    background: {
      color: {
        type: 'string',
        required: true,
        description: 'Background color (CSS color or named color like "blue", "black", "#1a1a2e")',
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
      maxParticles: 5000,
      maxDots: 10000,
      maxLines: 500,
      maxOrbits: 20,
      maxGridSize: 100,
    },
  };
}

export function getPrimitiveTypes(): string[] {
  return ['dots', 'lines', 'waves', 'grid', 'flowField', 'orbits'];
}

export function getMotionSources(): string[] {
  return ['none', 'time', 'seed'];
}

export function getBackgroundTextures(): string[] {
  return ['none', 'noise', 'grain'];
}
