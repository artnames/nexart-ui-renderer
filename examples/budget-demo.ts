/**
 * @nexart/ui-renderer - Budget Demo Example
 * 
 * Demonstrates budget exceed handling with callbacks and overlay.
 * 
 * Run with: npm run example:budget
 * 
 * Note: This example is designed for browser environments.
 * In Node.js, it will print the expected usage pattern.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║  @nexart/ui-renderer - Budget Demo Example                               ║
╚══════════════════════════════════════════════════════════════════════════╝

This example shows how to handle budget exceeded events.

BROWSER CODE (with 'stop' behavior):
─────────────────────────────────────────────────────────────────────────────

import { createPreviewRuntime } from '@nexart/ui-renderer';

const canvas = document.getElementById('preview-canvas');

// Heavy sketch that will exceed budget quickly
const heavySketch = \`
  function draw() {
    background(30);
    for (var i = 0; i < 10000; i++) {
      var x = random(width);
      var y = random(height);
      stroke(random(255), random(255), random(255), 50);
      point(x, y);
    }
  }
\`;

const runtime = createPreviewRuntime({
  canvas,
  source: heavySketch,
  mode: 'loop',
  width: 1950,
  height: 2400,
  
  // Budget configuration
  maxFrames: 100,        // Low frame limit for demo
  maxTimeMs: 10000,      // 10 second time limit
  budgetBehavior: 'stop', // 'stop' or 'degrade'
  showOverlay: true,     // Show overlay when stopped
  
  // Callback when budget is exceeded
  onBudgetExceeded: (info) => {
    console.log('⚠️ Budget exceeded!');
    console.log('  Reason:', info.reason);
    console.log('  Frames rendered:', info.framesRendered);
    console.log('  Total time:', Math.round(info.totalTimeMs) + 'ms');
    console.log('  Scale:', info.scale.toFixed(2));
    console.log('  Stride:', info.stride);
  },
});

runtime.startLoop();

─────────────────────────────────────────────────────────────────────────────

BROWSER CODE (with 'degrade' behavior):
─────────────────────────────────────────────────────────────────────────────

const runtime = createPreviewRuntime({
  canvas,
  source: heavySketch,
  mode: 'loop',
  width: 1950,
  height: 2400,
  
  budgetBehavior: 'degrade',  // Continue running but skip frames
  maxFrames: 100,
  
  onBudgetExceeded: (info) => {
    console.log('Budget exceeded, now skipping every 2nd frame');
    // Preview continues but at reduced frame rate
  },
});

─────────────────────────────────────────────────────────────────────────────

CHECKING STATS:
─────────────────────────────────────────────────────────────────────────────

const stats = runtime.getPreviewStats();

if (stats.budgetExceeded) {
  console.log('Preview was stopped due to:', stats.budgetExceeded.reason);
  
  // Options:
  // 1. Reduce sketch complexity
  // 2. Increase budget limits
  // 3. Use @nexart/codemode-sdk for canonical execution
}

─────────────────────────────────────────────────────────────────────────────

HANDOFF TO CANONICAL:
─────────────────────────────────────────────────────────────────────────────

import { toCanonicalRequest } from '@nexart/ui-renderer';

const config = {
  canvas,
  source: sketchCode,
  mode: 'loop',
  width: 1950,
  height: 2400,
  seed: 12345,
  vars: [50, 75, 25],
};

// Get canonical request for @nexart/codemode-sdk
const canonicalReq = toCanonicalRequest(config);
console.log('Canonical request:', canonicalReq);
// {
//   seed: 12345,
//   vars: [50, 75, 25],
//   code: "...",
//   settings: { width: 1950, height: 2400, mode: 'loop' },
//   renderer: 'preview',
//   uiRendererVersion: '0.9.0'
// }

// Pass to backend or use @nexart/codemode-sdk directly:
// import { createRuntime } from '@nexart/codemode-sdk';
// const runtime = createRuntime({ seed, vars, mode });

─────────────────────────────────────────────────────────────────────────────
`);

// Demonstrate API shape (Node.js compatible)
import { SDK_VERSION, PREVIEW_BUDGET, toCanonicalRequest, type PreviewEngineConfig } from '../src/index';

console.log('Budget Configuration:');
console.log('  Max Frames:', PREVIEW_BUDGET.MAX_FRAMES);
console.log('  Max Time:', PREVIEW_BUDGET.MAX_TOTAL_TIME_MS / 1000 + 's');
console.log('  Degrade Stride:', PREVIEW_BUDGET.DEGRADE_STRIDE);

console.log('');
console.log('toCanonicalRequest example output:');

const mockConfig = {
  canvas: null as any,
  source: 'function draw() { circle(100, 100, 50); }',
  mode: 'loop' as const,
  width: 1950,
  height: 2400,
  seed: 12345,
  vars: [50, 75, 25],
  totalFrames: 120,
};

const canonical = toCanonicalRequest(mockConfig);
console.log(JSON.stringify(canonical, null, 2));
