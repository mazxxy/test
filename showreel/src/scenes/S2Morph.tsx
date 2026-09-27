import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { T, WIDTH, HEIGHT } from "../timeline";
import { bump, clamp, colorAt, lerp, prog, sp, tween } from "../lib/anim";
import { circle, mix, Pt, square, star, toPath, triangle } from "../lib/shapes";

const C = theme.colors;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
export const MORPH_SCALE = 250; // px per shape unit: the star's outer radius is 1.22 * 250

const SHAPES = { circle: circle(), square: square(), triangle: triangle(), star: star() };

/** Shape state at any frame: pure, so the echo trails can sample the past. */
const useShapeState = () =>
  useMemo(() => {
    const stages = [
      { at: T.morphs[0], shape: SHAPES.square, rot: 90 },
      { at: T.morphs[1], shape: SHAPES.triangle, rot: 240 },
      { at: T.morphs[2], shape: SHAPES.star, rot: 360 },
    ];
    return (f: number) => {
      let pts: Pt[] = SHAPES.circle.pts;
      let rot = 0;
      let current = 0;
      let flip = 0; // 0..1 around the anchor-set swap
      stages.forEach((s, i) => {
        const p = sp(f, s.at - 2, theme.spring.crisp);
        pts = mix(pts, s.shape.pts, p);
        rot = lerp(rot, s.rot, p);
        if (p > 0.5) current = i + 1;
        flip = Math.max(flip, bump(f, s.at - 2, s.at + 1, s.at + 5));
      });
      rot += 60 * sp(f, T.starSpin - 2, theme.spring.crisp);
      // Anticipation: a small gather before every hit, then the spring pops it back.
      const gather = [T.drop, ...T.morphs, T.starSpin].reduce(
        (acc, at) => acc + 0.07 * bump(f, at - 7, at - 2, at + 1),
        0,
      );
      const enter = sp(f, T.drop, theme.spring.bouncy);
      const scale = MORPH_SCALE * enter * (1 - gather);
      const names = [SHAPES.circle, SHAPES.square, SHAPES.triangle, SHAPES.star];
      return { pts, rot, scale, current, flip, anchors: names[current].anchors, name: names[current].name };
    };
  }, []);

