// os oito sistemas da casa, na ordem do jardim do site, com a tinta de cada um (guideline §2b)
const SISTEMAS = [
  { g: 've',  nome: 'validade', q: '& estoque', bg: '#4F7A2E', fg: '#FAF7F0', txt: '#446824', cls: 'x' },
  { g: 'co',  nome: 'controle', q: 'de papéis', bg: '#1B1814', fg: '#FAF7F0', txt: '#5A564D', cls: 'x' },
  { g: 'epi', nome: 'entrega',  q: 'epi',       bg: '#7A2463', fg: '#FAF7F0', txt: '#66194F', cls: 'epi' },
  { g: '3d',  nome: 'relevo',   q: '3d',        bg: '#E3A008', fg: '#1B1814', txt: '#8F6400' },
  { g: 'nf',  nome: 'confere',  q: 'nf',        bg: '#0F6E72', fg: '#FAF7F0', txt: '#0B5A5E' },
  { g: 'vi',  nome: 'vitrine',  q: 'de bolso',  bg: '#FF8FE9', fg: '#1B1814', txt: '#8F1A63' },
  { g: 'ad',  nome: 'adega',    q: '',          bg: '#FAF7F0', fg: '#1B1814', txt: '#5A564D', cls: 'adega' },
  { g: '',    nome: 'prospect', q: '',          bg: '#2946D8', fg: '#FAF7F0', txt: '#1E33A8', ponto: true },
];
function icone(s, i, x, y, r = 0) {
  const d = document.createElement('div');
  d.className = 'ic ' + (i.cls || '');
  d.style.cssText = `--s:${s}px;left:${x}px;top:${y}px;background:${i.bg};color:${i.fg};transform:rotate(${r}deg)`;
  d.innerHTML = i.ponto ? `<span class="ponto-fixo ponto-papel" data-pose="parado" data-q="0" data-escala="${(s * 7.8 / 176).toFixed(2)}" style="transform:translate(${s * 0.02}px,0)"></span>` : `<span>${i.g}</span>`;
  document.getElementById('folha').appendChild(d);
  return d;
}
function pontos() {
  document.querySelectorAll('.ponto-fixo').forEach((el) => {
    const q = window.Ponto.quadrosDe(el.dataset.pose)[Number(el.dataset.q) || 0];
    const e = Number(el.dataset.escala) || 2;
    el.innerHTML = `<svg viewBox="0 0 24 16" width="${24 * e}" height="${16 * e}" aria-hidden="true">${q}</svg>`;
  });
}
