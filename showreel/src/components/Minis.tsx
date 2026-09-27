// Mini loops for the grid wall. Each is designed full-frame (1920x1080) and shown at ~1/5
// scale, so everything is drawn big and bold. All motion is a pure function of the frame.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { theme } from "../theme";
import { BEAT, SCENES } from "../timeline";
import { clamp, lerp, prog, sp, withAlpha } from "../lib/anim";

const C = theme.colors;
const W = 1920;
const H = 1080;
const t0 = SCENES.grid.from;

/** Beat-quantised state: the index of the current beat and a spring into it. */
const beatStep = (f: number, offset = 0) => {
  const k = Math.floor((f - offset) / BEAT);
  return { k, p: sp(f, k * BEAT + offset, theme.spring.snappy) };
};

export const Bars: React.FC = () => {
  const f = useCurrentFrame();
  const n = 7;
  const bw = 150;
  const gap = 62;
  const left = (W - (n * bw + (n - 1) * gap)) / 2;
  const base = 860;
  const val = (k: number, i: number) => 180 + 470 * (0.5 + 0.5 * noise2D("bars", k * 0.9, i * 0.7));
  const { k, p } = beatStep(f, 4);
  return (
    <svg width={W} height={H}>
      {Array.from({ length: n }, (_, i) => {
        const { p: pi } = beatStep(f, 4 + i * 2);
        const h = lerp(val(k - 1, i), val(k, i), i === 0 ? p : pi);
        return <rect key={i} x={left + i * (bw + gap)} y={base - h} width={bw} height={h} rx={14} fill={i === 3 ? C.orange : C.ink} />;
      })}
      <rect x={left - 40} y={base + 18} width={n * bw + (n - 1) * gap + 80} height={10} rx={5} fill={C.ink} />
    </svg>
  );
};

