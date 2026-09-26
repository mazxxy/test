// render.mjs: fotografa os 16 quadros da dança do Ponto e monta o GIF e o MP4 (o formato que o
// WhatsApp usa para GIF), com frase e sem frase.
//
// Uso: node render.mjs   (Playwright e ffmpeg no PATH; no Windows, $env:EDGE=1 usa o Edge)
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'playwright')); }

const aqui = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const saida = path.join(aqui, 'saida');
fs.mkdirSync(saida, { recursive: true });

const args = ['--disable-lcd-text', '--font-render-hinting=none'];
const browser = await pw.chromium.launch(process.env.EDGE ? { channel: 'msedge', args } : { args });
const page = await browser.newPage({ viewport: { width: 720, height: 720 } });

for (const [nome, busca] of [['ponto-danca', ''], ['ponto-danca-sem-texto', '?texto=0']]) {
  const pasta = path.join(saida, 'quadros-' + nome);
  fs.rmSync(pasta, { recursive: true, force: true }); fs.mkdirSync(pasta, { recursive: true });
  await page.goto(pathToFileURL(path.join(aqui, 'ponto-danca.html')).href + busca);
  await page.waitForSelector('body[data-pronto="1"]');
  const n = await page.evaluate(() => window.N);
  for (let i = 0; i < n; i++) {
    await page.evaluate((k) => window.quadro(k), i);
    await page.locator('#palco').screenshot({ path: path.join(pasta, `q${String(i).padStart(2, '0')}.png`) });
  }
  const entrada = ['-framerate', '8', '-i', path.join(pasta, 'q%02d.png')];
  // GIF: 8 quadros por segundo (125 ms, a pose da casa), paleta própria, laço infinito
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...entrada, '-vf',
    'scale=540:540:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=full[p];[b][p]paletteuse=dither=none',
    '-loop', '0', path.join(saida, nome + '.gif')]);
  // MP4 para o WhatsApp: a dança 4 vezes (8 s), 720 x 720, sem som
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-stream_loop', '3', ...entrada, '-r', '24',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'baseline', '-crf', '20', '-movflags', '+faststart', '-an',
    path.join(saida, nome + '.mp4')]);
  console.log(nome, fs.statSync(path.join(saida, nome + '.gif')).size, fs.statSync(path.join(saida, nome + '.mp4')).size);
}
await browser.close();
