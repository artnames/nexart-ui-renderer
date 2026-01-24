/**
 * Primitive Elements - Safe ranges with aesthetic clamping
 * Declarative blocks that compose well and always look tasteful
 * All code uses p5-compatible APIs only (no globalAlpha, etc.)
 */

import { PrimitiveName, MotionSpeed, StrokeWeightAuto, AESTHETIC_DEFAULTS } from '../types';

export interface PrimitiveConfig {
  name: PrimitiveName;
  count?: number;
  strokeWeight?: StrokeWeightAuto;
  motion?: MotionSpeed;
  color?: string;
  opacity?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resolveStrokeWeight(weight: StrokeWeightAuto = 'auto'): number {
  if (typeof weight === 'number') {
    return clamp(weight, AESTHETIC_DEFAULTS.strokeWeight.min, AESTHETIC_DEFAULTS.strokeWeight.max);
  }
  switch (weight) {
    case 'thin': return 0.5;
    case 'thick': return 3;
    case 'medium': return 1.5;
    case 'auto':
    default: return AESTHETIC_DEFAULTS.strokeWeight.default;
  }
}

function resolveMotionSpeed(speed: MotionSpeed = 'slow'): number {
  switch (speed) {
    case 'fast': return 1.5;
    case 'medium': return 1.0;
    case 'slow':
    default: return 0.5;
  }
}

function resolveCount(count: number | undefined, defaultVal: number): number {
  if (count === undefined) return defaultVal;
  return clamp(count, AESTHETIC_DEFAULTS.density.min, AESTHETIC_DEFAULTS.density.max);
}

function resolveOpacity(opacity: number | undefined): number {
  if (opacity === undefined) return 255;
  return Math.round(clamp(opacity, 0.1, 1) * 255);
}

export function compilePrimitive(config: PrimitiveConfig, foreground: string = 'rgb(45, 45, 45)'): string {
  const sw = resolveStrokeWeight(config.strokeWeight);
  const speed = resolveMotionSpeed(config.motion);
  const count = resolveCount(config.count, AESTHETIC_DEFAULTS.density.default);
  const color = config.color || foreground;
  const alpha = resolveOpacity(config.opacity);

  switch (config.name) {
    case 'waves':
      return generateWavesPrimitive(count, sw, speed, color, alpha);
    case 'dots':
      return generateDotsPrimitive(count, color, alpha);
    case 'lines':
      return generateLinesPrimitive(count, sw, speed, color, alpha);
    case 'grid':
      return generateGridPrimitive(count, sw, color, alpha);
    case 'flow':
      return generateFlowPrimitive(count, sw, speed, color, alpha);
    case 'orbits':
      return generateOrbitsPrimitive(count, sw, speed, color, alpha);
    case 'circles':
      return generateCirclesPrimitive(count, sw, speed, color, alpha);
    case 'stripes':
      return generateStripesPrimitive(count, sw, speed, color, alpha);
    case 'spirals':
      return generateSpiralsPrimitive(count, sw, speed, color, alpha);
    case 'rays':
      return generateRaysPrimitive(count, sw, speed, color, alpha);
    case 'stars':
      return generateStarsPrimitive(count, sw, speed, color, alpha);
    case 'polygons':
      return generatePolygonsPrimitive(count, sw, speed, color, alpha);
    case 'hexgrid':
      return generateHexgridPrimitive(count, sw, color, alpha);
    case 'arcs':
      return generateArcsPrimitive(count, sw, speed, color, alpha);
    case 'crosshatch':
      return generateCrosshatchPrimitive(count, sw, color, alpha);
    case 'chevrons':
      return generateChevronsPrimitive(count, sw, speed, color, alpha);
    case 'zigzag':
      return generateZigzagPrimitive(count, sw, speed, color, alpha);
    case 'rings':
      return generateRingsPrimitive(count, sw, speed, color, alpha);
    case 'diamonds':
      return generateDiamondsPrimitive(count, sw, speed, color, alpha);
    case 'bubbles':
      return generateBubblesPrimitive(count, sw, speed, color, alpha);
    case 'mesh':
      return generateMeshPrimitive(count, sw, color, alpha);
    case 'curves':
      return generateCurvesPrimitive(count, sw, speed, color, alpha);
    case 'noise':
      return generateNoisePrimitive(count, sw, speed, color, alpha);
    case 'particles':
      return generateParticlesPrimitive(count, sw, speed, color, alpha);
    case 'petals':
      return generatePetalsPrimitive(count, sw, speed, color, alpha);
    case 'branches':
      return generateBranchesPrimitive(count, sw, color, alpha);
    case 'weave':
      return generateWeavePrimitive(count, sw, speed, color, alpha);
    case 'moire':
      return generateMoirePrimitive(count, sw, speed, color, alpha);
    case 'radialLines':
      return generateRadialLinesPrimitive(count, sw, speed, color, alpha);
    case 'concentricSquares':
      return generateConcentricSquaresPrimitive(count, sw, speed, color, alpha);
    default:
      return generateWavesPrimitive(count, sw, speed, color, alpha);
  }
}

function generateWavesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.08;
const spacing = (height - margin * 2) / ${count};

for (let i = 0; i < ${count}; i++) {
  const y = margin + i * spacing;
  const phase = i * 0.3 + t * TWO_PI * ${speed};
  const amp = 12 + i * 4;
  
  beginShape();
  for (let x = margin; x <= width - margin; x += 3) {
    const nx = (x - margin) / (width - margin * 2);
    const wave = sin(nx * PI * 3 + phase) * amp;
    const easeEdge = sin(nx * PI);
    vertex(x, y + wave * easeEdge);
  }
  endShape();
}
pop();
`;
}

function generateDotsPrimitive(count: number, color: string, alpha: number): string {
  return `
push();
noStroke();
fill(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const cols = ${Math.ceil(Math.sqrt(count * 1.5))};
const rows = ${Math.ceil(count / Math.ceil(Math.sqrt(count * 1.5)))};
const spacing = min((width - margin * 2) / cols, (height - margin * 2) / rows);

for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const x = margin + i * spacing + spacing / 2;
    const y = margin + j * spacing + spacing / 2;
    
    const n = noise(i * 0.2, j * 0.2, t * 2);
    const offsetX = (n - 0.5) * spacing * 0.4;
    const offsetY = (noise(i * 0.2 + 50, j * 0.2, t * 2) - 0.5) * spacing * 0.4;
    const size = 3 + n * 5;
    
    ellipse(x + offsetX, y + offsetY, size);
  }
}
pop();
`;
}

function generateLinesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const spacing = (width - margin * 2) / ${count};

for (let i = 0; i < ${count}; i++) {
  const x = margin + i * spacing;
  const phase = i * 0.15 + t * TWO_PI * ${speed};
  
  beginShape();
  for (let y = margin; y <= height - margin; y += 4) {
    const ny = (y - margin) / (height - margin * 2);
    const wave = sin(ny * PI * 2 + phase) * 12;
    const ease = sin(ny * PI);
    vertex(x + wave * ease, y);
  }
  endShape();
}
pop();
`;
}

