import React from "react";
import { Composition } from "remotion";
import { Showreel, ThreePass } from "./Showreel";
import { DURATION, FPS, HEIGHT, WIDTH } from "./timeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Showreel" component={Showreel} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
      {/* The 3D scene alone, for pre-rendering its frames (see Showreel.tsx). */}
      <Composition id="ThreePass" component={ThreePass} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    </>
  );
};
