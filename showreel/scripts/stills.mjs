// Renders chosen frames as PNGs and tiles them into one contact sheet, for review.
// Usage: node scripts/stills.mjs <name> <frame> [frame...]   (or a range like 0-180:15)
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [name = "sheet", ...args] = process.argv.slice(2);
const frames = args.flatMap((a) => {
  const m = a.match(/^(\d+)-(\d+):(\d+)$/);
  if (!m) return [Number(a)];
  const out = [];
  for (let f = Number(m[1]); f <= Number(m[2]); f += Number(m[3])) out.push(f);
  return out;
});
const browserExecutable =
  process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const chromiumOptions = { gl: "swangle" };
const outDir = path.resolve("out/stills", name);
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id: "Showreel", puppeteerInstance: browser, chromiumOptions });
const files = [];
for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(3, "0")}.png`);
  await renderStill({ composition, serveUrl, output, frame, puppeteerInstance: browser, chromiumOptions, overwrite: true });
  files.push(output);
  process.stdout.write(`${frame} `);
}
await browser.close({ silent: true });
execFileSync("python3", [path.resolve("scripts/sheet.py"), path.resolve("out/stills", `${name}.png`), ...files], { stdio: "inherit" });
