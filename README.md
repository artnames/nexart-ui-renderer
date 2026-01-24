# @nexart/ui-renderer

**Version: 0.9.1**

A browser-first bounded generative renderer for safe, fast, interactive visuals.

---

## What This SDK Does

This SDK provides a **bounded execution environment** for running generative code safely in the browser. It renders p5-like sketches with built-in safety limits:

- **Resolution cap** — Max 900px dimension for performance
- **Frame/time budgets** — Prevents runaway loops
- **Observable state** — Know exactly what the runtime is doing
- **Safe degradation** — Controlled behavior when limits hit

**Output is authoritative within bounded constraints.** What you see is what the sketch produces at preview resolution with preview budgets.

---

## Standalone Use Cases

This SDK is designed for:

- **Generative art backgrounds** — Dynamic visuals for web pages
- **Interactive creative coding editors** — Live preview while users code
- **Dashboard visuals** — Procedural data visualizations
- **Mini-app visuals** — Embedded generative elements
- **Educational demos** — Safe sandbox for teaching creative coding
- **UI-embedded procedural patterns** — Decorative generative elements

For these use cases, ui-renderer is the complete solution. No other SDK required.

---

## When to Escalate to Canonical Rendering

Use `@nexart/codemode-sdk` when you need:

- **Minting / export / archival** — Permanent, verifiable output
- **Reproducibility guarantees** — Exact same output every time, anywhere
- **Full resolution parity** — 1950×2400 or higher without scaling
- **Verification workflows** — Cryptographic digest matching

**ui-renderer → codemode-sdk is an escalation, not a requirement.**

Most interactive, preview, and display use cases are complete with ui-renderer alone.

---

## Authority Model

```
┌─────────────────────────────────────────────────────────┐
│  Your Application                                       │
│  (React, Canvas, Three.js, editor, dashboard)           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  @nexart/ui-renderer                                    │
│  Bounded browser runtime                                │
│  - Resolution scaling (max 900px)                       │
│  - Frame/time budgets                                   │
│  - Observable stats                                     │
│  - Controlled degradation                               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Output                                                 │
│  - Pixels on canvas                                     │
│  - Runtime stats                                        │
│  - Budget status                                        │
│                                                         │
│  ↳ Optional: toCanonicalRequest() for codemode-sdk      │
└─────────────────────────────────────────────────────────┘
```

---

## For AI Coding Agents (Replit / Lovable / Claude Code)

### 20-Second Quickstart

```typescript
import { createPreviewRuntime } from '@nexart/ui-renderer';

const runtime = createPreviewRuntime({
  canvas: document.getElementById('canvas'),
  source: `
    function draw() {
      background(30);
      circle(width/2 + sin(t * TWO_PI) * 200, height/2, 100);
    }
  `,
  mode: 'loop',
  width: 1950,
  height: 2400,
  seed: 12345,
  vars: [50, 75, 25],
  totalFrames: 120,
  onBudgetExceeded: (info) => console.warn('Budget exceeded:', info),
});

runtime.startLoop();
```

### Detecting Runtime Mode

```typescript
const stats = runtime.getPreviewStats();

console.log('Mode:', stats.mode);           // 'preview'
console.log('Scale:', stats.scale);         // 0.46
console.log('Frames:', stats.frames);       // current frame count
console.log('Budget OK:', !stats.budgetExceeded);
```

### Handling Budget Limits

```typescript
const stats = runtime.getPreviewStats();

if (stats.budgetExceeded) {
  console.log('Reason:', stats.budgetExceeded.reason);
  // Options:
  // 1. Simplify sketch (fewer iterations)
  // 2. Increase maxFrames or maxTimeMs
  // 3. Use budgetBehavior: 'degrade' to continue with frame skipping
}
```

---

## Trust & Safety

### Budgets Prevent Runaway Code

```typescript
const runtime = createPreviewRuntime({
  canvas,
  source: sketchCode,
  mode: 'loop',
  width: 1950,
  height: 2400,
  
  maxFrames: 1800,        // Max frames before stop (default)
  maxTimeMs: 300000,      // Max 5 minutes (default)
  budgetBehavior: 'stop', // 'stop' or 'degrade'
  showOverlay: true,      // Visual indicator when stopped
  
  onBudgetExceeded: (info) => {
    // No silent failures — you always know
    console.log('Stopped:', info.reason);
  },
});
```

### Observable State

```typescript
const stats = runtime.getPreviewStats();
// {
//   mode: 'preview',
//   scale: 0.46,
//   semanticWidth: 1950,
//   semanticHeight: 2400,
//   bufferWidth: 897,
//   bufferHeight: 900,
//   frames: 150,
//   stride: 1,
//   totalTimeMs: 18750,
//   budgetExceeded?: { reason: 'frame_limit' | 'time_limit' }
// }
```

### What Can Differ vs Canonical

