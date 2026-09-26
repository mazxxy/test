// render.mjs dos rascunhos: cada rascunho vira o banner inteiro e a prévia do grade (3:4), e todos
// juntos numa prancha de comparação. Uso: node rascunhos/render.mjs
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'playwright')); }
const aqui = path.dirname(new URL(import.meta.url).pathname);
const args = ['--disable-lcd-text', '--font-render-hinting=none'];
const browser = await pw.chromium.launch({ args });
const page = await browser.newPage({ viewport: { width: 3240, height: 1350 } });
const nomes = ['a-fileira', 'b-adesivos', 'c-telas'];
for (const n of nomes) {
  await page.goto(pathToFileURL(path.join(aqui, n + '.html')).href);
  await page.waitForSelector('body[data-pronto="1"]');
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: path.join(aqui, n + '.png'), clip: { x: 0, y: 0, width: 3240, height: 1350 } });
}
// a prancha: a prévia do grade de cada rascunho, uma embaixo da outra
const L = 390, A = 520, V = 3, c = 34 * A / 1350;
const linha = (n, t) => `<div style="font:600 22px sans-serif;margin:18px 0 8px">${t}</div><div style="display:flex;gap:${V}px">` +
  [0, 1, 2].map((k) => `<div style="width:${L}px;height:${A}px;overflow:hidden;position:relative"><img src="${pathToFileURL(path.join(aqui, n + '.png')).href}" style="position:absolute;height:${A}px;left:${-(k * 1080 + 34) * A / 1350}px"></div>`).join('') + '</div>';
await page.setViewportSize({ width: 3 * L + 2 * V + 40, height: 3 * (A + 60) + 20 });
await page.setContent(`<body style="margin:0;padding:0 20px;background:#fff">${linha('a-fileira', 'A. a fileira de apps')}${linha('b-adesivos', 'B. os adesivos')}${linha('c-telas', 'C. sistema de verdade')}</body>`);
await page.waitForFunction(() => [...document.images].every((i) => i.complete));
await page.screenshot({ path: path.join(aqui, 'comparacao.png'), fullPage: true });
console.log('rascunhos/comparacao.png');
await browser.close();
