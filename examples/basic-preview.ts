/**
 * @nexart/ui-renderer - Basic Preview Example
 * 
 * Demonstrates basic usage of createPreviewRuntime with stats logging.
 * 
 * Run with: npm run example:basic
 * 
 * Note: This example is designed for browser environments.
 * In Node.js, it will print the expected usage pattern.
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║  @nexart/ui-renderer - Basic Preview Example                             ║
╚══════════════════════════════════════════════════════════════════════════╝

This example shows how to use createPreviewRuntime in a browser environment.

BROWSER CODE:
─────────────────────────────────────────────────────────────────────────────

import { createPreviewRuntime } from '@nexart/ui-renderer';

// Create a canvas element
const canvas = document.getElementById('preview-canvas');

// Create the preview runtime
const runtime = createPreviewRuntime({
  canvas,
  source: \`
    function setup() {
      noFill();
      stroke(0);
    }
    function draw() {
      background(246, 245, 242);
      var count = int(map(VAR[0], 0, 100, 5, 30));
      for (var i = 0; i < count; i++) {
        var x = width / 2 + cos(t * TWO_PI + i * 0.5) * 300;
        var y = height / 2 + sin(t * TWO_PI + i * 0.3) * 200;
        ellipse(x, y, 50);
      }
    }
  \`,
  mode: 'loop',
  width: 1950,
  height: 2400,
  seed: 12345,
  vars: [50, 75, 25],
  totalFrames: 120,
});

// Start the animation
runtime.startLoop();

// Log stats every second
setInterval(() => {
  const stats = runtime.getPreviewStats();
  console.log('Preview Stats:', {
    mode: stats.mode,
    scale: stats.scale.toFixed(2),
    frames: stats.frames,
    stride: stats.stride,
    totalTimeMs: Math.round(stats.totalTimeMs),
    budgetExceeded: stats.budgetExceeded ?? 'no',
  });
}, 1000);

// Stop after 10 seconds
setTimeout(() => {
  runtime.stopLoop();
  console.log('Preview stopped');
}, 10000);

─────────────────────────────────────────────────────────────────────────────

KEY POINTS:
- Use createPreviewRuntime (recommended) or createPreviewEngine
- mode: 'loop' for animations, 'static' for single frame
- Check getPreviewStats() to monitor budget and performance
- Preview is NOT canonical — use @nexart/codemode-sdk for minting
`);

// Demonstrate API shape (Node.js compatible)
import { SDK_VERSION, PREVIEW_BUDGET, CANVAS_LIMITS } from '../src/index';

console.log('SDK Configuration:');
console.log('  Version:', SDK_VERSION);
console.log('  FPS: Native RAF (~60 FPS)');
console.log('  Max Dimension:', CANVAS_LIMITS.MAX_DIMENSION + 'px');
console.log('  Max Frames:', PREVIEW_BUDGET.MAX_FRAMES);
console.log('  Max Time:', PREVIEW_BUDGET.MAX_TOTAL_TIME_MS / 1000 + 's');
