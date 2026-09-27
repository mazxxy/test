import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { theme } from "./theme";

// Every face the reel uses, loaded before the first frame renders.
// Roboto Flex is the "standard" subset (opsz, wght, wdth, slnt): Chromium applies its
// width axis, which the all-axes build does not get.
export const fontsReady = Promise.all([
  loadFont({
    family: theme.fonts.display,
    url: staticFile("fonts/RobotoFlex.woff2"),
    weight: "100 1000",
    stretch: "25% 151%",
    format: "woff2",
  }),
  loadFont({
    family: theme.fonts.serif,
    url: staticFile("fonts/InstrumentSerif-Italic.woff2"),
    style: "italic",
    format: "woff2",
  }),
  loadFont({
    family: theme.fonts.serif,
    url: staticFile("fonts/InstrumentSerif-Regular.woff2"),
    style: "normal",
    format: "woff2",
  }),
  loadFont({
    family: theme.fonts.mono,
    url: staticFile("fonts/JetBrainsMono.woff2"),
    weight: "100 800",
    format: "woff2",
  }),
]);