function generateGridPrimitive(count: number, sw: number, color: string, alpha: number): string {
  const gridSize = Math.ceil(Math.sqrt(count));
  return `
push();
rectMode(CENTER);
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.12;
const cols = ${gridSize};
const rows = ${gridSize};
const cellW = (width - margin * 2) / cols;
const cellH = (height - margin * 2) / rows;
const baseSize = min(cellW, cellH) * 0.5;

for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const x = margin + i * cellW + cellW / 2;
    const y = margin + j * cellH + cellH / 2;
    
    const n = noise(i * 0.3, j * 0.3, t * 1.5);
    const size = baseSize * (0.4 + n * 0.6);
    const rotation = n * PI * 0.2;
    
    push();
    translate(x, y);
    rotate(rotation);
    rect(0, 0, size, size);
    pop();
  }
}
pop();
`;
}

function generateFlowPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const particleCount = ${count * 8};
const lineLength = 50;

for (let i = 0; i < particleCount; i++) {
  const startX = margin + random() * (width - margin * 2);
  const startY = margin + random() * (height - margin * 2);
  
  beginShape();
  let px = startX;
  let py = startY;
  
  for (let s = 0; s < lineLength; s++) {
    const angle = noise(px * 0.005, py * 0.005, t * ${speed}) * TWO_PI * 2;
    vertex(px, py);
    px += cos(angle) * 2;
    py += sin(angle) * 2;
    
    if (px < margin || px > width - margin || py < margin || py > height - margin) break;
  }
  endShape();
}
pop();
`;
}

function generateOrbitsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxRadius = min(width, height) * 0.4;

for (let i = 0; i < ${count}; i++) {
  const radius = maxRadius * (0.25 + i * ${0.75 / count});
  const rotation = t * TWO_PI * ${speed} * (i % 2 === 0 ? 1 : -1);
  
  beginShape();
  for (let a = 0; a <= TWO_PI; a += 0.05) {
    const wobble = sin(a * 4 + t * TWO_PI + i) * 6;
    const r = radius + wobble;
    const x = cx + cos(a + rotation) * r;
    const y = cy + sin(a + rotation) * r;
    vertex(x, y);
  }
  endShape(CLOSE);
}
pop();
`;
}

function generateCirclesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxRadius = min(width, height) * 0.4;

for (let i = 0; i < ${count}; i++) {
  const baseRadius = maxRadius * (0.2 + i * ${0.8 / count});
  const pulseOffset = i * 0.3;
  const pulse = sin(t * TWO_PI * ${speed} + pulseOffset) * 10;
  
  ellipse(cx, cy, (baseRadius + pulse) * 2);
}
pop();
`;
}

function generateStripesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.08;
const spacing = (height - margin * 2) / ${count};

for (let i = 0; i < ${count}; i++) {
  const y = margin + i * spacing;
  const wavePhase = i * 0.2 + t * TWO_PI * ${speed};
  const wave = sin(wavePhase) * 8;
  
  line(margin, y + wave, width - margin, y + wave);
}
pop();
`;
}

function generateSpiralsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxRadius = min(width, height) * 0.45;

for (let s = 0; s < ${count}; s++) {
  const offset = (s / ${count}) * TWO_PI;
  beginShape();
  for (let i = 0; i < 200; i++) {
    const angle = i * 0.1 + offset + t * TWO_PI * ${speed};
    const radius = (i / 200) * maxRadius;
    const x = cx + cos(angle) * radius;
    const y = cy + sin(angle) * radius;
    vertex(x, y);
  }
  endShape();
}
pop();
`;
}

function generateRaysPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxLen = min(width, height) * 0.5;

for (let i = 0; i < ${count}; i++) {
  const angle = (i / ${count}) * TWO_PI + t * ${speed};
  const len = maxLen * (0.5 + noise(i * 0.5, t) * 0.5);
  const x2 = cx + cos(angle) * len;
  const y2 = cy + sin(angle) * len;
  line(cx, cy, x2, y2);
}
pop();
`;
}

function generateStarsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.15;

for (let i = 0; i < ${count}; i++) {
  const x = margin + random() * (width - margin * 2);
  const y = margin + random() * (height - margin * 2);
  const size = 10 + random() * 20;
  const points = 5 + floor(random() * 3);
  const rotation = random() * TWO_PI + t * ${speed};
  
  push();
  translate(x, y);
  rotate(rotation);
  beginShape();
  for (let j = 0; j < points * 2; j++) {
    const angle = (j / (points * 2)) * TWO_PI;
    const r = j % 2 === 0 ? size : size * 0.4;
    vertex(cos(angle) * r, sin(angle) * r);
  }
  endShape(CLOSE);
  pop();
}
pop();
`;
}

function generatePolygonsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.12;

for (let i = 0; i < ${count}; i++) {
  const x = margin + random() * (width - margin * 2);
  const y = margin + random() * (height - margin * 2);
  const size = 15 + random() * 30;
  const sides = 3 + floor(random() * 5);
  const rotation = random() * PI + t * ${speed} * (random() > 0.5 ? 1 : -1);
  
  push();
  translate(x, y);
  rotate(rotation);
  beginShape();
  for (let j = 0; j < sides; j++) {
    const angle = (j / sides) * TWO_PI;
    vertex(cos(angle) * size, sin(angle) * size);
  }
  endShape(CLOSE);
  pop();
}
pop();
`;
}

