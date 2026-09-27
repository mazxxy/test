import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { createNoise3D } from "simplex-noise";
import { theme } from "../theme";
import { SCENES, T, WIDTH, HEIGHT } from "../timeline";
import { BgMesh } from "../components/Finish";
import { clamp, lerp, prog, rng, withAlpha } from "../lib/anim";
import { inside, Pt, starVerts, toPath } from "../lib/shapes";
import { MORPH_SCALE } from "./S2Morph";

const C = theme.colors;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const N = 14000;
export const DISC_R = 180; // the liquid blob the cloud condenses into

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const PALETTE = [C.orange, C.paper, C.cobalt].map(hexRgb);

type Sim = {
  frames: number;
  x: Float32Array;
  y: Float32Array;
  kind: Uint8Array; // palette index
  size: Float32Array;
};

/**
 * The whole simulation, precomputed once: burst out of the star, ride a curl-noise flow
 * field, then spiral into a disc. Positions are stored per frame, so any frame (rendered
 * in any order, on any worker) is deterministic.
 */
const simulate = (): Sim => {
  const r = rng(420);
  const start = SCENES.particles.from;
  const frames = SCENES.particles.to - start + 1;
  const x = new Float32Array(frames * N);
  const y = new Float32Array(frames * N);
  const kind = new Uint8Array(N);
  const size = new Float32Array(N);
  const star = starVerts();
  const px = new Float32Array(N);
  const py = new Float32Array(N);
  const vx = new Float32Array(N);
  const vy = new Float32Array(N);
  const tx = new Float32Array(N);
  const ty = new Float32Array(N);
  const S = MORPH_SCALE;

  for (let i = 0; i < N; i++) {
    let ux = 0;
    let uy = 0;
    do {
      ux = (r() * 2 - 1) * 1.1;
      uy = (r() * 2 - 1) * 1.25;
    } while (!inside([ux, uy], star));
    px[i] = CX + ux * S;
    py[i] = CY + uy * S;
    const d = Math.hypot(ux, uy) + 1e-6;
    // Most particles pop out moderately; a fast few streak all the way to the frame edge.
    const sp = (4 + 40 * Math.pow(r(), 2.6)) * (0.35 + 0.65 * (d / 1.22));
    const sw = 2 + r() * 6; // already spinning the way the vortex will
    vx[i] = (ux / d) * sp - (uy / d) * sw;
    vy[i] = (uy / d) * sp + (ux / d) * sw;
    const k = r();
    kind[i] = k < 0.76 ? 0 : k < 0.93 ? 1 : 2;
    const s = r();
    size[i] = s < 0.72 ? 1.6 : s < 0.96 ? 2.6 : 4.5;
    // Disc target: area-uniform radius; angle assigned later from where the particle is.
    tx[i] = Math.sqrt(r()) * DISC_R;
    ty[i] = r() * 0.6;
  }

  const noise = createNoise3D(rng(7));
  const condenseAt = T.condense[0] - start;
  const condenseEnd = T.condense[1] - start;
  let angles: Float32Array | null = null;
  const e = 6;
  for (let k = 0; k < frames; k++) {
    const t = k;
    // Blend from free flight into the vortex-disc target.
    const w = clamp((k - condenseAt) / (condenseEnd - condenseAt));
    const wE = w * w * (3 - 2 * w);
    if (k === condenseAt) {
      angles = new Float32Array(N);
      for (let i = 0; i < N; i++) angles[i] = Math.atan2(py[i] - CY, px[i] - CX);
    }
    for (let i = 0; i < N; i++) {
      let X = px[i];
      let Y = py[i];
      if (angles) {
        const a = angles[i] + (1 - wE) * 2.2 + ty[i];
        const R = tx[i] + (1 - wE) * 60;
        X = lerp(X, CX + Math.cos(a) * R, wE);
        Y = lerp(Y, CY + Math.sin(a) * R, wE);
      }
      x[k * N + i] = X;
      y[k * N + i] = Y;
      // Free flight (continues underneath the blend).
      const flow = 0.5 * clamp((k - 6) / 12);
      // Vortex: tangential pull that falls off with radius, a weak centripetal hold, so the
      // burst winds itself into spiral arms.
      const swirl = clamp((k - 4) / 14);
      if (swirl > 0) {
        const dx = px[i] - CX;
        const dy = py[i] - CY;
        const rr = Math.hypot(dx, dy) + 1;
        const at = (swirl * 1.35 * 260) / (rr + 140);
        const ar = -swirl * 0.18 * Math.min(1, rr / 420);
        vx[i] += (-dy / rr) * at + (dx / rr) * ar;
        vy[i] += (dx / rr) * at + (dy / rr) * ar;
      }
      if (flow > 0) {
        const sx = px[i] * 0.0021;
        const sy = py[i] * 0.0021;
        const tt = t * 0.014;
        // Curl of a scalar noise field: divergence-free, so it swirls instead of clumping.
        const n1 = noise(sx, sy + e * 0.0021, tt);
        const n2 = noise(sx, sy - e * 0.0021, tt);
        const n3 = noise(sx + e * 0.0021, sy, tt);
        const n4 = noise(sx - e * 0.0021, sy, tt);
        vx[i] += ((n1 - n2) / (2 * e)) * flow * 160;
        vy[i] += (-(n3 - n4) / (2 * e)) * flow * 160;
      }
      const drag = k < 12 ? 0.9 : 0.95;
      vx[i] *= drag;
      vy[i] *= drag;
      px[i] += vx[i];
      py[i] += vy[i];
    }
  }
  return { frames, x, y, kind, size };
};

