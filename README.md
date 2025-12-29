# @nexart/ui-renderer

Version: 0.3.1

**Declarative System Authoring SDK for NexArt Protocol**

---

> ⚠️ **IMPORTANT DISCLAIMER**
>
> **This SDK is for authoring and preview only.**
>
> This SDK is:
> - **NOT canonical** — Does not produce archival-quality output
> - **NOT archival** — Not suitable for NFT minting
> - **NOT protocol-authoritative** — Best-effort rendering only
>
> Same system → same preview output within this SDK, but **preview ≠ mint truth**.

---

## Protocol Alignment

This SDK **mirrors** NexArt's protocol-enforced production runtime behavior without being the canonical source of truth.

| Aspect | SDK Behavior |
|--------|--------------|
| **Determinism** | Seeded PRNG produces same output for same seed |
| **System Model** | Matches protocol schema (background, elements, motion) |
| **Rendering** | Canvas2D approximation of production behavior |
| **Authority** | Preview only — NOT canonical |

### Supported Element Types

| Type | Description |
|------|-------------|
| `background` | Opinionated presets with guardrails (color, texture, gradient) |
| `primitive` | Declarative generative components (dots, lines, waves, grid, flowField, orbits) |
| `sketch` | Raw Code Mode execution (sandboxed p5.js-style API) |

### Enforcement Disclaimer

SoundArt, Noise, and Shapes creation modes are **protocol-enforced** via the Code Mode runtime. This SDK provides preview approximation only — canonical output is produced server-side.

---

## What This SDK Does NOT Guarantee

- **Canonical output** — Use server-side rendering for minting
- **Archival quality** — Preview only, not production-grade
- **Cross-version stability** — SDK may change between versions
- **Frame-perfect matching** — Approximation of production behavior

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

### 1. Create a System

```typescript
import { createSystem } from '@nexart/ui-renderer';

const system = createSystem({
  seed: 29445825,
  background: {
    color: 'blue',
    texture: 'noise'
  },
  elements: [
    {
      type: 'waves',
      axis: 'x',
      amplitude: 0.4,
      frequency: 0.7
    },
    {
      type: 'dots',
      distribution: 'radial',
      count: 400,
      size: [1, 4]
    }
  ],
  motion: {
    source: 'time',
    speed: 0.2
  }
});
```

### 2. Preview the System

```typescript
import { previewSystem } from '@nexart/ui-renderer';

const canvas = document.getElementById('canvas');
const renderer = previewSystem(system, canvas, { mode: 'loop' });

renderer.start();
```

### 3. Compile for Protocol

```typescript
import { compileSystem } from '@nexart/ui-renderer';

const compiled = compileSystem(system);
console.log(JSON.stringify(compiled, null, 2));
```

---

## API Reference

### `createSystem(input)`

Create a validated NexArt system.

```typescript
const system = createSystem({
  version?: string,        // Protocol version (default: '0.3')
  seed: number,            // Required: PRNG seed
  background: {
    color: string,         // Required: background color
    texture?: 'none' | 'noise' | 'grain',
    gradient?: {
      type: 'linear' | 'radial',
      colors: string[],
      angle?: number
    }
  },
  elements: SystemElement[], // Required: array of primitives
  motion?: {
    source: 'none' | 'time' | 'seed',
    speed?: number
  }
});
```

### `previewSystem(system, canvas, options?)`

Render a visual preview.

```typescript
const renderer = previewSystem(system, canvas, {
  mode: 'static' | 'loop',  // default: 'static'
  showBadge: boolean        // default: true
});

renderer.render();  // Single frame
renderer.start();   // Animation loop
renderer.stop();    // Stop loop
renderer.destroy(); // Cleanup
```

### `compileSystem(system)`

Compile to protocol-compatible JSON.

```typescript
const compiled = compileSystem(system);
// {
//   protocol: 'nexart',
//   systemVersion: '0.3',
//   seed: 29445825,
//   background: {...},
//   elements: [...],
//   motion: {...},
//   deterministic: true,
//   compiledAt: '2024-12-29T...',
//   compilerVersion: '0.3.1'
// }
```

### `validateSystem(input)`

Validate system input without creating.

```typescript
const result = validateSystem(input);
if (!result.valid) {
  console.error(result.errors);
}
```

### `getCapabilities()`

Discover SDK capabilities — critical for AI tools and builders.

```typescript
import { getCapabilities } from '@nexart/ui-renderer';

const caps = getCapabilities();
// {
//   version: '0.3.1',
//   isCanonical: false,
//   isArchival: false,
//   renderer: '@nexart/ui-renderer',
//   primitives: [...],     // Available element types with parameters
//   background: {...},     // Background options
//   motion: {...},         // Motion sources and speed
//   limits: {...}          // Max values for safety
// }
```

Use this to:
- Prevent AI hallucination of non-existent primitives
- Validate parameter ranges before system creation
- Build dynamic UIs that adapt to SDK capabilities

---

## Primitive Vocabulary (v0.3)

### Elements

| Type | Properties |
|------|------------|
| `dots` | distribution, count, size, color, opacity |
| `lines` | direction, count, thickness, color, opacity |
| `waves` | axis, amplitude, frequency, count, color, opacity |
| `grid` | rows, cols, cellSize, shape, color, opacity |
| `flowField` | resolution, strength, particles, color, opacity |
| `orbits` | count, radius, dotCount, speed, color, opacity |

### Background

| Property | Options |
|----------|---------|
| color | Any CSS color or name |
| texture | `none`, `noise`, `grain` |
| gradient | `{ type, colors, angle? }` |

### Motion

| Source | Behavior |
|--------|----------|
| `none` | Static image |
| `time` | Animate based on elapsed time |
| `seed` | Static per seed |

---

## For AI Platforms

This SDK is designed for AI code generation. Use `getCapabilities()` first:

```typescript
import { getCapabilities, createSystem, previewSystem } from '@nexart/ui-renderer';

// 1. Check what's available (prevents hallucination)
const caps = getCapabilities();
console.log(caps.primitives.map(p => p.type));
// ['dots', 'lines', 'waves', 'grid', 'flowField', 'orbits']

// 2. Create system using only valid primitives
const system = createSystem({
  seed: Date.now(),
  background: { color: 'blue' },
  elements: [
    { type: 'waves', axis: 'x', amplitude: 0.5, frequency: 1 }
  ]
});

// 3. Preview
previewSystem(system, canvas).render();
```

**AI Prompt Example:**
```
"Create a blue background with flowing waves using NexArt"
```

The finite vocabulary prevents invalid systems and ensures protocol alignment.

**Key AI Integration Points:**
- `getCapabilities()` — Discover what's possible
- `validateSystem()` — Check before creating
- `compileSystem()` — Export protocol JSON

---

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

No polyfills required.

---

## License

MIT License

Copyright (c) 2024 NexArt

---

> **Reminder:** This SDK authors systems and provides preview rendering.
> It is NOT canonical — use server-side rendering for production/minting.
