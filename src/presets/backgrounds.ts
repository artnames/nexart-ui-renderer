/**
 * Background Presets - Compile to Code Mode sketches
 * These are aesthetic-first presets that always look good
 * All code uses p5-compatible APIs only
 */

import { BackgroundPreset, ColorPalette, LoopConfig, AESTHETIC_DEFAULTS } from '../types';

export interface PresetColors {
  background: string;
  foreground: string;
  accent?: string;
}

export function getPaletteColors(palette: ColorPalette = 'offwhite-dark'): PresetColors {
  const palettes: Record<ColorPalette, PresetColors> = {
    'offwhite-dark': {
      background: 'rgb(246, 245, 242)',
      foreground: 'rgb(45, 45, 45)',
    },
    'midnight': {
      background: 'rgb(18, 18, 24)',
      foreground: 'rgb(200, 200, 210)',
    },
    'warm-neutral': {
      background: 'rgb(245, 240, 235)',
      foreground: 'rgb(80, 60, 50)',
    },
    'ocean': {
      background: 'rgb(230, 240, 245)',
      foreground: 'rgb(30, 60, 90)',
      accent: 'rgb(60, 120, 180)',
    },
    'sunset': {
      background: 'rgb(255, 245, 235)',
      foreground: 'rgb(120, 60, 40)',
      accent: 'rgb(255, 140, 80)',
    },
    'forest': {
      background: 'rgb(235, 242, 235)',
      foreground: 'rgb(40, 70, 50)',
      accent: 'rgb(80, 140, 90)',
    },
  };
  return palettes[palette];
}

export function compileBackgroundPreset(
  preset: BackgroundPreset,
  palette: ColorPalette = 'offwhite-dark',
  loop: LoopConfig = { duration: AESTHETIC_DEFAULTS.loop.defaultFrames }
): string {
  const colors = getPaletteColors(palette);
  const totalFrames = loop.duration;

  switch (preset) {
    case 'layered-waves':
      return generateLayeredWaves(colors, totalFrames);
    case 'soft-noise-field':
      return generateSoftNoiseField(colors, totalFrames);
    case 'orbital-lines':
      return generateOrbitalLines(colors, totalFrames);
    case 'flowing-stripes':
      return generateFlowingStripes(colors, totalFrames);
    case 'minimal-grid':
      return generateMinimalGrid(colors, totalFrames);
    default:
      return generateLayeredWaves(colors, totalFrames);
  }
}

function generateLayeredWaves(colors: PresetColors, totalFrames: number): string {
  return `
function setup() {
  noFill();
  strokeWeight(1.5);
}

function draw() {
  background('${colors.background}');
  stroke('${colors.foreground}');
  
  const margin = width * 0.08;
  const waveCount = 8;
  const waveSpacing = (height - margin * 2) / waveCount;
  
  for (let i = 0; i < waveCount; i++) {
    const y = margin + i * waveSpacing;
    const phase = i * 0.3 + t * TWO_PI;
    const amp = 15 + i * 5;
    
    beginShape();
    for (let x = margin; x <= width - margin; x += 3) {
      const nx = (x - margin) / (width - margin * 2);
      const wave = sin(nx * PI * 3 + phase) * amp;
      const easeEdge = sin(nx * PI);
      vertex(x, y + wave * easeEdge);
    }
    endShape();
  }
}
`;
}

function generateSoftNoiseField(colors: PresetColors, totalFrames: number): string {
  return `
function setup() {
  noStroke();
}

function draw() {
  background('${colors.background}');
  
  const margin = width * 0.08;
  const dotSize = 3;
  const spacing = 20;
  const cols = floor((width - margin * 2) / spacing);
  const rows = floor((height - margin * 2) / spacing);
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = margin + i * spacing + spacing / 2;
      const y = margin + j * spacing + spacing / 2;
      
      const n = noise(i * 0.1, j * 0.1, t * 2);
      const offsetX = (n - 0.5) * spacing * 0.6;
      const offsetY = (noise(i * 0.1 + 100, j * 0.1, t * 2) - 0.5) * spacing * 0.6;
      
      const alpha = map(n, 0, 1, 80, 200);
      fill(red('${colors.foreground}'), green('${colors.foreground}'), blue('${colors.foreground}'), alpha);
      ellipse(x + offsetX, y + offsetY, dotSize + n * 3);
    }
  }
}
`;
}

function generateOrbitalLines(colors: PresetColors, totalFrames: number): string {
  return `
function setup() {
  noFill();
  strokeWeight(1);
}

function draw() {
  background('${colors.background}');
  stroke('${colors.foreground}');
  
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = min(width, height) * 0.4;
  const orbitCount = 6;
  
  for (let i = 0; i < orbitCount; i++) {
    const radius = maxRadius * (0.3 + i * 0.12);
    const rotation = t * TWO_PI * (0.5 + i * 0.1) * (i % 2 === 0 ? 1 : -1);
    
    beginShape();
    for (let a = 0; a <= TWO_PI; a += 0.05) {
      const wobble = sin(a * 3 + t * TWO_PI + i) * 8;
      const r = radius + wobble;
      const x = cx + cos(a + rotation) * r;
      const y = cy + sin(a + rotation) * r;
      vertex(x, y);
    }
    endShape(CLOSE);
  }
}
`;
}

function generateFlowingStripes(colors: PresetColors, totalFrames: number): string {
  return `
function setup() {
  noFill();
  strokeWeight(2);
}

function draw() {
  background('${colors.background}');
  stroke('${colors.foreground}');
  
  const margin = width * 0.1;
  const stripeCount = 12;
  const stripeSpacing = (width - margin * 2) / stripeCount;
  
  for (let i = 0; i < stripeCount; i++) {
    const x = margin + i * stripeSpacing;
    const phase = i * 0.2 + t * TWO_PI;
    
    beginShape();
    for (let y = margin; y <= height - margin; y += 4) {
      const ny = (y - margin) / (height - margin * 2);
      const wave = sin(ny * PI * 2 + phase) * 15;
      const easeEdge = sin(ny * PI);
      vertex(x + wave * easeEdge, y);
    }
    endShape();
  }
}
`;
}

function generateMinimalGrid(colors: PresetColors, totalFrames: number): string {
  return `
function setup() {
  rectMode(CENTER);
  noFill();
  strokeWeight(1);
}

function draw() {
  background('${colors.background}');
  stroke('${colors.foreground}');
  
  const margin = width * 0.12;
  const cols = 6;
  const rows = 6;
  const cellW = (width - margin * 2) / cols;
  const cellH = (height - margin * 2) / rows;
  const baseSize = min(cellW, cellH) * 0.5;
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = margin + i * cellW + cellW / 2;
      const y = margin + j * cellH + cellH / 2;
      
      const n = noise(i * 0.3, j * 0.3, t * 1.5);
      const size = baseSize * (0.5 + n * 0.5);
      const rotation = n * PI * 0.25;
      
      push();
      translate(x, y);
      rotate(rotation);
      rect(0, 0, size, size);
      pop();
    }
  }
}
`;
}
