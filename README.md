# @nexart/ui-renderer

Version: 0.8.2

**Lightweight Preview Runtime for NexArt Protocol**

---

> **This SDK is a PREVIEW RENDERER, not an authority.**
>
> It provides fast, lightweight previews for development and prototyping.
>
> It is:
> - **NOT canonical** — Does not produce archival-quality output
> - **NOT archival** — Not for minting, export, or permanent storage
> - **NOT protocol-enforcing** — No validation errors, no pattern checking
>
> For canonical output, minting, or validation: use `@nexart/codemode-sdk`

---

## v0.8.2 — Runtime Dimensions Fix

Fixed critical bug where preview scaling affected `width`/`height` inside sketches.

- **Runtime uses original dimensions**: `width` and `height` now match Code Mode exactly
- **Canvas buffer still scaled for performance**: Rendering is fast, semantics are correct
- **Loop animations work correctly**: Geometry math and timing no longer break

**Key rule enforced:** Preview scaling is a rendering concern, not a semantic one.

---

## v0.8.1 — Canvas Scaling Fix

Fixed canvas zoom/cropping bug caused by resolution downscaling in v0.8.0.

- **Scale Transform Reapplied**: Context scale is now properly restored after canvas resize
- **Transform-Safe Clear**: `clearRect` now ignores active transforms for correct full-canvas clearing
- **No API Changes**: All fixes are internal

---

## v0.8.0 — Lightweight Preview Runtime

This release refactors the UI renderer into a performance-optimized preview runtime.

### Philosophy Change

**The UI renderer is explicitly preview-only:**
- No protocol errors thrown
- No forbidden pattern checking
- Soft warnings instead of hard failures
- Permissive — clamping instead of rejecting

### Preview Budget (MANDATORY)

The runtime enforces hard limits to prevent browser freezes:

```typescript
PREVIEW_BUDGET = {
  MAX_FRAMES: 30,           // Maximum frames before auto-stop
  MAX_TOTAL_TIME_MS: 500,   // Maximum execution time
  FRAME_STRIDE: 3,          // Render every 3rd frame
};
```

If limits exceeded: rendering stops silently (no throw).

### Canvas Scaling

Preview renderer scales large canvases automatically:

```typescript
CANVAS_LIMITS = {
  MAX_DIMENSION: 900,  // Max width/height in pixels
  MIN_DIMENSION: 100,
};
```

Aspect ratio is preserved. CSS scaling for display.

### Runtime Mode Flag

The preview runtime exposes a `mode` property:

```typescript
runtime.mode // 'preview'
```

Use this to detect preview vs canonical rendering.

---

## Install

```bash
npm install @nexart/ui-renderer
```

Or use directly in HTML:
```html
<script type="module">
  import { createSystem, previewSystem } from 'https://unpkg.com/@nexart/ui-renderer/dist/index.js';
</script>
```

---

## Quick Start

### Code Mode Preview

```typescript
import { createSystem, previewSystem } from '@nexart/ui-renderer';

const system = createSystem({
  type: 'code',
  mode: 'loop',
  width: 1950,
  height: 2400,
  totalFrames: 120,
  seed: 12345,
  vars: [50, 75, 25],  // VAR[0..9] — values 0-100, padded with zeros
  source: `
    function setup() {
      noFill();
      stroke(0);
    }
    function draw() {
      background(246, 245, 242);
      var count = int(map(VAR[0], 0, 100, 5, 30));
      for (var i = 0; i < count; i++) {
        var x = width / 2 + cos(t * TWO_PI + i * 0.5) * map(VAR[1], 0, 100, 50, 400);
        var y = height / 2 + sin(t * TWO_PI + i * 0.3) * 200;
        ellipse(x, y, 50);
      }
    }
  `
});

const canvas = document.getElementById('canvas');
const renderer = previewSystem(system, canvas);
renderer.start();
```

### Static Mode (single frame)

```typescript
const staticSystem = createSystem({
  type: 'code',
  mode: 'static',
  width: 1950,
  height: 2400,
  seed: 12345,
  vars: [50, 50, 50],
  source: `
    function setup() {
      background(246, 245, 242);
      fill(0);
      var count = int(map(VAR[0], 0, 100, 10, 200));
      for (var i = 0; i < count; i++) {
        ellipse(random(width), random(height), random(10, 50));
      }
    }
  `
});

previewSystem(staticSystem, canvas).render();
```

---

## API Reference

### `createSystem(input)`

Create a NexArt system for preview.

