import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Img, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { fontsReady } from "./fonts";
import { theme } from "./theme";
import { SCENES, T } from "./timeline";
import { Grade, Grain, ImpactSplit, Vignette } from "./components/Finish";
import { Hud } from "./components/Hud";
import { S1Ball } from "./scenes/S1Ball";
import { S2Morph } from "./scenes/S2Morph";
import { S3ThreeD } from "./scenes/S3ThreeD";
import { S4Particles } from "./scenes/S4Particles";
import { S5Liquid } from "./scenes/S5Liquid";
import { S6Grid } from "./scenes/S6Grid";
import { S7Logo } from "./scenes/S7Logo";

const within = (f: number, s: { from: number; to: number }) => f >= s.from && f < s.to;

/**
 * The three.js pass is slow in software GL (~6 s/frame), so the final render can reuse a
 * cached image sequence of it: `npm run three-pass`, then render with --props='{"threeCache":true}'.
 */
const THREE_CACHE = Boolean((getInputProps() as { threeCache?: boolean }).threeCache);

export const ThreePass: React.FC = () => {
  const f = useCurrentFrame();
  return within(f, SCENES.three) ? <S3ThreeD /> : null;
};

/** Chromatic split on the reel's four hardest hits, decaying over ~6 frames. */
const IMPACTS = [T.drop, T.slam, T.burst, T.logoHit];
const impactAt = (f: number) =>
  IMPACTS.reduce((acc, at) => (f >= at && f < at + 10 ? Math.max(acc, 9 * Math.exp(-(f - at) / 2.2)) : acc), 0);

/** Vignette strength per moment: heavier on dark scenes, barely there on light ones. */
const vignetteAt = (f: number) => {
  if (within(f, SCENES.morph)) return f >= T.wipes[1] + 6 ? 0.3 : 0.14;
  if (within(f, SCENES.logo)) return f >= SCENES.logo.from + 8 ? 0.1 : 0.3;
  if (within(f, SCENES.liquid)) return 0.24;
  return 0.32;
};

export const Showreel: React.FC = () => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("fonts"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontsReady.then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  if (!ready) return null;

  // Layer stack, bottom to top: scene (bg mesh + assets + graphics), grade, HUD, grain, vignette.
  return (
    <AbsoluteFill style={{ background: theme.colors.black }}>
      <ImpactSplit amount={impactAt(f)}>
      {within(f, SCENES.ball) && <S1Ball />}
      {within(f, SCENES.morph) && <S2Morph />}
      {within(f, SCENES.three) &&
        (THREE_CACHE ? (
          <Img src={staticFile(`three/f${String(f).padStart(3, "0")}.png`)} style={{ position: "absolute", inset: 0 }} />
        ) : (
          <S3ThreeD />
        ))}
      {within(f, SCENES.particles) && <S4Particles />}
      {within(f, SCENES.liquid) && <S5Liquid />}
      {within(f, SCENES.grid) && <S6Grid />}
      {within(f, SCENES.logo) && <S7Logo />}
      </ImpactSplit>
      <Grade />
      <Hud />
      <Grain />
      <Vignette strength={vignetteAt(f)} />
      <Audio src={staticFile("audio/soundtrack.wav")} />
    </AbsoluteFill>
  );
};
