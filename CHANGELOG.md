# Changelog

All notable changes to @nexart/ui-renderer will be documented in this file.

---

## [0.9.1] — 2026-01-24

### Changed — Documentation & Positioning

**Non-Breaking, Metadata-Only Release**

This release repositions ui-renderer as a standalone, browser-first generative renderer — not merely a companion to codemode-sdk.

#### Documentation Reframed
- **Standalone positioning** — SDK is now described as "browser-first bounded generative renderer"
- **Removed "non-canonical" framing** — Replaced with "authoritative within bounded constraints"
- **Added "Standalone use cases"** — Backgrounds, editors, dashboards, mini-apps, education
- **Added "When to escalate"** — Minting, export, archival, verification
- **Added "Authority model" diagram** — Clear visual of where this SDK fits
- **Added "Trust & safety"** — Budgets, observability, what can differ
- **Moved codemode-sdk references** — Now in escalation section, not primary framing

#### Metadata Updates
- **Description**: "Browser-first bounded generative renderer for safe, fast, interactive visuals"
- **Keywords**: generative, renderer, canvas, creative-coding, preview, sandbox, bounded, runtime, miniapp
- **Homepage**: Added to package.json

### Unchanged

- No changes to runtime behavior
- No changes to APIs or exports
- No changes to budget defaults
- No changes to canvas scaling
- Full backward compatibility with v0.9.0 and v0.8.x

---

## [0.9.0] — 2026-01-24

### Added

- **Budget exceed callbacks**: `onBudgetExceeded` callback fires when frame or time limits are reached
- **Budget overlay**: Optional overlay displayed when preview stops due to budget (default: true for 'stop' behavior)
- **Budget behavior options**: `budgetBehavior: 'stop' | 'degrade'` — stop with overlay or continue with frame skipping
- **getPreviewStats()**: Full observability into runtime state (mode, scale, frames, stride, time, budgetExceeded)
- **previewScale**: Public readonly property exposing current canvas scale factor
- **createPreviewRuntime()**: New recommended entrypoint (alias for createPreviewEngine)
- **toCanonicalRequest()**: Helper for handoff to @nexart/codemode-sdk

### Changed

- **No more silent stops**: Budget exceeded now triggers callbacks + console warning instead of silent termination
- **Default budget limits**: MAX_FRAMES: 1800 (~30 min at ~60 FPS), MAX_TOTAL_TIME_MS: 300000 (5 min)
- **Animation remains smooth**: Native RAF cadence (~60 FPS) preserved from v0.8.8 — no FPS throttle
- **README rewritten**: Agent-first documentation with 20-second quickstart, troubleshooting section
- **Version synced**: package.json, index.ts, README.md all show 0.9.0

### Added Types

- `PreviewStats` — Runtime stats object
- `BudgetExceededInfo` — Callback info ({ reason, framesRendered, totalTimeMs, stride, scale })
- `BudgetExceedReason` — 'frame_limit' | 'time_limit'
- `BudgetBehavior` — 'stop' | 'degrade'
- `CanonicalRequest` — Handoff object for codemode-sdk

### Examples

- `examples/basic-preview.ts` — Basic usage with stats logging
- `examples/budget-demo.ts` — Budget handling demonstration

### Migration

No breaking changes. All v0.8.x exports are preserved.

New recommended pattern:
```typescript
// Old (still works)
import { createPreviewEngine } from '@nexart/ui-renderer';

// New (recommended)
import { createPreviewRuntime } from '@nexart/ui-renderer';
```

---

## [0.8.8] — 2026-01-04

### Changed

- **REMOVED FPS THROTTLE**: Animation now renders at native browser refresh rate (~60 FPS)
- Matches smooth rendering experience of main NexArt app
- No more 8 FPS stuttering for loop animations

### Why

The 8 FPS throttle (added in v0.8.6) caused poor UX with stuttery animations, while the main NexArt app renders smoothly using native `requestAnimationFrame`. Since the UI renderer's only job is to display sketches on canvas, it should render at the browser's natural frame rate.

### Breaking Changes

None. API remains identical.

### Technical Details

Removed:
- `shouldRenderFrame(throttle)` check in animation loop
- `recordFrame(throttle)` call after draw
- FPS throttle imports and initialization

