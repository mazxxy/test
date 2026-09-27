import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { theme } from "../theme";
import { T, WIDTH, HEIGHT } from "../timeline";
import { BgMesh } from "../components/Finish";
import { bump, lerp, prog, sp, tween, withAlpha } from "../lib/anim";
import { DISC_R } from "./S4Particles";

const C = theme.colors;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const DROPS = 6;
const ORBIT = 330;

/**
 * Metaballs: plain circles, blurred and alpha-thresholded so they fuse with liquid necks,
 * then lit with a specular pass for a glossy, three-dimensional surface.
 * Also rendered as the first cell of the grid wall, so it keeps moving after its scene ends.
 */
export const Liquid: React.FC<{ id?: string; withWipe?: boolean }> = ({ id = "goo", withWipe = true }) => {
  const f = useCurrentFrame();

  // Background wipe from ink to cobalt, born behind the blob.
  const wipe = tween(f, T.liquid - 1, T.liquid + 16, DISC_R, 1250, theme.ease.out);

  // Choreography, all on the beat grid.
  const split = sp(f, T.split - 3, theme.spring.bouncy);
  const squeeze = bump(f, T.bounce - 4, T.bounce + 2, T.bounce + 12);
  const merge = prog(f, T.merge - 6, T.merge + 6, theme.ease.inCubic);
  const dist = ORBIT * split * (1 - 0.32 * squeeze) * (1 - merge);
  const orbitRot = 60 * prog(f, T.orbit - 4, T.orbit + 12, theme.ease.inOut) + 0.25 * Math.max(0, f - T.split);
  const centreR = lerp(DISC_R, 128, split * (1 - merge)) * (1 + 0.1 * sp(f, T.merge + 2, theme.spring.jelly) * (1 - prog(f, T.merge + 2, T.merge + 30)));
  const dropR = lerp(40, 70, split) * (1 - 0.35 * merge);

  // Gloss and wobble ease in, so the flat disc from the particle pass turns liquid on the beat.
  const liquid = prog(f, T.liquid, T.liquid + 10, theme.ease.out);
  // Organic wobble: satellites hugging the core, drifting on noise.
  const wob = 0.5 + 0.5 * Math.sin(f / 5);
  const sats = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + f * 0.02;
    const n = noise2D("sat" + i, f * 0.03, i);
    const rr = centreR * (0.6 + 0.1 * n * liquid);
    return { x: CX + Math.cos(a) * rr, y: CY + Math.sin(a) * rr, r: centreR * (0.4 + (0.06 * n + 0.03 * wob) * liquid) };
  });

  const drops = Array.from({ length: DROPS }, (_, i) => {
    const a = ((i * 360) / DROPS + orbitRot - 90) * (Math.PI / 180);
    const n = noise2D("drop" + i, f * 0.04, 0);
    const d = dist * (1 + 0.06 * n);
    // A small follower lags behind each drop: secondary action, and a stretchy tail.
    const lagD = ORBIT * sp(f - 4, T.split - 3, theme.spring.bouncy) * (1 - 0.32 * bump(f - 4, T.bounce - 4, T.bounce + 2, T.bounce + 12)) * (1 - prog(f - 4, T.merge - 6, T.merge + 6, theme.ease.inCubic));
    const la = a - 0.12;
    return {
      x: CX + Math.cos(a) * d,
      y: CY + Math.sin(a) * d,
      r: dropR * (1 + 0.08 * n),
      fx: CX + Math.cos(la) * lagD * 0.82,
      fy: CY + Math.sin(la) * lagD * 0.82,
      fr: dropR * 0.42,
    };
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: C.ink }} />
      <AbsoluteFill style={{ clipPath: `circle(${withWipe ? wipe : 2000}px at ${CX}px ${CY}px)` }}>
        <BgMesh base={C.cobalt} glowA={withAlpha(C.paper, 0.16)} glowB={withAlpha(C.cobaltDeep, 0.5)} />
      </AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 34 -15" result="goo" />
            {/* soft contact shadow */}
            <feOffset in="goo" dy="30" result="off" />
            <feGaussianBlur in="off" stdDeviation="22" result="offBlur" />
            <feColorMatrix in="offBlur" type="matrix" values={`0 0 0 0 0.02  0 0 0 0 0.03  0 0 0 0 0.25  0 0 0 ${0.5 * liquid} 0`} result="shadow" />
            {/* glossy surface: light the blurred height field */}
            <feGaussianBlur in="goo" stdDeviation="9" result="height" />
            <feSpecularLighting in="height" surfaceScale="9" specularConstant="1.2" specularExponent="28" lightingColor={C.paper} result="spec">
              <fePointLight x={CX - 420} y={CY - 520} z={480} />
            </feSpecularLighting>
            <feComposite in="spec" in2="goo" operator="in" result="specIn" />
            <feComposite in="goo" in2="specIn" operator="arithmetic" k1="0" k2="1" k3={0.8 * liquid} k4="0" result="lit" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="lit" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${id})`} fill={C.orange}>
          <circle cx={CX} cy={CY} r={centreR} />
          {sats.map((s, i) => (
            <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} />
          ))}
          {drops.map((d, i) => (
            <React.Fragment key={`d${i}`}>
              <circle cx={d.x} cy={d.y} r={d.r} />
              <circle cx={d.fx} cy={d.fy} r={d.fr} />
            </React.Fragment>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const S5Liquid: React.FC = () => <Liquid />;