```typescript
const system = createSystem({
  type: 'code',
  mode: 'static' | 'loop',
  width: number,
  height: number,
  source: string,           // Raw p5-like sketch code
  seed?: number,            // PRNG seed
  totalFrames?: number,     // Required for loop mode
  vars?: number[]           // VAR[0..9] (0-10 values, 0-100 range, clamped)
});
```

### `previewSystem(system, canvas, options?)`

Render a preview to canvas.

```typescript
const renderer = previewSystem(system, canvas, {
  showBadge: boolean  // default: true — shows "⚠️ Preview" badge
});

renderer.render();  // Single frame
renderer.start();   // Start loop
renderer.stop();    // Stop loop
renderer.destroy(); // Cleanup
```

### `validateSystem(input)`

Soft validation — warns but doesn't throw for minor issues.

```typescript
const result = validateSystem(input);
if (!result.valid) {
  console.log(result.errors);  // Structural issues only
}
```

### `getCapabilities()`

Discover SDK capabilities for AI and tooling.

```typescript
import { getCapabilities } from '@nexart/ui-renderer';

const caps = getCapabilities();
// {
//   version: '0.8.2',
//   isCanonical: false,
//   isArchival: false,
//   previewBudget: { MAX_FRAMES: 30, MAX_TOTAL_TIME_MS: 500, FRAME_STRIDE: 3 },
//   canvasLimits: { MAX_DIMENSION: 900 },
//   ...
// }
```

---

## Available Helpers

The preview runtime includes all standard p5-like functions plus:

| Helper | Description |
|--------|-------------|
| `int(n)` | Convert to integer (Math.floor) |
| `fract(n)` | Fractional part of number |
| `sign(n)` | Sign of number |
| `vec(x, y)` | Create 2D vector |
| `polygon(x, y, r, n)` | Draw n-sided polygon |
| `star(x, y, r1, r2, n)` | Draw n-pointed star |
| `fbm(x, y, z, octaves)` | Fractal Brownian motion |
| `easeIn(t)`, `easeOut(t)`, etc. | Easing functions |

### Control Functions

| Function | Preview Behavior |
|----------|------------------|
| `noLoop()` | Stops preview loop (soft control) |
| `loop()` | No-op in preview |

---

## Supported Element Types

### `background`

Opinionated presets with guardrails.

```typescript
{
  type: 'background',
  style: 'gradient',  // gradient, solid, noise, grain
  palette: 'warm'     // warm, cool, neutral, vibrant
}
```

### `primitive`

Declarative generative components. **30 primitives available:**

**Categories:**
- `basic` — dots, lines, waves, stripes, circles, grid
- `geometric` — polygons, diamonds, hexgrid, stars, concentricSquares
- `radial` — spirals, rays, orbits, rings, arcs, radialLines, petals
- `flow` — flow, particles, bubbles
- `patterns` — crosshatch, chevrons, zigzag, weave, moire
- `organic` — curves, noise, mesh, branches

```typescript
{
  type: 'primitive',
  name: 'spirals',
  count: 12,
  color: '#ffffff',
  motion: 'medium',
  strokeWeight: 'thin',
  opacity: 0.8
}
```

### `sketch`

Raw Code Mode execution.

```typescript
{
  type: 'sketch',
  code: `
    function setup() { background(0); }
    function draw() { ellipse(width/2, height/2, 100); }
  `,
  normalize: true
}
```

---

## VAR Handling (Soft)

VAR[0..9] is an array of 10 protocol variables.

**Preview behavior (permissive):**
- Input: 0-10 elements accepted (extras ignored with warning)
- Values: Clamped to 0-100 (not rejected)
- Invalid types: Replaced with 0 (not rejected)
- Runtime: Always 10 elements (padded with zeros)
- Access: Read-only

```typescript
// Works in preview (clamped to 100)
vars: [150, 50, 50]  // VAR[0] becomes 100

// Works in preview (non-numbers become 0)  
vars: ['bad', 50, 50]  // VAR[0] becomes 0

// Works in preview (extras ignored)
vars: [1,2,3,4,5,6,7,8,9,10,11,12]  // Uses first 10
```

For strict validation, use `@nexart/codemode-sdk`.

---

## What This SDK Does NOT Do

| Not Done | Explanation |
|----------|-------------|
| Protocol enforcement | No pattern checking or validation errors |
| Canonical output | Use @nexart/codemode-sdk for minting |
| Determinism guarantee | Preview may vary slightly |
| Full frame count | Limited to 30 frames max |
| Full resolution | Limited to 900px max dimension |

---

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## License

MIT License

Copyright (c) 2024-2026 NexArt