Now uses native `requestAnimationFrame` without artificial frame rate limiting.

---

## [0.8.7] — 2026-01-03

### Fixed

- **CRITICAL**: Time-varying properties (`frameCount`, `t`, `time`, `tGlobal`, `totalFrames`) were frozen in loop mode
- Animations now render correctly with live values updating every frame

### Root Cause

The previous implementation used `new Function(...Object.keys(runtime), source)(...Object.values(runtime))`,
which captured primitive values BY VALUE at compile time. Updates to `runtime.frameCount` in the 
animation loop were invisible to the sketch because it held frozen copies.

### Solution

Replaced the parameter-spreading approach with a Proxy + `with()` pattern:
1. Static properties (functions, constants) are cached once
2. Time-varying properties read from the live runtime object via Proxy get trap
3. `with(__scope)` enables bare-name access without changing sketch syntax
4. `has()` trap returns true ONLY for known keys, allowing globals (Math, window) to fall through

**Animation Semantics:**
```javascript
function draw() {
  // These values update every frame:
  // - frameCount: 1, 2, 3, ...
  // - t: (frameCount % totalFrames) / totalFrames
  // - time, tGlobal: aliases for t
  circle(width/2 + sin(frameCount * 0.1) * 300, height/2, 120);
}
```

---

## [0.8.6] — 2026-01-03 (SUPERSEDED)

### Note: FPS throttle worked but time variables were still frozen. See v0.8.7.

---

## [0.8.5] — 2026-01-03 (SUPERSEDED)

### Note: Budget approach was still problematic.

---

## [0.8.4] — 2026-01-03 (SUPERSEDED)

### Note: This version had incorrect reset semantics.

---

## [0.8.3] — 2026-01-03

### Fixed

- Fixed critical bug where preview only rendered a single frame
- Animation loop now runs continuously with invisible performance throttling
- Budget exhaustion no longer terminates the render loop

### Details

The render loop conditionally scheduled `requestAnimationFrame`, causing the animation
to terminate after the first frame or after budget reset.

**Before (broken):**
```typescript
const loop = () => {
  if (!canRenderFrame(budget)) {
    isRunning = false;
    return;  // Loop terminates — RAF never scheduled
  }
  draw();
  animationId = requestAnimationFrame(loop);  // Conditional — WRONG!
};
```

**After (fixed):**
```typescript
const loop = () => {
  animationId = requestAnimationFrame(loop);  // ALWAYS scheduled first

  if (!canRenderFrame(budget)) {
    return;  // Skip draw, but loop continues
  }
  draw();
};
```

**Animation Loop Invariant (locked for v0.x):**
- `requestAnimationFrame(loop)` MUST be called on every tick
- Budget gates ONLY whether `draw()` executes, NOT whether loop runs
- Never return before scheduling RAF. Never conditionally schedule.

---

## [0.8.2] — 2026-01-03

### Fixed

- Fixed critical bug where preview scaling affected `width`/`height` inside sketches
- Runtime now uses original (protocol) dimensions for width/height semantics
- Loop animations and geometry math now work correctly

### Details

The v0.8.0–v0.8.1 releases passed scaled dimensions to the preview runtime, which broke
sketch semantics. When a 1950×2400 canvas was downscaled to 900px for performance:

**Before (broken):**
```typescript
// width = 675, height = 900 (scaled — WRONG!)
createPreviewRuntime(canvas, scaled.renderWidth, scaled.renderHeight, seed);
```

**After (fixed):**
```typescript
// width = 1950, height = 2400 (original — CORRECT!)
createPreviewRuntime(canvas, scaled.originalWidth, scaled.originalHeight, seed);
```

**Key rule enforced:** Preview scaling is a rendering concern, not a semantic one.
Canvas buffer may be downscaled for performance, but `width`/`height` must always
match Code Mode to ensure loop animations and geometry math work correctly.

---

## [0.8.1] — 2026-01-03

### Fixed

- Fixed canvas zoom/cropping caused by resolution downscaling
- Reapplied context scale after canvas resize
- Ensured clearRect ignores active transforms

### Details

