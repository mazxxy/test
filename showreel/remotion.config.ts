import { Config } from "@remotion/cli/config";

// Chromium from the Playwright install; Remotion needs a headless shell.
const browser = process.env.REMOTION_BROWSER ??
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

Config.setBrowserExecutable(browser);
// Software WebGL (SwiftShader through ANGLE) so the three.js scene renders without a GPU.
Config.setChromiumOpenGlRenderer("swangle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(17);
Config.setPixelFormat("yuv420p");