export const Cube: React.FC = () => {
  const f = useCurrentFrame();
  const s = 420;
  const rx = -24 + 10 * Math.sin(f / 38);
  const ry = 30 + (f - t0) * 1.7;
  const face = (bg: string, tr: string, inner?: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        width: s,
        height: s,
        left: -s / 2,
        top: -s / 2,
        background: bg,
        transform: tr,
        backfaceVisibility: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {inner}
    </div>
  );
  return (
    <AbsoluteFill style={{ perspective: 2400, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
        {face(C.orange, `translateZ(${s / 2}px)`, <div style={{ width: 170, height: 170, borderRadius: "50%", background: C.ink }} />)}
        {face(C.cobalt, `rotateY(180deg) translateZ(${s / 2}px)`)}
        {face(C.paper, `rotateY(90deg) translateZ(${s / 2}px)`, <div style={{ width: 200, height: 40, background: C.ink, borderRadius: 20 }} />)}
        {face(C.graphite, `rotateY(-90deg) translateZ(${s / 2}px)`)}
        {face(C.paperDim, `rotateX(90deg) translateZ(${s / 2}px)`)}
        {face(C.graphite, `rotateX(-90deg) translateZ(${s / 2}px)`)}
      </div>
    </AbsoluteFill>
  );
};

export const Toggles: React.FC = () => {
  const f = useCurrentFrame();
  const tw = 440;
  const th = 200;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 70, flexDirection: "column" }}>
      {[0, 1, 2].map((i) => {
        const off = i * 7;
        const k = Math.floor((f - off) / BEAT);
        const on = (k + i) % 2 === 0;
        const p = sp(f, k * BEAT + off, theme.spring.bouncy);
        const pos = on ? p : 1 - p;
        const knob = th - 36;
        return (
          <div key={i} style={{ width: tw, height: th, borderRadius: th, position: "relative", background: pos > 0.5 ? C.ink : withAlpha(C.ink, 0.22) }}>
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18 + pos * (tw - knob - 36),
                width: knob * (1 + 0.18 * Math.sin(Math.PI * clamp(p))),
                height: knob,
                borderRadius: knob,
                background: C.paper,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const LineChart: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = (f - t0) * 9;
  const val = (x: number) => 520 - (x + scroll) * 0.12 - 150 * noise2D("line", (x + scroll) * 0.0023, 0) - 40 * noise2D("line2", (x + scroll) * 0.009, 3);
  const head = 1480;
  const pts: string[] = [];
  for (let x = 160; x <= head; x += 16) pts.push(`${x},${val(x) + scroll * 0.12}`);
  const hy = val(head) + scroll * 0.12;
  const pct = 128.4 + (f - t0) * 1.37;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {[300, 500, 700, 900].map((y) => (
          <line key={y} x1={160} x2={1760} y1={y} y2={y} stroke={C.paper} strokeOpacity={0.12} strokeWidth={4} />
        ))}
        <polyline points={pts.join(" ")} fill="none" stroke={C.paper} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={head} cy={hy} r={34 + 6 * Math.sin(f / 4)} fill={C.orange} />
      </svg>
      <div style={{ position: "absolute", left: 160, top: 90, fontFamily: theme.fonts.display, fontSize: 170, fontVariationSettings: "'wght' 800, 'wdth' 88", color: C.paper, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
        +{pct.toFixed(1)}%
      </div>
    </AbsoluteFill>
  );
};

export const TypeLoop: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: theme.fonts.display, fontSize: 470, lineHeight: 1, color: C.ink, letterSpacing: "-0.02em" }}>
        {"LOOP".split("").map((ch, i) => {
          const w = 0.5 + 0.5 * Math.sin(f / 8 - i * 0.9);
          return (
            <span key={i} style={{ fontVariationSettings: `'wght' ${lerp(300, 1000, w).toFixed(0)}, 'wdth' ${lerp(40, 140, w).toFixed(1)}` }}>
              {ch}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Waves: React.FC = () => {
  const f = useCurrentFrame();
  const lines = 13;
  return (
    <svg width={W} height={H}>
      {Array.from({ length: lines }, (_, j) => {
        const y0 = 170 + j * 62;
        let d = "";
        for (let x = 120; x <= 1800; x += 12) {
          const env = Math.exp(-(((x - 960) / 420) ** 2));
          const y = y0 - env * (70 + 60 * noise2D("wave", j * 0.4, f * 0.02)) * (0.5 + 0.5 * Math.sin(x * 0.012 + f * 0.11 + j * 0.55));
          d += `${x === 120 ? "M" : "L"}${x} ${y.toFixed(1)}`;
        }
        const hero = j === 6;
        return <path key={j} d={d} fill="none" stroke={hero ? C.orange : C.ink} strokeWidth={hero ? 12 : 7} strokeLinecap="round" />;
      })}
    </svg>
  );
};

export const Donut: React.FC = () => {
  const f = useCurrentFrame();
  const r = 300;
  const circ = 2 * Math.PI * r;
  const p = 0.72 * prog(f, t0 + 16, t0 + 56, theme.ease.inOut);
  const a = -90 + 360 * p;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <circle cx={W / 2} cy={H / 2} r={r} fill="none" stroke={C.paper} strokeOpacity={0.2} strokeWidth={96} />
        <circle
          cx={W / 2}
          cy={H / 2}
          r={r}
          fill="none"
          stroke={C.paper}
          strokeWidth={96}
          strokeDasharray={`${circ * p} ${circ}`}
          transform={`rotate(-90 ${W / 2} ${H / 2})`}
          strokeLinecap="round"
        />
        <circle cx={W / 2 + r * Math.cos((a * Math.PI) / 180)} cy={H / 2 + r * Math.sin((a * Math.PI) / 180)} r={p > 0.01 ? 30 : 0} fill={C.orange} />
      </svg>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: theme.fonts.display, fontSize: 190, color: C.paper, fontVariationSettings: "'wght' 800, 'wdth' 90", fontVariantNumeric: "tabular-nums" }}>
        {Math.round(p * 100)}%
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Iso: React.FC = () => {
  const f = useCurrentFrame();
  const a = 150; // cube edge on screen
  const cx = W / 2;
  const cy = H / 2 + 150;
  const cubes: { i: number; j: number }[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cubes.push({ i, j });
  // Back to front.
  cubes.sort((p, q) => p.i + p.j - (q.i + q.j));
  const iso = (x: number, y: number, z: number): [number, number] => [cx + (x - y) * a * 0.866, cy + (x + y) * a * 0.5 - z * a];
  return (
    <svg width={W} height={H}>
      {cubes.map(({ i, j }) => {
        const x = i - 1;
        const y = j - 1;
        const z = 0.9 * Math.abs(Math.sin(f / 13 - (i + j) * 0.55));
        const P = (dx: number, dy: number, dz: number) => iso(x + dx, y + dy, z + dz).join(",");
        return (
          <g key={`${i}-${j}`}>
            <polygon points={[P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)].join(" ")} fill={i === 1 && j === 1 ? C.orange : C.paper} />
            <polygon points={[P(0, 1, 1), P(1, 1, 1), P(1, 1, 0), P(0, 1, 0)].join(" ")} fill={C.paperDim} />
            <polygon points={[P(1, 0, 1), P(1, 1, 1), P(1, 1, 0), P(1, 0, 0)].join(" ")} fill={C.graphite} />
          </g>
        );
      })}
    </svg>
  );
};

export const Chat: React.FC = () => {
  const f = useCurrentFrame();
  // No wrap-around inside the scene: the conversation only ever builds.
  const t = f - t0 + 30;
  const bubble = (at: number, right: boolean, y: number, w: number, lines: number) => {
    const p = t >= at ? sp(t, at, theme.spring.bouncy) : 0;
    return (
      <div
        style={{
          position: "absolute",
          top: y,
          [right ? "right" : "left"]: 220,
          width: w,
          padding: "48px 56px",
          borderRadius: 64,
          [right ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 12,
          background: right ? C.ink : withAlpha(C.ink, 0.1),
          transform: `scale(${p})`,
          transformOrigin: right ? "100% 100%" : "0% 100%",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{ height: 34, borderRadius: 17, width: i === lines - 1 ? "62%" : "100%", background: right ? C.paper : C.ink, opacity: right ? 0.9 : 0.55 }} />
        ))}
      </div>
    );
  };
  const typing = t > 34 && t < 70;
  return (
    <AbsoluteFill>
      {bubble(0, false, 110, 820, 2)}
      {bubble(16, true, 390, 700, 1)}
      {typing && (
        <div style={{ position: "absolute", left: 220, top: 640, display: "flex", gap: 22, padding: "44px 52px", borderRadius: 64, background: withAlpha(C.ink, 0.1) }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 40, height: 40, borderRadius: 20, background: C.ink, transform: `translateY(${-14 * Math.max(0, Math.sin(f / 4 - i * 0.9))}px)` }} />
          ))}
        </div>
      )}
      {!typing && t >= 70 && bubble(70, false, 640, 900, 2)}
    </AbsoluteFill>
  );
};

export const Spinner: React.FC = () => {
  const f = useCurrentFrame();
  const r = 250;
  const circ = 2 * Math.PI * r;
  const cyc = ((f - t0) % 50) / 50;
  const len = 0.12 + 0.62 * (0.5 - 0.5 * Math.cos(cyc * Math.PI * 2));
  const rot = (f - t0) * 7 + 200 * cyc;
  return (
    <svg width={W} height={H}>
      <circle cx={W / 2} cy={H / 2} r={r} fill="none" stroke={C.ink} strokeOpacity={0.14} strokeWidth={70} />
      <circle
        cx={W / 2}
        cy={H / 2}
        r={r}
        fill="none"
        stroke={C.ink}
        strokeWidth={70}
        strokeLinecap="round"
        strokeDasharray={`${circ * len} ${circ}`}
        transform={`rotate(${rot} ${W / 2} ${H / 2})`}
      />
    </svg>
  );
};

export const BallLoop: React.FC = () => {
  const f = useCurrentFrame();
  const period = BEAT;
  const t = ((f - t0) % period) / period; // 0 at contact
  const floor = 850;
  const r = 110;
  const hgt = 480 * 4 * t * (1 - t); // parabola, 0 at both contacts
  const squash = Math.max(0, 1 - Math.min(t, 1 - t) * 14) * 0.38;
  const speed = Math.abs(1 - 2 * t);
  const stretch = 1 + 0.22 * speed * (1 - squash * 2);
  const sy = (1 - squash) * (squash > 0 ? 1 : stretch);
  const sx = (1 + squash * 0.8) / (squash > 0 ? 1 : Math.sqrt(stretch));
  return (
    <svg width={W} height={H}>
      <ellipse cx={W / 2} cy={floor + 10} rx={r * (1.3 - 0.8 * (hgt / 480))} ry={22 * (1 - 0.6 * (hgt / 480))} fill={C.ink} opacity={0.18} />
      <rect x={W / 2 - 520} y={floor + 34} width={1040} height={10} rx={5} fill={C.ink} />
      <ellipse cx={W / 2} cy={floor - hgt - r * sy} rx={r * sx} ry={r * sy} fill={C.orange} />
    </svg>
  );
};
