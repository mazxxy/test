import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { rng, withAlpha } from "../lib/anim";
import { theme } from "../theme";

/** Background mesh: base colour plus two soft, drifting light pools. Never a flat fill. */
export const BgMesh: React.FC<{
  base: string;
  glowA: string;
  glowB: string;
  strength?: number;
}> = ({ base, glowA, glowB, strength = 1 }) => {
  const f = useCurrentFrame();
  const d1 = Math.sin(f / 55) * 60;
  const d2 = Math.cos(f / 70) * 50;
  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          borderRadius: "50%",
          left: -380 + d1,
          top: -700 + d2 * 0.5,
          opacity: strength,
          background: `radial-gradient(circle, ${glowA} 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          right: -420 - d2,
          bottom: -680 + d1 * 0.4,
          opacity: strength,
          background: `radial-gradient(circle, ${glowB} 0%, transparent 64%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Colour grade: unifies scenes with a soft top/bottom density roll-off. */
export const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        `linear-gradient(180deg, ${withAlpha(theme.colors.black, 0.1)} 0%, transparent 22%, transparent 78%, ${withAlpha(theme.colors.black, 0.14)} 100%)`,
    }}
  />
);

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.6 -0.3'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** Procedural film grain: re-seeded every frame so it flickers instead of sliding. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const f = useCurrentFrame();
  const r = rng(f * 7919 + 13);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: NOISE,
        backgroundSize: "256px 256px",
        backgroundPosition: `${Math.floor(r() * 256)}px ${Math.floor(r() * 256)}px`,
        mixBlendMode: "overlay",
        opacity,
      }}
    />
  );
};

/** Vignette: the topmost layer. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.3 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, ${withAlpha(theme.colors.black, strength)} 100%)`,
    }}
  />
);

/**
 * Impact frames: a short chromatic split on the big hits. Channels are separated, offset
 * and screened back together, so with no offset the image is untouched.
 */
export const ImpactSplit: React.FC<{ amount: number; children: React.ReactNode }> = ({ amount, children }) => {
  // The wrapper always renders (only the filter toggles), so scenes never remount.
  const on = amount >= 0.3;
  const d = amount.toFixed(2);
  return (
    <AbsoluteFill>
      {on && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id="impact-split" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={d} dy="0" result="ro" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={`-${d}`} dy="0" result="bo" />
            <feBlend in="ro" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="bo" mode="screen" />
          </filter>
        </svg>
      )}
      {/* The shifted channels leave `amount` px bare at the frame edges; a matching ~1% zoom
          punch pushes those edges out of frame (and adds a kick of its own). */}
      <AbsoluteFill style={{ filter: on ? "url(#impact-split)" : undefined, transform: on ? `scale(${1 + (2.4 * amount) / 1920})` : undefined }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