Canvas resizing resets the 2D context transform. The v0.8.0 resolution downscaling feature 
introduced a visual bug where previews appeared zoomed or cropped. This patch ensures:

1. **Scale Transform Reapplied**: After `applyScaledDimensions()`, the context scale is 
   immediately restored via new `reapplyContextScale()` function.

2. **Transform-Safe Clear**: `clearRect()` now uses `clearCanvasIgnoringTransform()` which 
   saves/restores the context to clear the full canvas regardless of active transforms.

3. **No API Changes**: All fixes are internal — no changes to the public API.

---

## [0.8.0] — 2026-01-03

### Lightweight Preview Runtime — Major Refactor

This release refactors the UI renderer into a lightweight, performance-optimized preview runtime.

#### Philosophy Change

**The UI renderer is now explicitly preview-only:**
- NOT canonical — does not guarantee determinism
- NOT archival — not for minting or export
- NOT validation — does not enforce protocol compliance

For canonical output, minting, or validation: use `@nexart/codemode-sdk`.

#### New: Execution Budget (MANDATORY)

The preview runtime enforces hard limits to prevent browser freezes:

```typescript
PREVIEW_BUDGET = {
  MAX_FRAMES: 30,           // Maximum frames before auto-stop
  MAX_TOTAL_TIME_MS: 500,   // Maximum execution time
  TARGET_FRAME_TIME_MS: 16, // ~60fps target
  FRAME_STRIDE: 3,          // Render every 3rd frame
};
```

If limits exceeded: rendering stops silently (no throw).

#### New: Canvas Scaling

Preview renderer no longer renders at full mint resolution:

```typescript
CANVAS_LIMITS = {
  MAX_DIMENSION: 900,  // Max width/height
  MIN_DIMENSION: 100,
};
```

Aspect ratio preserved, CSS scaling for display.

#### New: Preview Engine API

```typescript
import { 
  createPreviewEngine,
  renderStaticPreview,
  stopActivePreview,
  PREVIEW_BUDGET,
  CANVAS_LIMITS,
} from '@nexart/ui-renderer';

// Create preview renderer
const engine = createPreviewEngine({
  canvas: canvasElement,
  source: sketchCode,
  mode: 'loop',
  width: 1950,  // Will be scaled to 900px
  height: 2400,
  seed: 12345,
  vars: [50, 75, 25],
});

// Start/stop
engine.startLoop();
engine.stopLoop();
engine.destroy();
```

#### Changed

- `renderCodeModeSystem()` now uses preview runtime with budget limits
- `renderUnifiedSystem()` updated to use new preview runtime
- Pattern warnings logged to console instead of throwing
- All renderers now include scaling and budget enforcement

#### Added Files

- `src/preview/preview-types.ts` — Type definitions and constants
- `src/preview/frame-budget.ts` — Execution budget manager
- `src/preview/canvas-scaler.ts` — Resolution scaling utilities
- `src/preview/preview-engine.ts` — Lightweight preview executor
- `src/preview/preview-runtime.ts` — Simplified p5-like runtime

---

## [0.7.0] — 2026-01-02

### Protocol v1.2.0 Mirror Update

This release updates to mirror @nexart/codemode-sdk v1.4.0 (Protocol v1.2.0, Phase 3).

#### New Features Mirrored
- **Vertex Functions**: `curveVertex(x, y)`, `bezierVertex(cx1, cy1, cx2, cy2, x, y)`
- **Pixel System**: `loadPixels()`, `updatePixels()`, `pixels[]`, `get(x, y)`, `set(x, y, color)`
- **Graphics System**: `createGraphics(w, h)`, `image(pg, x, y, w, h)`
- **Time Variable**: `totalFrames` now available in Loop Mode

#### Changed
- Updated dependency to @nexart/codemode-sdk ^1.4.0
- Protocol version updated to v1.2.0 (Phase 3)
- Documentation updated to reflect new capabilities

---

## [0.6.0] — 2024-12-30

### Minor Bump for npm Publishing

Version bump for npm release. Mirrors @nexart/codemode-sdk v1.1.0.

- Updated all version references from 0.5.0 to 0.6.0
- Updated codemode-sdk mirror reference from v1.0.2 to v1.1.0
- No breaking changes from 0.5.0

