/**
 * @nexart/ui-renderer v0.8.0 - System Compiler
 *
 * Compiles validated systems into protocol-compatible JSON.
 * Lightweight preview runtime — no protocol enforcement.
 */

import type { NexArtSystem, DeclarativeSystem, NexArtCodeSystem, SystemElement } from './types';
import { isCodeModeSystem, isDeclarativeSystem } from './system';

export interface CompiledDeclarativeSystem {
  protocol: 'nexart';
  systemType: 'declarative';
  systemVersion: string;
  seed: number;
  background: {
    color: string;
    texture: string;
    gradient?: {
      type: string;
      colors: string[];
      angle?: number;
    };
  };
  elements: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  motion: {
    source: string;
    speed?: number;
  };
  deterministic: boolean;
  compiledAt: string;
  compilerVersion: string;
}

export interface CompiledCodeSystem {
  protocol: 'nexart';
  systemType: 'code';
  systemVersion: string;
  source: string;
  mode: 'static' | 'loop';
  width: number;
  height: number;
  seed: number;
  totalFrames?: number;
  deterministic: boolean;
  compiledAt: string;
  compilerVersion: string;
}

export type CompiledSystem = CompiledDeclarativeSystem | CompiledCodeSystem;

const COMPILER_VERSION = '0.8.0';

export function compileSystem(system: NexArtSystem): CompiledSystem {
  if (isCodeModeSystem(system)) {
    return compileCodeSystem(system);
  }

  return compileDeclarativeSystem(system as DeclarativeSystem);
}

function compileCodeSystem(system: NexArtCodeSystem): CompiledCodeSystem {
  return {
    protocol: 'nexart',
    systemType: 'code',
    systemVersion: system.systemVersion,
    source: system.source,
    mode: system.mode,
    width: system.width,
    height: system.height,
    seed: system.seed,
    ...(system.totalFrames !== undefined && { totalFrames: system.totalFrames }),
    deterministic: true,
    compiledAt: new Date().toISOString(),
    compilerVersion: COMPILER_VERSION,
  };
}

function compileDeclarativeSystem(system: DeclarativeSystem): CompiledDeclarativeSystem {
  const compiled: CompiledDeclarativeSystem = {
    protocol: 'nexart',
    systemType: 'declarative',
    systemVersion: system.systemVersion,
    seed: system.seed,
    background: {
      color: normalizeColor(system.background.color),
      texture: system.background.texture || 'none',
    },
    elements: system.elements.map(normalizeElement),
    motion: {
      source: system.motion.source,
      ...(system.motion.speed !== undefined && { speed: system.motion.speed }),
    },
    deterministic: true,
    compiledAt: new Date().toISOString(),
    compilerVersion: COMPILER_VERSION,
  };

  if (system.background.gradient) {
    compiled.background.gradient = {
      type: system.background.gradient.type,
      colors: system.background.gradient.colors.map(normalizeColor),
      ...(system.background.gradient.angle !== undefined && {
        angle: system.background.gradient.angle,
      }),
    };
  }

  return compiled;
}

function normalizeColor(color: string): string {
  const colorMap: Record<string, string> = {
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    black: '#000000',
    white: '#ffffff',
    yellow: '#ffff00',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    orange: '#ff8000',
    purple: '#8000ff',
    pink: '#ff0080',
    gray: '#808080',
    grey: '#808080',
  };

  const lower = color.toLowerCase();
  return colorMap[lower] || color;
}

function normalizeElement(element: SystemElement): { type: string; [key: string]: unknown } {
  const normalized: { type: string; [key: string]: unknown } = { type: element.type };

  for (const [key, value] of Object.entries(element)) {
    if (value !== undefined && value !== null) {
      normalized[key] = value;
    }
  }

  if (normalized.opacity === undefined) {
    normalized.opacity = 1;
  }

  return normalized;
}

export function serializeSystem(system: NexArtSystem): string {
  const compiled = compileSystem(system);
  return JSON.stringify(compiled, null, 2);
}