export const S2Morph: React.FC = () => {
  const f = useCurrentFrame();
  const state = useShapeState();
  const s = state(f);
  const [w1, w2] = T.wipes;

  // Background: orange, then radial wipes to paper and to ink, born behind the shape.
  const wipeR = (at: number) => tween(f, at - 2, at + 16, 0, 1250, theme.ease.out);
  const r1 = wipeR(w1);
  const r2 = wipeR(w2);
  const fill = colorAt(f, [w2 - 3, w2 + 3], [C.ink, C.orange]);
  const ui = r2 > 420 ? C.paper : C.ink;
  const bgNow = r2 > 420 ? C.ink : r1 > 420 ? C.paper : C.orange;

  // Vector-editor overlay: guides, bbox, anchors, readouts.
  const uiIn = prog(f, T.drop + 4, T.drop + 18, theme.ease.out);
  const uiOut = 1 - prog(f, T.extrude - 14, T.extrude - 4, theme.ease.in);
  const uiO = uiIn * uiOut;
  const guide = tween(f, T.drop + 2, T.drop + 20, 0, 1, theme.ease.out) * uiOut;

  // Local (unrotated) bounds of the current outline, drawn inside the rotating group.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of s.pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const sc = s.scale;
  const bx = minX * sc;
  const by = minY * sc;
  const bw = (maxX - minX) * sc;
  const bh = (maxY - minY) * sc;
  const pad = 18;

  // Echoes clear out before the 3D handoff so the star leaves the frame clean.
  const echoFade = 1 - prog(f, T.extrude - 12, T.extrude - 3, theme.ease.in);
  const echoes = [4, 8, 12, 16].map((d, i) => {
    const e = state(f - d);
    return { d: toPath(e.pts, e.scale, CX, CY, e.rot), o: [0.55, 0.36, 0.22, 0.12][i] * echoFade };
  });

  // Shockwave rings on the drop and each morph.
  const rings = [T.drop, ...T.morphs].flatMap((at) =>
    [0, 5].map((lag) => {
      const t = prog(f, at + lag, at + lag + 26, theme.ease.out);
      return { r: lerp(MORPH_SCALE * 1.05, 980, t), o: t > 0 && t < 1 ? (1 - t) * 0.5 : 0 };
    }),
  );

  const anchorPop = 1 - 0.6 * s.flip;
  const readW = Math.round(bw);
  const readH = Math.round(bh);
  const readR = ((Math.round(s.rot) % 360) + 360) % 360;

  return (
    <AbsoluteFill style={{ background: C.orange }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <circle cx={CX} cy={CY} r={r1} fill={C.paper} />
        <circle cx={CX} cy={CY} r={r2} fill={C.ink} />

        {/* artboard guides */}
        <g stroke={ui} strokeWidth={1} opacity={0.22 * uiO}>
          <line x1={CX - guide * CX} y1={CY} x2={CX + guide * CX} y2={CY} />
          <line x1={CX} y1={CY - guide * CY} x2={CX} y2={CY + guide * CY} />
        </g>

        {rings.map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r.r} fill="none" stroke={ui} strokeWidth={2} opacity={r.o} />
        ))}

        {/* echo trails: the same animation sampled 4-16 frames in the past */}
        {echoes.map((e, i) => (
          <path key={i} d={e.d} fill="none" stroke={ui} strokeWidth={2} opacity={e.o} />
        ))}

        {/* the shape */}
        <path d={toPath(s.pts, sc, CX, CY, s.rot)} fill={fill} />

        {/* selection overlay, rotating with the object */}
        <g transform={`translate(${CX} ${CY}) rotate(${s.rot})`} opacity={uiO}>
          <rect x={bx - pad} y={by - pad} width={bw + 2 * pad} height={bh + 2 * pad} fill="none" stroke={ui} strokeWidth={1.5} />
          {[
            [0, 0],
            [0.5, 0],
            [1, 0],
            [1, 0.5],
            [1, 1],
            [0.5, 1],
            [0, 1],
            [0, 0.5],
          ].map(([u, v], i) => {
            const k = sp(f, T.drop + 6 + i, theme.spring.snappy) * 12;
            return (
              <rect
                key={i}
                x={bx - pad + u * (bw + 2 * pad) - k / 2}
                y={by - pad + v * (bh + 2 * pad) - k / 2}
                width={k}
                height={k}
                fill={bgNow}
                stroke={ui}
                strokeWidth={1.5}
              />
            );
          })}
          {/* anchors (and bezier handles while it is a circle) */}
          {s.anchors.map((idx, i) => {
            const [x, y] = s.pts[idx];
            const k = sp(f, T.drop + 8 + i * 1.5, theme.spring.bouncy) * 13 * anchorPop;
            const px = x * sc;
            const py = y * sc;
            const isCircle = s.current === 0 && i % 2 === 0;
            const tx = -y;
            const ty = x;
            const hl = 0.38 * sc * (isCircle ? 1 - s.flip : 0);
            return (
              <g key={`${s.current}-${i}`}>
                {hl > 1 && (
                  <>
                    <line x1={px - tx * hl} y1={py - ty * hl} x2={px + tx * hl} y2={py + ty * hl} stroke={ui} strokeWidth={1.5} />
                    <circle cx={px - tx * hl} cy={py - ty * hl} r={5} fill={ui} />
                    <circle cx={px + tx * hl} cy={py + ty * hl} r={5} fill={ui} />
                  </>
                )}
                <rect x={px - k / 2} y={py - k / 2} width={k} height={k} fill={bgNow} stroke={ui} strokeWidth={2} />
              </g>
            );
          })}
          <g stroke={ui} strokeWidth={1.5}>
            <line x1={-9} y1={0} x2={9} y2={0} />
            <line x1={0} y1={-9} x2={0} y2={9} />
          </g>
        </g>
      </svg>

      {/* layer name + transform readout, screen-aligned */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CY + 400,
          display: "flex",
          justifyContent: "center",
          gap: 34,
          fontFamily: theme.fonts.mono,
          fontSize: 21,
          letterSpacing: "0.06em",
          color: ui,
          opacity: 0.8 * uiO,
          fontVariantNumeric: "tabular-nums",
          transform: `translateY(${(1 - uiIn) * 16}px)`,
        }}
      >
        <span>W {String(readW).padStart(3, "0")}</span>
        <span>H {String(readH).padStart(3, "0")}</span>
        <span>∠ {String(readR).padStart(3, "0")}°</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CY - 452,
          display: "flex",
          justifyContent: "center",
          opacity: uiO,
          transform: `translateY(${(1 - uiIn) * -16}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 20,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: bgNow,
            background: ui,
            padding: "7px 14px 6px",
            borderRadius: 4,
            transform: `scale(${1 + 0.12 * clamp(s.flip)})`,
          }}
        >
          {s.name}
        </div>
      </div>
    </AbsoluteFill>
  );
};
