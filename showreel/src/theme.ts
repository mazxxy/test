// theme.ts: the single source of truth for color, type, easing and springs.
// Components never inline a hex value, an easing curve or a spring config.
import { Easing } from "remotion";

export const theme = {
  colors: {
    ink: "#0D0D10", // base
    ink2: "#17171D", // raised ink surfaces, mesh highlights
    graphite: "#2B2B33",
    paper: "#F2EEE6", // light base / type on dark
    paperDim: "#A9A59C",
    orange: "#FF5A1F", // THE hero. One element per frame.
    cobalt: "#2E4BFF", // accent
    cobaltDeep: "#1A2FC4",
    black: "#000000",
    void: "#060608", // page behind the grid wall, darker than ink tiles
    rimLight: "#AFC0FF", // cool back light in the 3D scene
  },
  fonts: {
    display: "Flex", // Roboto Flex, variable: wght 100-1000, wdth 25-151, opsz, slnt
    serif: "Instrument Serif",
    mono: "JetBrains Mono",
  },
  // Linear is forbidden. These are the only curves in the reel.
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // expo out: entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // quint in-out: camera moves, wipes
    in: Easing.bezier(0.7, 0, 0.84, 0), // expo in: exits, suck-ins
    inCubic: Easing.bezier(0.32, 0, 0.67, 0),
    outCubic: Easing.bezier(0.33, 1, 0.68, 1),
    inOutSine: Easing.bezier(0.37, 0, 0.63, 1),
    outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 }, // UI pops, words
    smooth: { damping: 20, stiffness: 90, mass: 1 }, // big elements
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 }, // logos, accents
    jelly: { damping: 7, stiffness: 220, mass: 0.6 }, // squash recoveries
    crisp: { damping: 26, stiffness: 260, mass: 0.7 }, // morphs: fast, tiny overshoot
    heavy: { damping: 18, stiffness: 70, mass: 1.6 }, // camera, heavy objects
  },
} as const;

export type Theme = typeof theme;