function generateHexgridPrimitive(count: number, sw: number, color: string, alpha: number): string {
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const hexSize = (width - margin * 2) / ${cols} * 0.5;
const cols = ${cols};
const rows = ceil(${count} / cols);

for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const offsetX = j % 2 === 0 ? 0 : hexSize * 0.866;
    const x = margin + i * hexSize * 1.732 + offsetX + hexSize;
    const y = margin + j * hexSize * 1.5 + hexSize;
    
    if (x > width - margin || y > height - margin) continue;
    
    beginShape();
    for (let k = 0; k < 6; k++) {
      const angle = k * PI / 3 + PI / 6;
      vertex(x + cos(angle) * hexSize, y + sin(angle) * hexSize);
    }
    endShape(CLOSE);
  }
}
pop();
`;
}

function generateArcsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxRadius = min(width, height) * 0.4;

for (let i = 0; i < ${count}; i++) {
  const radius = maxRadius * (0.3 + (i / ${count}) * 0.7);
  const startAngle = random() * TWO_PI + t * ${speed};
  const arcLength = PI * 0.3 + random() * PI;
  
  arc(cx, cy, radius * 2, radius * 2, startAngle, startAngle + arcLength);
}
pop();
`;
}

function generateCrosshatchPrimitive(count: number, sw: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw * 0.5});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const spacing = (width - margin * 2) / ${count};

for (let i = 0; i <= ${count}; i++) {
  const x = margin + i * spacing;
  line(x, margin, x, height - margin);
}

for (let i = 0; i <= ${count}; i++) {
  const y = margin + i * spacing * (height / width);
  line(margin, y, width - margin, y);
}

for (let i = 0; i <= ${count * 1.5}; i++) {
  const offset = i * spacing * 0.7;
  line(margin + offset, margin, margin, margin + offset);
  line(width - margin - offset, height - margin, width - margin, height - margin - offset);
}
pop();
`;
}

function generateChevronsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const spacing = (height - margin * 2) / ${count};
const amplitude = width * 0.15;

for (let i = 0; i < ${count}; i++) {
  const y = margin + i * spacing;
  const phase = sin(t * TWO_PI * ${speed} + i * 0.3) * 20;
  
  beginShape();
  vertex(margin, y + phase);
  vertex(width / 2, y - amplitude * 0.5 + phase);
  vertex(width - margin, y + phase);
  endShape();
}
pop();
`;
}

function generateZigzagPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.08;
const lineSpacing = (height - margin * 2) / ${count};
const zigWidth = 30;

for (let i = 0; i < ${count}; i++) {
  const baseY = margin + i * lineSpacing;
  const phase = t * ${speed} * zigWidth;
  
  beginShape();
  for (let x = margin; x <= width - margin; x += zigWidth) {
    const segIndex = floor((x - margin + phase) / zigWidth);
    const yOffset = segIndex % 2 === 0 ? -10 : 10;
    vertex(x, baseY + yOffset);
  }
  endShape();
}
pop();
`;
}

function generateRingsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxRadius = min(width, height) * 0.45;
const gap = maxRadius / ${count};

for (let i = 0; i < ${count}; i++) {
  const baseRadius = gap * (i + 1);
  const pulse = sin(t * TWO_PI * ${speed} + i * 0.5) * 5;
  
  if (i % 2 === 0) {
    ellipse(cx, cy, (baseRadius + pulse) * 2);
  }
}
pop();
`;
}

function generateDiamondsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  const gridSize = Math.ceil(Math.sqrt(count));
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const cols = ${gridSize};
const rows = ${gridSize};
const cellW = (width - margin * 2) / cols;
const cellH = (height - margin * 2) / rows;

for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const x = margin + i * cellW + cellW / 2;
    const y = margin + j * cellH + cellH / 2;
    const size = min(cellW, cellH) * 0.35;
    const rotation = noise(i * 0.3, j * 0.3, t * ${speed}) * 0.3;
    
    push();
    translate(x, y);
    rotate(PI / 4 + rotation);
    rect(0, 0, size, size);
    pop();
  }
}
pop();
`;
}

function generateBubblesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;

for (let i = 0; i < ${count * 3}; i++) {
  const baseX = random() * width;
  const baseY = random() * height;
  const size = 10 + random() * 40;
  
  const floatY = baseY - t * height * ${speed} * 0.5;
  const y = ((floatY % height) + height) % height;
  const wobble = sin(t * TWO_PI * 2 + i) * 5;
  
  ellipse(baseX + wobble, y, size);
}
pop();
`;
}

