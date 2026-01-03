/**
 * @nexart/ui-renderer - Preview Runtime
 * 
 * Simplified p5-like runtime for preview rendering.
 * Same API surface as Code Mode, but optimized for performance.
 * 
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PREVIEW RUNTIME — SAME API, SIMPLIFIED INTERNALS                        ║
 * ║                                                                          ║
 * ║  This runtime:                                                           ║
 * ║  - Uses same function names as Code Mode                                 ║
 * ║  - Is NOT deterministic (performance > fidelity)                         ║
 * ║  - May have simplified implementations                                   ║
 * ║  - Pixel operations may be capped                                        ║
 * ║                                                                          ║
 * ║  For canonical output: use @nexart/codemode-sdk                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

export interface PreviewP5Runtime {
  [key: string]: any;
  mode: 'preview';
  width: number;
  height: number;
  frameCount: number;
  VAR: readonly number[];
}

function createSeededRNG(seed: number = 123456): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSimpleNoise(seed: number = 0) {
  const rng = createSeededRNG(seed);
  const perm: number[] = [];
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };

  return (x: number, y: number = 0, z: number = 0): number => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return (lerp(lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
      lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
        lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w) + 1) / 2;
  };
}

function normalizeVars(vars?: number[]): number[] {
  if (!vars || !Array.isArray(vars)) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  const result: number[] = [];
  for (let i = 0; i < Math.min(vars.length, 10); i++) {
    const v = vars[i];
    if (typeof v === 'number' && Number.isFinite(v)) {
      result.push(Math.max(0, Math.min(100, v)));
    } else {
      result.push(0);
    }
  }
  while (result.length < 10) result.push(0);
  return result;
}

export function createPreviewRuntime(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  seed: number = 12345,
  vars: number[] = []
): PreviewP5Runtime {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  
  let currentFill = 'rgba(255, 255, 255, 1)';
  let currentStroke = 'rgba(0, 0, 0, 1)';
  let strokeEnabled = true;
  let fillEnabled = true;
  let currentStrokeWeight = 1;
  let colorMode = { mode: 'RGB', maxR: 255, maxG: 255, maxB: 255, maxA: 255 };
  let shapeStarted = false;

  let rng = createSeededRNG(seed);
  let noiseFunc = createSimpleNoise(seed);
  let noiseOctaves = 4;
  let noiseFalloff = 0.5;

  const normalizedVars = normalizeVars(vars);
  const frozenVars = Object.freeze([...normalizedVars]) as readonly number[];

  const parseColor = (...args: any[]): string => {
    if (args.length === 0) return 'rgba(0, 0, 0, 1)';
    const { mode, maxR, maxG, maxB, maxA } = colorMode;

    if (args.length === 1) {
      const val = args[0];
      if (typeof val === 'string') return val;
      if (mode === 'HSB') return `hsla(${val}, 100%, 50%, 1)`;
      const gray = Math.round((val / maxR) * 255);
      return `rgba(${gray}, ${gray}, ${gray}, 1)`;
    }

    if (args.length === 2) {
      const [gray, alpha] = args;
      const g = Math.round((gray / maxR) * 255);
      return `rgba(${g}, ${g}, ${g}, ${alpha / maxA})`;
    }

    if (args.length === 3) {
      const [r, g, b] = args;
      if (mode === 'HSB') {
        return `hsla(${(r / maxR) * 360}, ${(g / maxG) * 100}%, ${(b / maxB) * 100}%, 1)`;
      }
      return `rgba(${Math.round((r / maxR) * 255)}, ${Math.round((g / maxG) * 255)}, ${Math.round((b / maxB) * 255)}, 1)`;
    }

    if (args.length === 4) {
      const [r, g, b, a] = args;
      if (mode === 'HSB') {
        return `hsla(${(r / maxR) * 360}, ${(g / maxG) * 100}%, ${(b / maxB) * 100}%, ${a / maxA})`;
      }
      return `rgba(${Math.round((r / maxR) * 255)}, ${Math.round((g / maxG) * 255)}, ${Math.round((b / maxB) * 255)}, ${a / maxA})`;
    }

    return 'rgba(0, 0, 0, 1)';
  };

  const p: PreviewP5Runtime = {
    mode: 'preview' as const,
    width,
    height,
    frameCount: 0,
    VAR: frozenVars,

    PI: Math.PI,
    TWO_PI: Math.PI * 2,
    HALF_PI: Math.PI / 2,
    QUARTER_PI: Math.PI / 4,

    CORNER: 'corner',
    CENTER: 'center',
    CORNERS: 'corners',
    RADIUS: 'radius',
    ROUND: 'round',
    SQUARE: 'square',
    PROJECT: 'butt',
    MITER: 'miter',
    BEVEL: 'bevel',
    CLOSE: 'close',

    background: (...args: any[]) => {
      ctx.fillStyle = parseColor(...args);
      ctx.fillRect(0, 0, width, height);
    },

    fill: (...args: any[]) => {
      currentFill = parseColor(...args);
      fillEnabled = true;
    },

    noFill: () => { fillEnabled = false; },

    stroke: (...args: any[]) => {
      currentStroke = parseColor(...args);
      strokeEnabled = true;
    },

    noStroke: () => { strokeEnabled = false; },

    strokeWeight: (w: number) => {
      currentStrokeWeight = w;
      ctx.lineWidth = w;
    },

    strokeCap: (cap: string) => { ctx.lineCap = cap as CanvasLineCap; },
    strokeJoin: (join: string) => { ctx.lineJoin = join as CanvasLineJoin; },

    colorMode: (mode: string, max1?: number, max2?: number, max3?: number, maxA?: number) => {
      colorMode.mode = mode;
      if (max1 !== undefined) {
        colorMode.maxR = max1;
        colorMode.maxG = max2 ?? max1;
        colorMode.maxB = max3 ?? max1;
        colorMode.maxA = maxA ?? max1;
      }
    },

    push: () => { ctx.save(); },
    pop: () => { ctx.restore(); },
    translate: (x: number, y: number) => { ctx.translate(x, y); },
    rotate: (angle: number) => { ctx.rotate(angle); },
    scale: (sx: number, sy?: number) => { ctx.scale(sx, sy ?? sx); },

    ellipse: (x: number, y: number, w: number, h?: number) => {
      const rw = w / 2, rh = (h ?? w) / 2;
      ctx.beginPath();
      ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    circle: (x: number, y: number, d: number) => { p.ellipse(x, y, d, d); },

    rect: (x: number, y: number, w: number, h?: number, r?: number) => {
      const ht = h ?? w;
      ctx.beginPath();
      if (r && r > 0) ctx.roundRect(x, y, w, ht, r);
      else ctx.rect(x, y, w, ht);
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    square: (x: number, y: number, s: number, r?: number) => { p.rect(x, y, s, s, r); },

    line: (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    point: (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, currentStrokeWeight / 2, 0, Math.PI * 2);
      ctx.fillStyle = currentStroke;
      ctx.fill();
    },

    triangle: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    quad: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    arc: (x: number, y: number, w: number, h: number, start: number, stop: number, mode?: string) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, start, stop);
      if (mode === 'close' || mode === 'chord') ctx.closePath();
      else if (mode === 'pie') { ctx.lineTo(x, y); ctx.closePath(); }
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    beginShape: () => { ctx.beginPath(); shapeStarted = true; },

    vertex: (x: number, y: number) => {
      if (!shapeStarted) { ctx.beginPath(); ctx.moveTo(x, y); shapeStarted = true; }
      else ctx.lineTo(x, y);
    },

    curveVertex: (x: number, y: number) => { ctx.lineTo(x, y); },
    bezierVertex: (x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      ctx.bezierCurveTo(x2, y2, x3, y3, x4, y4);
    },
    quadraticVertex: (cx: number, cy: number, x3: number, y3: number) => {
      ctx.quadraticCurveTo(cx, cy, x3, y3);
    },

    endShape: (close?: string) => {
      if (close === 'close') ctx.closePath();
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
      shapeStarted = false;
    },

    bezier: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x2, y2, x3, y3, x4, y4);
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    curve: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.bezierCurveTo(x2, y2, x3, y3, x3, y3);
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    text: (str: string, x: number, y: number) => {
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fillText(String(str), x, y); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.strokeText(String(str), x, y); }
    },

    textSize: (size: number) => { ctx.font = `${size}px sans-serif`; },
    textAlign: (h: string, v?: string) => {
      ctx.textAlign = h as CanvasTextAlign;
      if (v) ctx.textBaseline = v as CanvasTextBaseline;
    },

    random: (min?: number, max?: number) => {
      if (min === undefined) return rng();
      if (max === undefined) return rng() * min;
      return min + rng() * (max - min);
    },

    randomSeed: (s: number) => { rng = createSeededRNG(s); },

    noise: (x: number, y?: number, z?: number) => {
      let total = 0, freq = 1, amp = 1, maxVal = 0;
      for (let i = 0; i < noiseOctaves; i++) {
        total += noiseFunc(x * freq, (y ?? 0) * freq, (z ?? 0) * freq) * amp;
        maxVal += amp;
        amp *= noiseFalloff;
        freq *= 2;
      }
      return total / maxVal;
    },

    noiseSeed: (s: number) => { noiseFunc = createSimpleNoise(s); },
    noiseDetail: (octaves: number, falloff?: number) => {
      noiseOctaves = octaves;
      if (falloff !== undefined) noiseFalloff = falloff;
    },

    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
    abs: Math.abs, ceil: Math.ceil, floor: Math.floor, round: Math.round,
    min: Math.min, max: Math.max, pow: Math.pow, sqrt: Math.sqrt,
    exp: Math.exp, log: Math.log, sq: (n: number) => n * n,
    int: Math.floor,

    map: (v: number, s1: number, e1: number, s2: number, e2: number) => s2 + (e2 - s2) * ((v - s1) / (e1 - s1)),
    constrain: (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)),
    lerp: (a: number, b: number, t: number) => a + (b - a) * t,
    dist: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
    mag: (x: number, y: number) => Math.sqrt(x * x + y * y),
    norm: (v: number, s: number, e: number) => (v - s) / (e - s),
    radians: (d: number) => d * (Math.PI / 180),
    degrees: (r: number) => r * (180 / Math.PI),

    color: (...args: any[]) => parseColor(...args),
    lerpColor: (c1: string, c2: string, amt: number) => c1,
    red: (c: string) => { const m = c.match(/rgba?\((\d+)/); return m ? parseInt(m[1], 10) : 0; },
    green: (c: string) => { const m = c.match(/rgba?\(\d+,\s*(\d+)/); return m ? parseInt(m[1], 10) : 0; },
    blue: (c: string) => { const m = c.match(/rgba?\(\d+,\s*\d+,\s*(\d+)/); return m ? parseInt(m[1], 10) : 0; },
    alpha: (c: string) => { const m = c.match(/rgba\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/); return m ? Math.round(parseFloat(m[1]) * 255) : 255; },
    hue: () => 0, saturation: () => 0, brightness: () => 0,

    blendMode: (mode: string) => { ctx.globalCompositeOperation = mode as GlobalCompositeOperation; },
    clear: () => { ctx.clearRect(0, 0, width, height); },

    print: console.log,
    println: console.log,

    loop: () => {},
    noLoop: () => {},

    fract: (x: number) => x - Math.floor(x),
    sign: Math.sign,

    vec: (x: number, y: number) => ({ x, y }),
    vecAdd: (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x + b.x, y: a.y + b.y }),
    vecSub: (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x - b.x, y: a.y - b.y }),
    vecMult: (v: { x: number; y: number }, s: number) => ({ x: v.x * s, y: v.y * s }),
    vecMag: (v: { x: number; y: number }) => Math.sqrt(v.x * v.x + v.y * v.y),
    vecNorm: (v: { x: number; y: number }) => { const m = Math.sqrt(v.x * v.x + v.y * v.y) || 1; return { x: v.x / m, y: v.y / m }; },
    vecDist: (a: { x: number; y: number }, b: { x: number; y: number }) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2),

    polygon: (x: number, y: number, r: number, n: number) => {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    star: (x: number, y: number, r1: number, r2: number, n: number) => {
      ctx.beginPath();
      for (let i = 0; i < n * 2; i++) {
        const angle = (Math.PI * i) / n - Math.PI / 2;
        const r = i % 2 === 0 ? r2 : r1;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (fillEnabled) { ctx.fillStyle = currentFill; ctx.fill(); }
      if (strokeEnabled) { ctx.strokeStyle = currentStroke; ctx.lineWidth = currentStrokeWeight; ctx.stroke(); }
    },

    easeIn: (t: number) => t * t,
    easeOut: (t: number) => 1 - (1 - t) * (1 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    easeCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeExpo: (t: number) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,

    fbm: (x: number, y?: number, z?: number, octaves: number = 4) => {
      let val = 0, amp = 0.5, freq = 1;
      for (let i = 0; i < octaves; i++) {
        val += amp * noiseFunc(x * freq, (y ?? 0) * freq, (z ?? 0) * freq);
        freq *= 2;
        amp *= 0.5;
      }
      return val;
    },

    ridgedNoise: (x: number, y?: number, z?: number) => {
      return 1 - Math.abs(noiseFunc(x, y ?? 0, z ?? 0) * 2 - 1);
    },

    curlNoise: (x: number, y: number, epsilon: number = 0.001) => {
      const n1 = noiseFunc(x, y + epsilon);
      const n2 = noiseFunc(x, y - epsilon);
      const n3 = noiseFunc(x + epsilon, y);
      const n4 = noiseFunc(x - epsilon, y);
      return { x: (n1 - n2) / (2 * epsilon), y: -(n3 - n4) / (2 * epsilon) };
    },

    createGraphics: (w: number, h: number) => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.min(w, 900);
      offCanvas.height = Math.min(h, 900);
      return createPreviewRuntime(offCanvas, offCanvas.width, offCanvas.height, seed, vars);
    },

    image: (img: any, x: number, y: number, w?: number, h?: number) => {
      try {
        if (img && img.width && img.height) {
          const srcCanvas = document.createElement('canvas');
          srcCanvas.width = img.width;
          srcCanvas.height = img.height;
          const srcCtx = srcCanvas.getContext('2d');
          if (srcCtx && img.background) {
            srcCtx.drawImage(srcCanvas, 0, 0);
          }
          ctx.drawImage(srcCanvas, x, y, w ?? img.width, h ?? img.height);
        }
      } catch {
        // Silently fail for preview
      }
    },

    loadPixels: () => {},
    updatePixels: () => {},
    get: () => [0, 0, 0, 255],
    set: () => {},
    pixels: [],
    totalFrames: 120,
    t: 0,
    time: 0,
    tGlobal: 0,
  };

  return p;
}
