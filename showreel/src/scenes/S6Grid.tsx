import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { T, WIDTH, HEIGHT } from "../timeline";
import { BgMesh } from "../components/Finish";
import { clamp, bump, lerp, prog, sp, withAlpha } from "../lib/anim";
import { Bars, BallLoop, Chat, Cube, Donut, Iso, LineChart, Spinner, Toggles, TypeLoop, Waves } from "../components/Minis";
import { Liquid } from "./S5Liquid";

const C = theme.colors;
const CW = WIDTH;
const CH = HEIGHT;
const GUT = 90;
const COLS = 4;
const ROWS = 3;
const GW = COLS * CW + (COLS - 1) * GUT;
const GH = ROWS * CH + (ROWS - 1) * GUT;
/** Scale at which the whole wall fits the frame with room for the HUD. */
const FIT = Math.min((WIDTH * 0.86) / GW, (HEIGHT * 0.78) / GH);
const LIQUID = 5;

const LiquidCell: React.FC = () => <Liquid id="goo-cell" withWipe={false} />;

const CELLS: { bg: string; Comp: React.FC }[] = [
  { bg: C.paper, Comp: Bars },
  { bg: C.ink2, Comp: Cube },
  { bg: C.orange, Comp: Toggles },
  { bg: C.ink2, Comp: LineChart },
  { bg: C.orange, Comp: TypeLoop },
  { bg: C.cobalt, Comp: LiquidCell },
  { bg: C.paper, Comp: Waves },
  { bg: C.cobalt, Comp: Donut },
  { bg: C.ink2, Comp: Iso },
  { bg: C.paper, Comp: Chat },
  { bg: C.orange, Comp: Spinner },
  { bg: C.paper, Comp: BallLoop },
];

const cellPos = (i: number) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return { c, r, x: c * (CW + GUT) + CW / 2, y: r * (CH + GUT) + CH / 2 };
};

export const S6Grid: React.FC = () => {
  const f = useCurrentFrame();
  const [p0, p1] = T.pullout;
  const [c0, c1] = T.collapse;
  const liq = cellPos(LIQUID);

  // Camera: pull out in log-scale (perceptually even), swinging the wall into place.
  const w = prog(f, p0, p1, theme.ease.inOut);
  const collapse = prog(f, c0, c1, theme.ease.in);
  const s = Math.exp(lerp(0, Math.log(FIT), w)) * (1 + 0.18 * collapse);
  const cx = lerp(liq.x, GW / 2, w);
  const cy = lerp(liq.y, GH / 2, w);
  const swing = bump(f, p0 + 2, (p0 + p1) / 2, p1 + 14);
  const settle = sp(f, p1 - 6, theme.spring.smooth);
  const tiltX = 16 * swing;
  const tiltZ = -5 * swing + 1.2 * (1 - settle) * (f > p1 - 6 ? 1 : 0);
  const radius = lerp(0, 44, w);

  const maxD = Math.hypot(GW / 2, GH / 2);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgMesh base={C.void} glowA={withAlpha(C.paper, 0.04)} glowB={withAlpha(C.cobalt, 0.1)} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        <AbsoluteFill style={{ transform: `rotateX(${tiltX}deg) rotateZ(${tiltZ}deg)` }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: GW,
              height: GH,
              transformOrigin: "0 0",
              transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) scale(${s}) translate(${-cx}px, ${-cy}px)`,
            }}
          >
            {CELLS.map(({ bg, Comp }, i) => {
              const p = cellPos(i);
              const steps = Math.abs(p.c - liq.c) + Math.abs(p.r - liq.r);
              const pop = i === LIQUID ? 1 : sp(f, T.cellsIn[0] + steps * 5, theme.spring.snappy);
              // Collapse: outer tiles first, each shrinking into an orange dot at the centre.
              const dC = Math.hypot(p.x - GW / 2, p.y - GH / 2) / maxD;
              const k = prog(f, c0 + (1 - dC) * 6, c1 - 1, theme.ease.in);
              const tx = (GW / 2 - p.x) * k;
              const ty = (GH / 2 - p.y) * k;
              const sc = lerp(1, 0.035, k) * lerp(0.62, 1, pop);
              if (pop <= 0.001) return null;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: p.x - CW / 2,
                    top: p.y - CH / 2,
                    width: CW,
                    height: CH,
                    overflow: "hidden",
                    borderRadius: lerp(radius, CH / 2, clamp(k * 1.4)),
                    background: bg,
                    opacity: clamp(pop * 1.4),
                    transform: `translate(${tx}px, ${ty}px) scale(${sc * lerp(1, CH / CW, clamp(k * 1.3))}, ${sc})`,
                  }}
                >
                  <Comp />
                  {/* Tiles keep their true colours while they shrink, then snap to orange dots. */}
                  <AbsoluteFill style={{ background: C.orange, opacity: clamp((k - 0.45) * 3) }} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