function generateMeshPrimitive(count: number, sw: number, color: string, alpha: number): string {
  const gridSize = Math.ceil(Math.sqrt(count));
  return `
push();
noFill();
strokeWeight(${sw * 0.5});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const cols = ${gridSize};
const rows = ${gridSize};
const cellW = (width - margin * 2) / cols;
const cellH = (height - margin * 2) / rows;

const points = [];
for (let i = 0; i <= cols; i++) {
  points[i] = [];
  for (let j = 0; j <= rows; j++) {
    const x = margin + i * cellW + (noise(i * 0.3, j * 0.3, t) - 0.5) * cellW * 0.5;
    const y = margin + j * cellH + (noise(i * 0.3 + 100, j * 0.3, t) - 0.5) * cellH * 0.5;
    points[i][j] = { x, y };
  }
}

for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const p1 = points[i][j];
    const p2 = points[i + 1][j];
    const p3 = points[i + 1][j + 1];
    const p4 = points[i][j + 1];
    
    line(p1.x, p1.y, p2.x, p2.y);
    line(p2.x, p2.y, p3.x, p3.y);
    line(p1.x, p1.y, p3.x, p3.y);
  }
}
pop();
`;
}

function generateCurvesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.15;

for (let i = 0; i < ${count}; i++) {
  const x1 = margin + random() * (width - margin * 2);
  const y1 = margin + random() * (height - margin * 2);
  const x2 = margin + random() * (width - margin * 2);
  const y2 = margin + random() * (height - margin * 2);
  
  const cx1 = x1 + (random() - 0.5) * 100 + sin(t * TWO_PI * ${speed}) * 20;
  const cy1 = y1 + (random() - 0.5) * 100;
  const cx2 = x2 + (random() - 0.5) * 100;
  const cy2 = y2 + (random() - 0.5) * 100 + cos(t * TWO_PI * ${speed}) * 20;
  
  bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
}
pop();
`;
}

function generateNoisePrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw * 0.7});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.08;
const resolution = ${Math.max(8, Math.ceil(count / 3))};
const cellW = (width - margin * 2) / resolution;
const cellH = (height - margin * 2) / resolution;

for (let i = 0; i < resolution; i++) {
  for (let j = 0; j < resolution; j++) {
    const x = margin + i * cellW + cellW / 2;
    const y = margin + j * cellH + cellH / 2;
    const n = noise(i * 0.2, j * 0.2, t * ${speed});
    const len = n * min(cellW, cellH) * 0.8;
    const angle = n * TWO_PI * 2;
    
    line(
      x - cos(angle) * len / 2,
      y - sin(angle) * len / 2,
      x + cos(angle) * len / 2,
      y + sin(angle) * len / 2
    );
  }
}
pop();
`;
}

function generateParticlesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});
fill(red('${color}'), green('${color}'), blue('${color}'), ${alpha * 0.5});

const cx = width / 2;
const cy = height / 2;

for (let i = 0; i < ${count * 5}; i++) {
  const angle = random() * TWO_PI;
  const dist = random() * min(width, height) * 0.4;
  const x = cx + cos(angle + t * ${speed}) * dist;
  const y = cy + sin(angle + t * ${speed}) * dist;
  const size = 2 + random() * 4;
  
  const tailAngle = angle + t * ${speed} - PI;
  const tailLen = 5 + random() * 10;
  
  ellipse(x, y, size);
  line(x, y, x + cos(tailAngle) * tailLen, y + sin(tailAngle) * tailLen);
}
pop();
`;
}

function generatePetalsPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const petalCount = ${count};
const maxRadius = min(width, height) * 0.35;

for (let i = 0; i < petalCount; i++) {
  const angle = (i / petalCount) * TWO_PI + t * ${speed};
  
  beginShape();
  for (let j = 0; j <= 20; j++) {
    const t2 = j / 20;
    const petalAngle = angle + sin(t2 * PI) * 0.5;
    const r = sin(t2 * PI) * maxRadius;
    const x = cx + cos(petalAngle) * r;
    const y = cy + sin(petalAngle) * r;
    vertex(x, y);
  }
  endShape();
}
pop();
`;
}

