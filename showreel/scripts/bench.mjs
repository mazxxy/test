// Times steady-state frame renders for a list of quality settings (input props).
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const variants = JSON.parse(process.argv[2]);
for (const q of variants) {
  const inputProps = { q };
  const composition = await selectComposition({ serveUrl, id: "Showreel", puppeteerInstance: browser, chromiumOptions, inputProps });
  const times = [];
  for (const frame of [344, 345, 346]) {
    const t0 = Date.now();
    await renderStill({ composition, serveUrl, output: `out/bench-${frame}.png`, frame, puppeteerInstance: browser, chromiumOptions, inputProps, overwrite: true });
    times.push(((Date.now() - t0) / 1000).toFixed(1));
  }
  console.log(JSON.stringify(q), times.join(" "));
}
await browser.close({ silent: true });
