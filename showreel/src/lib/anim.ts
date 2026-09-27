import { interpolate, interpolateColors, spring } from "remotion";
import { theme } from "../theme";
import { FPS } from "../timeline";

type EasingFn = (t: number) => number;
type SpringConfig = { damping: number; stiffness: number; mass: number };

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Eased, clamped tween between two frames. Never linear. */
export const tween = (
  f: number,
  f0: number,
  f1: number,
  from: number,
  to: number,
  easing: EasingFn = theme.ease.out,
) =>
  interpolate(f, [f0, f1], [from, to], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** 0..1 progress between two frames with an easing curve. */
export const prog = (f: number, f0: number, f1: number, easing: EasingFn = theme.ease.inOut) =>
  tween(f, f0, f1, 0, 1, easing);

/** Spring that starts at frame `start` (0 before it). */
export const sp = (f: number, start: number, config: SpringConfig = theme.spring.snappy) =>
  f < start ? 0 : spring({ frame: f - start, fps: FPS, config });

/** A theme hex colour at the given opacity. */
export const withAlpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Clamped colour tween. */
export const colorAt = (f: number, frames: number[], colors: string[]) =>
  interpolateColors(clamp(f, frames[0], frames[frames.length - 1]), frames, colors);

/** Deterministic PRNG (mulberry32). */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Damped oscillation after an event: 0 before, peaks near 1 on impact, rings out. */
export const ring = (f: number, at: number, decay = 0.16, freq = 0.55) => {
  const t = f - at;
  if (t < 0) return 0;
  return Math.exp(-t * decay) * Math.cos(t * freq);
};

/** Smooth bump: 0 outside [a, c], 1 at b. */
export const bump = (f: number, a: number, b: number, c: number) => {
  if (f <= a || f >= c) return 0;
  const t = f < b ? (f - a) / (b - a) : (c - f) / (c - b);
  return t * t * (3 - 2 * t);
};

const measureCache = new Map<string, number>();
/** Measures rendered text width with the real (loaded) font, via a hidden DOM node. */
export const measure = (text: string, style: React.CSSProperties) => {
  const key = text + "|" + JSON.stringify(style);
  const hit = measureCache.get(key);
  if (hit !== undefined) return hit;
  const el = document.createElement("span");
  Object.assign(el.style, {
    position: "absolute",
    visibility: "hidden",
    whiteSpace: "pre",
    left: "-99999px",
    top: "0px",
  });
  for (const [k, v] of Object.entries(style)) {
    (el.style as unknown as Record<string, string>)[k] = typeof v === "number" && k === "fontSize" ? `${v}px` : String(v);
  }
  el.textContent = text;
  document.body.appendChild(el);
  const w = el.getBoundingClientRect().width;
  document.body.removeChild(el);
  measureCache.set(key, w);
  return w;
};
