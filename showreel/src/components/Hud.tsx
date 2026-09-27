// The reel's HUD: crop marks, name, running timecode, the skill ticker (the résumé part)
// and a four-step beat indicator locked to the soundtrack.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { BEAT, FPS, LABELS, SCENES, T, WIDTH, HEIGHT } from "../timeline";
import { clamp, prog, sp, tween, withAlpha } from "../lib/anim";

const C = theme.colors;
const INSET = 46;
const ARM = 28;

/** HUD ink per frame: dark on light backgrounds, light on dark ones. */
export const hudColor = (f: number) => {
  if (f >= SCENES.morph.from && f < SCENES.morph.to) {
    // orange -> paper wipe -> ink wipe; switch as each wipe passes the corners
    return f >= T.wipes[1] + 4 ? C.paper : C.ink;
  }
  if (f >= SCENES.logo.from + 5) return C.ink;
  return C.paper;
};

const tc = (f: number) => {
  const ff = f % FPS;
  const s = Math.floor(f / FPS);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(0)}:${p(0)}:${p(s)}:${p(ff)}`;
};

const Mono: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      fontFamily: theme.fonts.mono,
      fontSize: 17,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "pre",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const ink = hudColor(f);
  const intro = prog(f, 2, 22, theme.ease.out);

  // Skill ticker: the current label and the one it replaced, sliding through a mask.
  let cur = 0;
  LABELS.forEach((l, i) => {
    if (f >= l.at) cur = i;
  });
  const L = LABELS[cur];
  const prev = cur > 0 ? LABELS[cur - 1] : null;
  const inP = cur === 0 ? intro : sp(f, L.at + 1, theme.spring.snappy);
  const outP = prev ? tween(f, L.at - 1, L.at + 6, 0, 1, theme.ease.in) : 1;

  // Typed-on name for the first frames.
  const name = "CLAUDE";
  const title = "  MOTION DESIGN REEL";
  const typedName = Math.floor(clamp((f - 3) / 1.2, 0, name.length + title.length));

  const beatIdx = Math.floor(f / BEAT) % 4;
  const beatFlash = 1 - clamp((f % BEAT) / 10);

  const mark = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path d={`M0 ${ARM * intro} L0 0 L${ARM * intro} 0`} fill="none" stroke={ink} strokeWidth={2} strokeOpacity={0.7} />
    </g>
  );

  return (
    <AbsoluteFill style={{ color: ink, pointerEvents: "none" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
        {mark(INSET, INSET, 1, 1)}
        {mark(WIDTH - INSET, INSET, -1, 1)}
        {mark(INSET, HEIGHT - INSET, 1, -1)}
        {mark(WIDTH - INSET, HEIGHT - INSET, -1, -1)}
      </svg>

      <Mono style={{ position: "absolute", left: INSET + 42, top: INSET - 8, opacity: 0.85 }}>
        <span style={{ fontWeight: 800 }}>{name.slice(0, typedName)}</span>
        <span style={{ opacity: 0.7 }}>{title.slice(0, Math.max(0, typedName - name.length))}</span>
      </Mono>

      <Mono style={{ position: "absolute", right: INSET + 42, top: INSET - 8, opacity: 0.85 * intro }}>
        <span style={{ opacity: 0.55 }}>TC </span>
        {tc(f)}
      </Mono>

      {/* skill ticker */}
      <div style={{ position: "absolute", left: INSET + 42, bottom: INSET - 10, height: 26, overflow: "hidden", minWidth: 520 }}>
        {prev && outP < 1 && (
          <Mono style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${-100 * outP}%)`, opacity: 0.85 }}>
            <span style={{ fontWeight: 800 }}>{String(prev.index).padStart(2, "0")}</span>
            <span style={{ opacity: 0.55 }}> / 08 </span> {prev.text}
          </Mono>
        )}
        <Mono style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${100 * (1 - inP)}%)`, opacity: 0.85 * clamp(inP * 2) }}>
          <span style={{ fontWeight: 800 }}>{String(L.index).padStart(2, "0")}</span>
          <span style={{ opacity: 0.55 }}> / 08 </span> {L.text}
        </Mono>
      </div>

      {/* beat indicator */}
      <div style={{ position: "absolute", right: INSET + 42, bottom: INSET - 4, display: "flex", gap: 8, opacity: intro }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              border: `1.5px solid ${withAlpha(ink === C.ink ? C.ink : C.paper, 0.75)}`,
              background: i === beatIdx ? withAlpha(ink === C.ink ? C.ink : C.paper, 0.35 + 0.5 * beatFlash) : "transparent",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