export const S4Particles: React.FC = () => {
  const f = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  const sim = useMemo(simulate, []);
  const k = Math.min(sim.frames - 1, Math.max(0, f - SCENES.particles.from));

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.lineCap = "round";
    // Additive: dense regions bloom toward white-hot, like real emissive sparks.
    ctx.globalCompositeOperation = "lighter";
    const toOrange = prog(f, T.condense[0] + 6, T.condense[1] - 4, theme.ease.inOut);
    const prevK = Math.max(0, k - 1);
    const prev2 = Math.max(0, k - 2);
    // Big, soft particles first (depth), then the sharp ones.
    for (const pass of [4.5, 2.6, 1.6]) {
      for (let i = 0; i < N; i++) {
        const s = sim.size[i];
        if (s !== pass) continue;
        const x1 = sim.x[k * N + i];
        const y1 = sim.y[k * N + i];
        // Streak back ~2 frames: shutter-style motion blur.
        const x0 = lerp(sim.x[prevK * N + i], sim.x[prev2 * N + i], 0.9);
        const y0 = lerp(sim.y[prevK * N + i], sim.y[prev2 * N + i], 0.9);
        const base = PALETTE[sim.kind[i]];
        const o = PALETTE[0];
        const c = [0, 1, 2].map((j) => Math.round(lerp(base[j], o[j], toOrange)));
        const alpha = pass === 4.5 ? 0.3 : 0.9;
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
        ctx.lineWidth = s;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1 + 0.01, y1);
        ctx.stroke();
      }
    }
    // Bloom: a blurred copy added on top, so dense streams glow.
    const g = glowRef.current?.getContext("2d");
    if (g && ref.current) {
      g.clearRect(0, 0, WIDTH, HEIGHT);
      g.filter = "blur(14px)";
      g.globalAlpha = 0.95;
      g.drawImage(ref.current, 0, 0);
      g.filter = "none";
    }
  });

  // Burst ring + the solid disc that takes over for the liquid handoff.
  const ringT = prog(f, T.burst, T.burst + 28, theme.ease.out);
  const discIn = prog(f, T.condense[1] - 10, SCENES.particles.to - 1, theme.ease.inOut);
  // The solid star from the 3D pass shatters: it holds for a beat, swells and dissolves
  // while the particles born inside it fly out.
  const shatter = prog(f, T.burst, T.burst + 7, theme.ease.out);
  const core = 1 - prog(f, T.burst, T.burst + 12, theme.ease.out);

  return (
    <AbsoluteFill>
      <BgMesh base={C.ink} glowA={withAlpha(C.orange, 0.07)} glowB={withAlpha(C.cobalt, 0.08)} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={CX}
          cy={CY}
          r={lerp(300, 1000, ringT)}
          fill="none"
          stroke={C.paper}
          strokeWidth={lerp(6, 1, ringT)}
          opacity={ringT > 0 && ringT < 1 ? (1 - ringT) * 0.7 : 0}
        />
      </svg>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="core">
            <stop offset="0%" stopColor={C.paper} stopOpacity={0.9} />
            <stop offset="35%" stopColor={C.orange} stopOpacity={0.45} />
            <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
          </radialGradient>
        </defs>
        <path
          d={toPath(starVerts().map(([x, y]) => [x, y] as Pt), MORPH_SCALE * (1 + 0.08 * shatter), CX, CY, 0)}
          fill={C.orange}
          opacity={1 - shatter}
        />
        <circle cx={CX} cy={CY} r={lerp(120, 520, 1 - core)} fill="url(#core)" opacity={core} />
      </svg>
      <canvas ref={ref} width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }} />
      <canvas ref={glowRef} width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }} />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <circle cx={CX} cy={CY} r={DISC_R + 4} fill={C.orange} opacity={discIn} />
      </svg>
    </AbsoluteFill>
  );
};
