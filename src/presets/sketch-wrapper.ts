/**
 * Sketch Wrapper - Safety normalization for raw Code Mode sketches
 * Wraps user-provided code with aesthetic defaults and safety measures
 */

import { AESTHETIC_DEFAULTS } from '../types';

export interface SketchWrapperConfig {
  code: string;
  normalize?: boolean;
}

export function wrapSketch(config: SketchWrapperConfig): string {
  const { code, normalize = true } = config;

  if (!normalize) {
    return code;
  }

  const bgColor = `rgb(${AESTHETIC_DEFAULTS.background.r}, ${AESTHETIC_DEFAULTS.background.g}, ${AESTHETIC_DEFAULTS.background.b})`;

  const hasSetup = /function\s+setup\s*\(/.test(code);
  const hasDraw = /function\s+draw\s*\(/.test(code);

  if (hasSetup && hasDraw) {
    return injectNormalizationIntoExistingCode(code, bgColor);
  }

  if (!hasSetup && !hasDraw) {
    return wrapBareCode(code, bgColor);
  }

  return code;
}

function injectNormalizationIntoExistingCode(code: string, bgColor: string): string {
  let modified = code;

  if (!/strokeWeight\s*\(/.test(code)) {
    modified = modified.replace(
      /function\s+setup\s*\(\s*\)\s*\{/,
      `function setup() {\n  strokeWeight(${AESTHETIC_DEFAULTS.strokeWeight.default});`
    );
  }

  if (!/background\s*\(/.test(code)) {
    modified = modified.replace(
      /function\s+draw\s*\(\s*\)\s*\{/,
      `function draw() {\n  background('${bgColor}');`
    );
  }

  return modified;
}

function wrapBareCode(code: string, bgColor: string): string {
  return `
function setup() {
  strokeWeight(${AESTHETIC_DEFAULTS.strokeWeight.default});
}

function draw() {
  background('${bgColor}');
  
  ${code}
}
`;
}

export function validateSketchSafety(code: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  const dangerousPatterns = [
    { pattern: /eval\s*\(/, message: 'eval() is not allowed' },
    { pattern: /Function\s*\(/, message: 'Function constructor is not allowed' },
    { pattern: /document\s*\./, message: 'Direct DOM access is not allowed' },
    { pattern: /window\s*\./, message: 'Window access is not allowed' },
    { pattern: /import\s*\(/, message: 'Dynamic imports are not allowed' },
    { pattern: /require\s*\(/, message: 'require() is not allowed' },
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(code)) {
      warnings.push(message);
    }
  }

  if (/Math\.random\s*\(/.test(code)) {
    warnings.push('Math.random() may break determinism - use random() instead');
  }

  if (/Date\s*\(/.test(code) || /Date\.now\s*\(/.test(code)) {
    warnings.push('Date functions may break determinism - use t or frameCount instead');
  }

  return {
    safe: warnings.filter(w => !w.includes('may break')).length === 0,
    warnings,
  };
}
