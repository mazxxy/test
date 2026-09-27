import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { T, WIDTH, HEIGHT } from "../timeline";
import { BgMesh } from "../components/Finish";
import { clamp, lerp, measure, prog, sp, tween, withAlpha } from "../lib/anim";
import { CONTACT, makeBall } from "../lib/ball";

const C = theme.colors;
const FAM = theme.fonts.display;

// Roboto Flex vertical metrics (em): ascent .9277, descent .2441, x-height .5137, cap .7109.
// With line-height = 1em the baseline sits .8418em below the line box top.
const BASE_K = 0.8418;
const X_H = 0.5137;
const CAP_H = 0.7109;

const WORDS = ["I", "make", "things", "move"];
const LAND_LETTER = [0, 1, 3, 1]; // I, a, n, o: the glyph each impact lands on
const THIN = { w: 270, d: 58 };
const BOLD = { w: 820, d: 100 };
const TRACK = "-0.035em";
const fv = (w: number, d: number) => `'wght' ${w.toFixed(1)}, 'wdth' ${d.toFixed(2)}`;
const style = (w: number, d: number, size: number): React.CSSProperties => ({
  fontFamily: FAM,
  fontSize: size,
  fontVariationSettings: fv(w, d),
  letterSpacing: TRACK,
});

const G = 1.956; // px / frame^2: one gravity for every hop

const useLayout = () =>
  useMemo(() => {
    // Fit the line to ~1560px, then derive everything from the font size.
    const ref = 100;
    const w100 = WORDS.map((w) => measure(w, style(BOLD.w, BOLD.d, ref)));
    const gap100 = 0.3 * ref;
    const r100 = 0.135 * ref;
    const periodGap100 = 0.1 * ref;
    const total100 = w100.reduce((a, b) => a + b, 0) + gap100 * 3 + periodGap100 + r100 * 2;
    const S = Math.min(215, (1560 / total100) * ref);
    const k = S / ref;
    const widths = w100.map((w) => w * k);
    const gap = gap100 * k;
    const r = r100 * k;
    const total = total100 * k;
    const left = WIDTH / 2 - total / 2;
    const baseline = HEIGHT / 2 + 0.3 * S;

    let x = left;
    const words = WORDS.map((word, i) => {
      const cx = x + widths[i] / 2;
      x += widths[i] + gap;
      // Where the landing glyph sits at impact time, when the word is still thin.
      const thinW = measure(word, style(THIN.w, THIN.d, S));
      const li = LAND_LETTER[i];
      const pre = measure(word.slice(0, li), style(THIN.w, THIN.d, S));
      const glyph = measure(word[li], style(THIN.w, THIN.d, S));
      const landX = cx - thinW / 2 + pre + glyph / 2;
      const top = baseline - (word === "I" ? CAP_H : X_H * 1.012) * S;
      return { word, cx, width: widths[i], landX, top };
    });
    const moveRight = words[3].cx + widths[3] / 2;
    const period = { x: moveRight + 0.1 * S + r, y: baseline };
    return { S, r, baseline, words, period };
  }, []);

/** Per-glyph trampoline response after an impact at `fc` (first peak at fc). */
const dipCurve = (f: number, fc: number) => {
  const t = f - (fc - CONTACT / 2);
  if (t < 0) return 0;
  return (Math.exp(-0.17 * t) * Math.sin((Math.PI * t) / CONTACT)) / Math.exp(-0.17 * (CONTACT / 2));
};