---

## [0.5.0] — 2024-12-30

### VAR Parity Update (Mirrors @nexart/codemode-sdk v1.0.2)

**VAR input is now optional (0-10 elements):**
- Omit `vars` or pass `[]` for empty (defaults to all zeros)
- Input length must be 0-10 (throws if > 10)
- Values must be finite numbers in [0, 100] (throws if out of range, NO clamping)
- Runtime VAR is ALWAYS 10 elements (padded with zeros for consistency)

**Breaking Change Notice:**
- Previously: VAR required exactly 10 elements (error if not 10)
- Now: VAR accepts 0-10 elements (error if > 10, padded to 10)
- Existing code passing 10 elements works unchanged (backwards compatible)

**Enforcement Updated:**
- Out-of-range values now throw errors (previously warned)
- Non-finite numbers now throw errors
- Write attempts now throw detailed protocol errors

### 30 Declarative Primitives

Expanded primitive library from 8 to 30 elements:

**Basic Shapes (6):** dots, lines, waves, stripes, circles, grid

**Geometric (5):** polygons, diamonds, hexgrid, stars, concentricSquares

**Radial (7):** spirals, rays, orbits, rings, arcs, radialLines, petals

**Flow & Motion (3):** flow, particles, bubbles

**Patterns (5):** crosshatch, chevrons, zigzag, weave, moire

**Organic (4):** curves, noise, mesh, branches

### AI Capabilities API (Locked)

**Primitives are now marked as NON-CANONICAL helper generators.**

New exports for AI agents:
- `getCapabilities()` — Full SDK capabilities with primitive metadata
- `getPrimitiveTypes()` — All 30 primitive names as array
- `getPrimitivesByCategory()` — Primitives organized by category
- `getPrimitiveInfo(name)` — Detailed info for single primitive
- `isPrimitiveValid(name)` — Validate primitive name

Each primitive now includes:
- `name` — Unique identifier
- `category` — basic, geometric, radial, flow, patterns, organic
- `description` — Human-readable description
- `compilesTo` — Always 'codemode'
- `isCanonical` — Always false
- `parameters` — count, color, opacity, strokeWeight, motion with ranges

### Changes

- `normalizeVars()` updated to match codemode-sdk v1.0.2 exactly
- `createProtectedVAR()` updated to use frozen 10-element array with Proxy
- `validateCodeSystem()` updated for 0-10 length validation
- Smoke tests updated for VAR parity verification
- Added 22 new primitive generators in `primitives.ts`
- Updated `PrimitiveName` type to include all 30 primitives
- Rewrote `capabilities.ts` with comprehensive primitive metadata
- Added `primitivesMeta` to capabilities for AI consumption
- Exported new helper functions: `getPrimitivesByCategory`, `getPrimitiveInfo`, `isPrimitiveValid`
- Updated SDK version to 0.5.0

---

## [0.4.0] — 2024-12-29

### Protocol Lock (Mirror)

**This SDK now mirrors NexArt Code Mode Protocol v1.0.0.**

This is a MIRROR SDK, not an authority. All protocol semantics are defined by @nexart/codemode-sdk.

### Aligned with v1.0.0

This SDK mirrors the frozen protocol surface:

- **Execution Model**: Static and Loop modes
- **VAR[0..9]**: Exactly 10 read-only protocol variables
- **Error Messages**: Identical format `[Code Mode Protocol Error]`
- **Forbidden Patterns**: 13 patterns rejected (same as SDK)
- **Validation**: Same structural checks (length, type, range)

### Changes

- VAR validation now matches SDK exactly (throws for length/type, warns for range)
- Forbidden pattern errors use SDK format
- Documentation updated with Protocol Lock section
- Smoke tests added for cross-SDK verification

### Authority Boundaries

| Aspect | This SDK | @nexart/codemode-sdk |
|--------|----------|---------------------|
| Authority | Mirror only | Canonical gate |
| Determinism | Mirrors behavior | Authoritative |
| Output | Preview-quality | Archival-quality |

### Notes

- This SDK exists for preview and prototyping
- Production minting uses @nexart/codemode-sdk
- Any protocol change requires v2.0.0 in SDK first
