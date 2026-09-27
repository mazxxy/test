import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { BEAT, T, WIDTH, HEIGHT } from "../timeline";
import { clamp, lerp, measure, prog, ring, sp, tween, withAlpha } from "../lib/anim";
import { makeBall } from "../lib/ball";

const C = theme.colors;
const FAM = theme.fonts.display;
const WORD = "claude";
const S = 290; // wordmark size
const BASE_K = 0.8418; // Roboto Flex baseline from line-box top at line-height 1em
const X_H = 0.5137;
const FINAL = { w: 900, d: 100 };
const SLIVER = { w: 100, d: 25 };
const fv = (w: number, d: number) => `'wght' ${w.toFixed(1)}, 'wdth' ${d.toFixed(2)}`;
const TAG = "REEL 2026 — EVERY FRAME, ON PURPOSE";
const G = 1.956;

const useLayout = () =>
  useMemo(() => {
    const st = { fontFamily: FAM, fontSize: S, fontVariationSettings: fv(FINAL.w, FINAL.d), letterSpacing: "-0.03em" };
    const widths = WORD.split("").map((ch) => measure(ch, st));
    const total = measure(WORD, st);
    const r = 0.13 * S;
    const gap = 0.07 * S;
    const blockW = total + gap + 2 * r;
    const left = WIDTH / 2 - blockW / 2;
    // Glyph centres, scaled so the per-glyph sum matches the kerned word width.
    const k = total / widths.reduce((a, b) => a + b, 0);
    let acc = left;
    const centres = widths.map((w) => {
      const c = acc + (w * k) / 2;
      acc += w * k;
      return c;
    });
    const baseline = HEIGHT / 2 + 0.06 * S;
    return { centres, baseline, r, period: { x: left + total + gap + r, y: baseline }, left, total };
  }, []);

export const S7Logo: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const hit = T.logoHit;

  const ball = useMemo(
    () => makeBall([{ f: T.logoPeriod, x: L.period.x, surface: L.period.y }], L.r, G, { f: hit + 4, x: WIDTH / 2, y: HEIGHT / 2 }),
    [L, hit],
  );

  // Ink -> paper, born from the ball.
  const wipe = tween(f, hit - 1, hit + 18, 0, 1300, theme.ease.out);

  // The ball: pops where the wall collapsed, hops, lands as the period, then idles on the beat.
  const pop = sp(f, hit - 2, theme.spring.bouncy);
  let b = { x: WIDTH / 2, y: HEIGHT / 2, sAlong: 1, sPerp: 1, angle: 0 };
  if (f >= hit + 4) {
    const s = ball.state(f);
    b = { x: s.x, y: s.y, sAlong: s.sAlong, sPerp: s.sPerp, angle: s.angle };
  }
  const beatPulse = [3, 4].reduce((acc, n) => acc + 0.12 * Math.max(0, ring(f, T.logoPeriod + n * BEAT, 0.28, 0.9)), 0);

  // Timing-chart dots along the hop: the opening's spacing chart, one last time.
  const dots: { x: number; y: number; o: number }[] = [];
  for (let k = hit + 6; k <= Math.min(f, T.logoPeriod - 3); k += 2) {
    const s = ball.state(k);
    dots.push({ x: s.x, y: s.y, o: 0.3 });
  }
  const dotsFade = 1 - prog(f, T.logoPeriod + 6, T.logoPeriod + 26, theme.ease.inOut);

  const landRing = prog(f, T.logoPeriod, T.logoPeriod + 30, theme.ease.out);
  const typing = f >= T.tagline + 10;
  const typed = Math.max(0, Math.floor((f - T.tagline - 10) * 1.2));
  const float = Math.sin((f - hit) / 26) * 3 * prog(f, T.logoPeriod + 10, T.logoPeriod + 40);

  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <AbsoluteFill style={{ clipPath: `circle(${wipe}px at ${WIDTH / 2}px ${HEIGHT / 2}px)`, background: C.paper }} />
      <AbsoluteFill style={{ transform: `translateY(${float}px)` }}>
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", inset: 0 }}>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={3} fill={C.ink} opacity={d.o * dotsFade} />
          ))}
          {landRing > 0 && landRing < 1 && (
            <circle cx={L.period.x} cy={L.period.y - L.r} r={lerp(L.r, 260, landRing)} fill="none" stroke={C.ink} strokeWidth={2.5} opacity={(1 - landRing) * 0.5} />
          )}
        </svg>

        {/* wordmark: each glyph swells from a hairline sliver to heavy, left to right */}
        {WORD.split("").map((ch, i) => {
          const start = hit + 5 + i * 3;
          const p = sp(f, start, theme.spring.bouncy);
          if (p <= 0) return null;
          const wght = lerp(SLIVER.w, FINAL.w, Math.min(p, 1.08));
          const wdth = lerp(SLIVER.d, FINAL.d, Math.min(p, 1));
          const lift = (1 - clamp(p)) * 0.35 * S;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: L.centres[i],
                top: L.baseline - BASE_K * S,
                transform: `translate(-50%, ${lift}px)`,
                fontFamily: FAM,
                fontSize: S,
                lineHeight: `${S}px`,
                fontVariationSettings: fv(wght, wdth),
                color: C.ink,
                opacity: clamp(p * 3),
              }}
            >
              {ch}
            </div>
          );
        })}

        {/* the period */}
        <div
          style={{
            position: "absolute",
            left: b.x - L.r,
            top: b.y - L.r,
            width: 2 * L.r,
            height: 2 * L.r,
            borderRadius: "50%",
            background: C.orange,
            boxShadow: `0 0 ${0.8 * L.r}px ${withAlpha(C.orange, 0.35)}`,
            transform: `rotate(${b.angle}deg) scale(${b.sAlong * (f < hit + 4 ? pop : 1) * (1 + beatPulse)}, ${b.sPerp * (f < hit + 4 ? pop : 1) * (1 - beatPulse * 0.6)})`,
          }}
        />

        {/* tagline */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.baseline + 0.2 * S,
            display: "flex",
            justifyContent: "center",
            gap: 22,
            fontFamily: theme.fonts.serif,
            fontStyle: "italic",
            fontSize: 92,
            lineHeight: "110px",
            color: C.ink,
          }}
        >
          {["motion", "designer"].map((w, i) => {
            const p = sp(f, T.tagline + i * 4, theme.spring.snappy);
            return (
              <div key={w} style={{ overflow: "hidden", paddingRight: 8 }}>
                <div style={{ transform: `translateY(${(1 - p) * 115}%)` }}>{w}</div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: L.baseline + 0.2 * S + 142,
            textAlign: "center",
            fontFamily: theme.fonts.mono,
            fontSize: 22,
            letterSpacing: "0.26em",
            color: withAlpha(C.ink, 0.6),
            whiteSpace: "pre",
          }}
        >
          {/* Typewriter: every glyph is laid out from the start, so the centred line never
              shifts; the cursor rides between the typed and the untyped part. */}
          <span>{TAG.slice(0, typed)}</span>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 26,
              marginLeft: 4,
              marginRight: -16,
              verticalAlign: "-4px",
              background: C.ink,
              opacity: typing && (typed < TAG.length || f % BEAT < BEAT / 2) ? 0.8 : 0,
            }}
          />
          <span style={{ opacity: 0 }}>{TAG.slice(typed)}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
