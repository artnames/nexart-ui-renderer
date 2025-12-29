# @nexart/ui-renderer

## Overview

This is a browser-first SDK for authoring and previewing generative art systems for the NexArt Protocol. The SDK provides a declarative API to define visual systems, preview them in real-time, and compile them to protocol-compatible JSON.

**Critical distinction**: This SDK is explicitly non-canonical and non-archival. It exists for authoring, experimentation, and preview purposes only. Canonical, mint-ready output is produced exclusively by the separate `@nexart/codemode-sdk` package (Node.js, server-side).

The SDK enables:
- Declarative system authoring via `createSystem()`
- Real-time browser preview via `previewSystem()`
- Protocol JSON compilation via `compileSystem()`
- Capability discovery for AI tools and builders

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Package Structure
- **TypeScript ESM Module**: Compiled to ES2020 with ESNext modules for modern browser compatibility
- **Entry Point**: `src/index.ts` exports all public APIs
- **Output**: `dist/` folder with `.js` and `.d.ts` files

### Core Modules

1. **System Layer** (`src/system.ts`)
   - `createSystem()`: Constructs validated NexArt system objects
   - `validateSystem()`: Validates system configurations against protocol rules
   - Enforces finite, declarative primitives (no arbitrary canvas code)

2. **Compiler Layer** (`src/compiler.ts`)
   - `compileSystem()`: Produces protocol-compatible JSON
   - `serializeSystem()`: Serializes for transport/storage
   - Ensures output matches canonical schema shape

3. **Preview Renderer** (`src/preview/renderer.ts`)
   - Canvas2D-based visual approximation
   - Seeded PRNG for deterministic preview
   - Animation loop support with time parameter `t`

4. **Primitive Renderers** (`src/preview/primitives/`)
   - Individual renderers for each element type: dots, lines, waves, grid, flow fields, orbits
   - Each primitive is self-contained and receives standardized parameters

5. **Capabilities API** (`src/capabilities.ts`)
   - Machine-readable schema of supported primitives
   - Designed for AI tool integration to prevent hallucination of unsupported features

### Design Decisions

**Declarative-Only Architecture**
- Problem: Prevent users from injecting arbitrary canvas code that bypasses protocol rules
- Solution: Only expose structured primitives (dots, lines, waves, grid, flowField, orbits)
- Tradeoff: Less flexibility, but guarantees protocol compliance

**Seeded PRNG**
- Problem: Preview must be reproducible given the same seed
- Solution: Custom mulberry32-style PRNG initialized from system seed
- Benefit: Same seed produces same preview output

**Non-Canonical Labeling**
- Every system carries `isCanonical: false` and `isArchival: false` flags
- Compiled output includes `deterministic: true` but is explicitly marked as preview-only

### Supported Primitives

| Type | Purpose |
|------|---------|
| `dots` | Point distributions (random, radial, grid, spiral) |
| `lines` | Directional lines (horizontal, vertical, diagonal, radial) |
| `waves` | Sinusoidal wave patterns on x or y axis |
| `grid` | Regular cell grids with shapes (circle, square, diamond) |
| `flowField` | Particle traces following noise-based vector fields |
| `orbits` | Circular orbital dot patterns |

### Background Configuration
- Solid colors
- Gradients (linear, radial)
- Textures (noise, grain)

### Motion Sources
- `none`: Static render
- `time`: Animation based on frame time
- `seed`: Variation based on seed only

## External Dependencies

### Runtime Dependencies
None. This is a zero-dependency SDK designed for maximum portability.

### Development Dependencies
- **TypeScript 5.x**: Type definitions and compilation only

### Build Configuration
- Module: ESNext with Bundler resolution (Vite/Rollup compatible)
- Target: ES2020 for broad browser support
- Outputs: `.js` + `.d.ts` declaration files

### Distribution
- Published to npm as `@nexart/ui-renderer`
- Also available via unpkg CDN for direct browser imports
- ESM-only (no CommonJS build)

### Related Packages (Not in this repo)
- `@nexart/codemode-sdk`: Canonical server-side renderer (Node.js only, separate package)