function generateBranchesPrimitive(count: number, sw: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

function drawBranch(x, y, len, angle, depth) {
  if (depth <= 0 || len < 5) return;
  
  const x2 = x + cos(angle) * len;
  const y2 = y + sin(angle) * len;
  line(x, y, x2, y2);
  
  const spread = PI * 0.25;
  drawBranch(x2, y2, len * 0.7, angle - spread + noise(depth, t) * 0.3, depth - 1);
  drawBranch(x2, y2, len * 0.7, angle + spread + noise(depth + 50, t) * 0.3, depth - 1);
}

const startX = width / 2;
const startY = height * 0.85;
const branchLen = height * 0.15;
const maxDepth = min(${Math.ceil(Math.log2(count) + 2)}, 7);

drawBranch(startX, startY, branchLen, -HALF_PI, maxDepth);
pop();
`;
}

function generateWeavePrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const margin = width * 0.1;
const spacing = (width - margin * 2) / ${count};

for (let i = 0; i < ${count}; i++) {
  const x = margin + i * spacing;
  const phase = i * 0.4 + t * TWO_PI * ${speed};
  
  beginShape();
  for (let y = margin; y <= height - margin; y += 4) {
    const wave = sin((y / height) * PI * 4 + phase) * spacing * 0.4;
    vertex(x + wave, y);
  }
  endShape();
}

for (let j = 0; j < ${count}; j++) {
  const y = margin + j * spacing * (height / width);
  const phase = j * 0.4 + t * TWO_PI * ${speed} + PI;
  
  beginShape();
  for (let x = margin; x <= width - margin; x += 4) {
    const wave = sin((x / width) * PI * 4 + phase) * spacing * 0.4;
    vertex(x, y + wave);
  }
  endShape();
}
pop();
`;
}

function generateMoirePrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw * 0.5});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha * 0.6});

const cx = width / 2;
const cy = height / 2;
const maxRadius = min(width, height) * 0.5;
const rings = ${count * 2};

for (let i = 0; i < rings; i++) {
  const radius = (i / rings) * maxRadius;
  ellipse(cx, cy, radius * 2);
}

const offset = sin(t * TWO_PI * ${speed}) * 30;
for (let i = 0; i < rings; i++) {
  const radius = (i / rings) * maxRadius;
  ellipse(cx + offset, cy, radius * 2);
}
pop();
`;
}

function generateRadialLinesPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const innerRadius = min(width, height) * 0.1;
const outerRadius = min(width, height) * 0.45;

for (let i = 0; i < ${count * 3}; i++) {
  const angle = (i / ${count * 3}) * TWO_PI + t * ${speed};
  const r1 = innerRadius + noise(i * 0.2, t) * 20;
  const r2 = outerRadius - noise(i * 0.2 + 50, t) * 40;
  
  const x1 = cx + cos(angle) * r1;
  const y1 = cy + sin(angle) * r1;
  const x2 = cx + cos(angle) * r2;
  const y2 = cy + sin(angle) * r2;
  
  line(x1, y1, x2, y2);
}
pop();
`;
}

function generateConcentricSquaresPrimitive(count: number, sw: number, speed: number, color: string, alpha: number): string {
  return `
push();
rectMode(CENTER);
noFill();
strokeWeight(${sw});
stroke(red('${color}'), green('${color}'), blue('${color}'), ${alpha});

const cx = width / 2;
const cy = height / 2;
const maxSize = min(width, height) * 0.8;

for (let i = 0; i < ${count}; i++) {
  const size = maxSize * ((i + 1) / ${count});
  const rotation = (i * 0.05) + t * ${speed} * (i % 2 === 0 ? 1 : -1);
  
  push();
  translate(cx, cy);
  rotate(rotation);
  rect(0, 0, size, size);
  pop();
}
pop();
`;
}
