// render.mjs: fotografa cada faixa de 1080 px da folha do carrossel.html em png/NN.png e monta a prancha
// a 0,36 (o tamanho em que o feed é visto no celular).
//
// Uso: node render.mjs
// Precisa do Playwright (npm i -D playwright). No Windows, se o Chromium do Playwright não abrir,
// use o Edge instalado: EDGE=1 node render.mjs
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'playwright')); }

const aqui = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const saida = path.join(aqui, 'png');
fs.mkdirSync(saida, { recursive: true });

// sem texto LCD: o antialiasing subpixel deixa franja colorida (azul e laranja) na borda das letras
const args = ['--disable-lcd-text', '--font-render-hinting=none'];
const browser = await pw.chromium.launch(process.env.EDGE ? { channel: 'msedge', args } : { args });
// a folha inteira numa janela só; cada slide é uma faixa de 1080 px dela
const page = await browser.newPage({ viewport: { width: 11880, height: 1350 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await page.goto(pathToFileURL(path.join(aqui, 'carrossel.html')).href);
await page.waitForSelector('body[data-pronto="1"]');

const ids = await page.$$eval('section.s', (els) => els.map((e) => e.id));
for (const [i, id] of ids.entries()) {
  const n = id.slice(1);
  await page.screenshot({ path: path.join(saida, `${n}.png`), clip: { x: i * 1080, y: 0, width: 1080, height: 1350 } });
  console.log(`png/${n}.png`);
}

// a prancha: todos lado a lado a 0,36, com o vão do feed entre eles
const E = 0.36, W = Math.round(1080 * E), H = Math.round(1350 * E), VAO = 16;
const imgs = ids.map((id) => `<img src="${pathToFileURL(path.join(saida, id.slice(1) + '.png')).href}" width="${W}" height="${H}">`).join('');
const largura = VAO + ids.length * (W + VAO);
await page.setViewportSize({ width: largura, height: H + 2 * VAO });
await page.setContent(`<body style="margin:0;background:#D9D4C8;display:flex;gap:${VAO}px;padding:${VAO}px">${imgs}</body>`);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.screenshot({ path: path.join(aqui, 'prancha-036.png') });
console.log('prancha-036.png');
await browser.close();
