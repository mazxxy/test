// render.mjs: fotografa a folha dos fixados (3240 x 1350) inteira e em três posts de 1080 x 1350,
// e monta a prévia do grade do perfil (cada post cortado em 3:4, como o Instagram mostra).
//
// Uso: node render.mjs   (precisa do Playwright: npm i -D playwright)
// No Windows, se o Chromium do Playwright não abrir, use o Edge: $env:EDGE=1; node render.mjs
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

// sem texto LCD: o antialiasing subpixel deixa franja colorida na borda das letras
const args = ['--disable-lcd-text', '--font-render-hinting=none'];
const browser = await pw.chromium.launch(process.env.EDGE ? { channel: 'msedge', args } : { args });
const page = await browser.newPage({ viewport: { width: 3240, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(aqui, 'fixados.html')).href);
await page.waitForSelector('body[data-pronto="1"]');

await page.screenshot({ path: path.join(saida, 'fixados-inteiro.png'), clip: { x: 0, y: 0, width: 3240, height: 1350 } });
for (let i = 0; i < 3; i++) {
  await page.screenshot({ path: path.join(saida, `fixado-${i + 1}.png`), clip: { x: i * 1080, y: 0, width: 1080, height: 1350 } });
  console.log(`png/fixado-${i + 1}.png`);
}

// o grade do perfil: 3:4 no meio de cada post (1012 x 1350), com o vão branco de 3 px do Instagram
const L = 390, A = 520, VAO = 3;
const cel = (i) => `<div style="width:${L}px;height:${A}px;overflow:hidden;position:relative">
  <img src="${pathToFileURL(path.join(saida, `fixado-${i}.png`)).href}" style="position:absolute;height:${A}px;left:${-34 * A / 1350}px"></div>`;
await page.setViewportSize({ width: 3 * L + 2 * VAO, height: A });
await page.setContent(`<body style="margin:0;background:#fff;display:flex;gap:${VAO}px">${cel(1)}${cel(2)}${cel(3)}</body>`);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.screenshot({ path: path.join(aqui, 'previa-grade.png') });
console.log('previa-grade.png');
await browser.close();