export const S1Ball: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLayout();
  const { S, r, baseline, words, period } = L;
  const impacts = T.ballImpacts;

  const ball = useMemo(() => {
    const keys = [
      ...words.map((w, i) => ({ f: impacts[i], x: w.landX, surface: w.top })),
      { f: T.periodLand, x: period.x, surface: period.y },
    ];
    return makeBall(keys, r, G, { f: 0, x: -12, y: HEIGHT * 0.34 });
  }, [words, impacts, period, r]);

  const b = ball.state(f);
  // While in contact with a word, the ball rides the glyph down as it gives way.
  if (b.contactIndex >= 0 && b.contactIndex < impacts.length) {
    b.y += dipCurve(f, impacts[b.contactIndex]) * 0.075 * S;
  }

  // The glyph under an active contact is pushed down with the ball.
  const dipPx = 0.075 * S;

  // --- Camera: a slow push, then a fast suck-in through the period. ---
  const [z0, z1] = T.zoom;
  const push = tween(f, 0, z0, 1, 1.04, theme.ease.inOutSine);
  const zp = prog(f, z0, z1, theme.ease.in);
  const zoom = Math.exp(Math.log(62) * zp) * push;
  const centerT = prog(f, z0, z1 - 4, theme.ease.inOut);
  const cx = lerp(WIDTH / 2, period.x, centerT);
  const cy = lerp(HEIGHT / 2, period.y - r, centerT);
  const zoomVel = f > z0 ? (Math.exp(Math.log(62) * prog(f + 1, z0, z1, theme.ease.in)) - Math.exp(Math.log(62) * zp)) : 0;
  const textBlur = clamp(zoomVel * 0.35, 0, 14);

  // --- Spacing chart: the ball's centre every 2nd frame, like an animator's timing chart. ---
  const dots: { x: number; y: number; o: number }[] = [];
  for (let k = 0; k <= f && k < T.periodLand + 2; k += 2) {
    const s = ball.state(k);
    if (s.contactIndex >= 0 || s.y < -r) continue;
    const age = f - k;
    dots.push({ x: s.x, y: s.y, o: 0.24 + 0.5 * Math.exp(-age / 18) });
  }
  const dotsFade = 1 - prog(f, z0, z0 + 8, theme.ease.out);

  return (
    <AbsoluteFill>
      <BgMesh base={C.ink} glowA={withAlpha(C.paper, 0.055)} glowB={withAlpha(C.orange, 0.07)} />
      <AbsoluteFill
        style={{
          transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) scale(${zoom}) translate(${-cx}px, ${-cy}px)`,
          transformOrigin: "0 0",
        }}
      >
        {/* spacing chart */}
        <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: dotsFade }}>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={3} fill={C.paper} opacity={d.o} />
          ))}
          {impacts.map((fc, i) => {
            const p = sp(f, fc, theme.spring.bouncy);
            if (p <= 0) return null;
            const w = words[i];
            const s = 7 * p;
            return (
              <rect
                key={i}
                x={w.landX - s}
                y={w.top - 2 * r - 26 - s}
                width={s * 2}
                height={s * 2}
                transform={`rotate(45 ${w.landX} ${w.top - 2 * r - 26})`}
                fill="none"
                stroke={C.paper}
                strokeWidth={1.6}
                opacity={0.55}
              />
            );
          })}
        </svg>

        {/* words */}
        <div style={{ filter: textBlur > 0.2 ? `blur(${textBlur}px)` : undefined }}>
          {words.map((w, i) => {
            const fc = impacts[i];
            const appear = fc - 18;
            if (f < appear) return null;
            const inflate = sp(f, fc - 1, theme.spring.bouncy);
            // A lone "I" at hairline weight reads as a pole, so it starts from a medium cut.
            const thinW = w.word === "I" ? 520 : THIN.w;
            // Weight may overshoot (it reads as a pulse); width may not, or words collide.
            const wght = lerp(thinW, BOLD.w, Math.min(inflate, 1.1));
            const wdth = lerp(THIN.d, BOLD.d, Math.min(inflate, 1));
            const dip = dipCurve(f, fc);
            const letters = w.word.split("");
            // Glyph x-centres, for the trampoline falloff around the landing glyph.
            const cur = style(wght, wdth, S);
            const full = measure(w.word, cur);
            let acc = w.cx - full / 2;
            const centres = letters.map((ch) => {
              const gw = measure(ch, cur);
              const c = acc + gw / 2;
              acc += gw;
              return c;
            });
            const landC = centres[LAND_LETTER[i]];
            return (
              <div
                key={w.word}
                style={{
                  position: "absolute",
                  left: w.cx - full / 2 - 0.2 * S,
                  top: baseline - 1.05 * S,
                  height: 1.36 * S,
                  width: full + 0.4 * S,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0.2 * S,
                    top: 1.05 * S - BASE_K * S,
                    display: "flex",
                    ...cur,
                    lineHeight: `${S}px`,
                    color: C.paper,
                    whiteSpace: "pre",
                  }}
                >
                  {letters.map((ch, j) => {
                    const rise = sp(f, appear + j * 1.2, theme.spring.snappy);
                    const fall = Math.exp(-(((centres[j] - landC) / (0.85 * S)) ** 2));
                    const glyphH = (ch === "I" ? CAP_H : X_H) * S;
                    const sy = 1 - (dip * dipPx * fall) / glyphH;
                    const sx = 1 + 0.35 * (1 - sy);
                    return (
                      <span
                        key={j}
                        style={{
                          display: "inline-block",
                          transformOrigin: `50% ${BASE_K * 100}%`,
                          transform: `translateY(${(1 - rise) * 1.25 * S}px) scale(${sx}, ${sy})`,
                          // Fade with the rise so a glyph never peeks out of the mask as a stray dot.
                          opacity: clamp(rise * 2.6 - 0.65),
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* the ball */}
        <div
          style={{
            position: "absolute",
            left: b.x - r,
            top: b.y - r,
            width: 2 * r,
            height: 2 * r,
            borderRadius: "50%",
            background: C.orange,
            boxShadow: `0 0 ${0.9 * r}px ${C.orange}55`,
            transform: `rotate(${b.angle}deg) scale(${b.sAlong}, ${b.sPerp})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