| Aspect | ui-renderer | codemode-sdk |
|--------|-------------|--------------|
| Resolution | Scaled to max 900px | Full resolution |
| Frame budget | 1800 frames / 5 min | Unlimited |
| Fine details | May be lost at scale | Pixel-perfect |
| Semantics | Consistent | Authoritative |

**Scaling may change fine details. Budgets may skip work. Core semantics are preserved.**

---

## Bounded Execution vs Canonical

| Aspect | Preview (this SDK) | Canonical (@nexart/codemode-sdk) |
|--------|-------------------|----------------------------------|
| **Purpose** | Fast browser visuals | Authoritative rendering |
| **Resolution** | Max 900px | Full resolution |
| **Budget** | 1800 frames / 5 min | Unlimited |
| **Determinism** | Consistent | Guaranteed |
| **Use for** | Editors, dashboards, display | Minting, export, archival |

---

## Optional: Canonical Handoff

When you need to escalate to canonical rendering:

```typescript
import { toCanonicalRequest } from '@nexart/ui-renderer';

const config = { 
  canvas, 
  source: sketchCode, 
  mode: 'loop', 
  width: 1950, 
  height: 2400, 
  seed: 12345 
};

const req = toCanonicalRequest(config);

// Pass to backend with @nexart/codemode-sdk:
// await fetch('/api/render', { body: JSON.stringify(req) });
```

---

## Install

```bash
npm install @nexart/ui-renderer
```

Or use directly:
```html
<script type="module">
  import { createPreviewRuntime } from 'https://unpkg.com/@nexart/ui-renderer/dist/index.js';
</script>
```

---

## API Reference

### `createPreviewRuntime(config)` — Recommended

Create a bounded preview renderer.

```typescript
const runtime = createPreviewRuntime({
  canvas: HTMLCanvasElement,
  source: string,              // p5-like sketch code
  mode: 'static' | 'loop',
  width: number,
  height: number,
  seed?: number,
  vars?: number[],             // VAR[0..9] (0-100 range)
  totalFrames?: number,        // For loop mode (default: 120)
  
  // Budget options
  onBudgetExceeded?: (info: BudgetExceededInfo) => void,
  budgetBehavior?: 'stop' | 'degrade',
  showOverlay?: boolean,
  maxFrames?: number,
  maxTimeMs?: number,
});

runtime.startLoop();           // Start animation
runtime.stopLoop();            // Stop animation
runtime.renderStatic();        // Render single frame
runtime.getPreviewStats();     // Get current stats
runtime.previewScale;          // Canvas scale factor
runtime.destroy();             // Clean up
```

### `toCanonicalRequest(config)`

Generate a handoff object for `@nexart/codemode-sdk`:

```typescript
const req = toCanonicalRequest(config);
// { seed, vars, code, settings, renderer: 'preview', uiRendererVersion }
```

### `getCapabilities()`

Discover SDK capabilities:

```typescript
const caps = getCapabilities();
// { version, isCanonical, previewBudget, canvasLimits, ... }
```

---

## Troubleshooting

### "My sketch stops animating"

Check `getPreviewStats().budgetExceeded`:

```typescript
const stats = runtime.getPreviewStats();
if (stats.budgetExceeded) {
  console.log('Stopped because:', stats.budgetExceeded.reason);
}
```

**Solutions:**
1. Reduce sketch complexity
2. Increase budget: `maxFrames: 3600` or `maxTimeMs: 600000`
3. Use `budgetBehavior: 'degrade'` to continue with frame skipping

### "Canvas is too small"

Preview scales to max 900px for performance:

```typescript
const stats = runtime.getPreviewStats();
console.log('Buffer:', stats.bufferWidth, 'x', stats.bufferHeight);
console.log('Semantic:', stats.semanticWidth, 'x', stats.semanticHeight);
```

Your sketch code sees original `width`/`height`. Canvas buffer is scaled.

### "Animation looks choppy"

1. Check if in degraded mode (skipping frames)
2. Reduce sketch complexity
3. Check browser performance

---

## Available Helpers

All standard p5-like functions included:

| Helper | Description |
|--------|-------------|
| `int(n)` | Convert to integer |
| `fract(n)` | Fractional part |
| `vec(x, y)` | Create 2D vector |
| `polygon(x, y, r, n)` | Draw n-sided polygon |
| `star(x, y, r1, r2, n)` | Draw n-pointed star |
| `fbm(x, y, z, octaves)` | Fractal Brownian motion |
| `easeIn(t)`, `easeOut(t)` | Easing functions |

---

## Legacy API

Still supported for backward compatibility:

```typescript
import { createSystem, previewSystem } from '@nexart/ui-renderer';

const system = createSystem({
  type: 'code',
  mode: 'loop',
  width: 1950,
  height: 2400,
  source: sketchCode,
  seed: 12345,
});

const renderer = previewSystem(system, canvas);
renderer.start();
```

---

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## License

MIT License — Copyright (c) 2024-2026 NexArt
