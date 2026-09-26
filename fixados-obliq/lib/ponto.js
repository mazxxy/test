// O Ponto (25/09/2026): o mascote do agente. É o ponto azul do "obliq." que criou perna, chapado
// como o Clawd do Claude; os olhos são furos, então o fundo aparece através deles. Aprovado pelo
// Vitor numa prancha de três ("gostei do ponto, é literalmente o ponto").
//
// Cada pose é um estado real do agente, em quadros travados de 125 ms (a pose da casa):
//   parado      esperando um pedido (pisca, olha em volta)
//   procurando  rodando uma busca no Maps (lupa, passinho)
//   escrevendo  a IA escrevendo (lápis na mão, olhando para baixo)
//   achou       deu certo: pula com os olhos em ^ ^ e fica feliz
//   dormindo    desligado ou fora do horário (zzz em tinta-2)
//
// Uso: <span class="ponto" data-pose="parado" data-escala="2"></span> em qualquer lugar da página.
// Um relógio só, de 125 ms, anima todos os que estiverem na tela; trocar data-pose troca a pose.
// Ponto.tocar(el, 'achou', 'parado') toca uma pose uma vez e volta para outra.
(function () {
  const W = 24, H = 16, OX = 3;
  const POSE_MS = 125;

  function grade() {
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const pos = (x, y, c) => { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; };
    const faixa = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) pos(x, y, c); };
    return { g, pos, faixa };
  }

  // As formas do corpo (linhas de cima para baixo, [coluna inicial, final]). O volume se conserva:
  // agachado e amassado ficam mais baixos E mais largos; esticado fica mais alto e mais fino.
  // `braco` é a linha dos bracinhos, `olho` a linha de cima dos olhos, `perna` a altura das pernas.
  const FORMAS = {
    normal: { linhas: [[5, 10], [3, 12], [2, 13], [2, 13], [2, 13], [2, 13], [2, 13], [2, 13], [2, 13], [3, 12]], braco: 6, olho: 3, perna: 2 },
    agachado: { linhas: [[5, 10], [3, 12], [2, 13], [2, 13], [2, 13], [1, 14], [1, 14], [1, 14], [2, 13]], braco: 5, olho: 2, perna: 1 },
    amassado: { linhas: [[4, 11], [2, 13], [2, 13], [1, 14], [1, 14], [1, 14], [1, 14], [2, 13]], braco: 4, olho: 2, perna: 1 },
    esticado: { linhas: [[5, 10], [4, 11], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [4, 11]], braco: 5, olho: 3, perna: 2 },
    // o meio do giro: um pixel mais fino de cada lado, a mesma altura (o Clawd faz igual ao virar)
    estreito: { linhas: [[5, 10], [4, 11], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [3, 12], [4, 11]], braco: 6, olho: 3, perna: 2 },
    // deitado, largado (o Clawd relaxando): largo e baixo, o volume todo espalhado no chão
    deitado: { linhas: [[4, 11], [2, 13], [1, 14], [0, 15], [0, 15], [1, 14]], braco: 4, olho: 2, perna: 1 },
    // empinado (a comemoração do Clawd): o corpo sobe na diagonal, alto e torto, com a ponta de cima
    // para a direita, de onde sai o confete; as pernas ficam embaixo, na parte larga
    empinado: { linhas: [[10, 12], [9, 13], [8, 13], [7, 13], [6, 12], [5, 12], [4, 12], [3, 12], [3, 12], [3, 12], [3, 11]], braco: 6, olho: 4, perna: 2, olhosX: [8, 11] },
  };
  const CHAO = 15; // primeira linha abaixo dos pés

  // B = corpo (acento), S = a lateral do corpo em sombra (o acento mais escuro), K = tinta,
  // G = tinta-2, '.' = vazio (o fundo aparece)
  // dy > 0 é o agachado antigo (respirar, tomar impulso); dy < 0 sobe o corpo inteiro (o pulinho);
  // dx empurra o corpo um pixel para o lado (o balanço de quem está parado).
  //
  // O volume, estudado no Clawd (26/09/2026, vídeo do Vitor): o Clawd não tem mais pixels que o
  // Ponto; ele parece desenhado porque GIRA. `vira` 0 é de frente; 1 é três quartos virado para a
  // direita (a lateral de trás ganha o tom escuro, os olhos correm para a direita e se aproximam, o
  // braço de trás vira um toco na sombra, as pernas se desencontram); 2 é de perfil (um olho só,
  // duas colunas de sombra); 3 é de costas (sem olhos). Negativo espelha: virado para a esquerda.
  // Entre a frente e o três quartos entra a forma 'estreito', o quadro do meio do giro.
  function quadro({ olhos = 'abertos', dy = 0, dx = 0, vira = 0, pernas = 'paradas', forma = null, bracos = 'lado', lapis = null, zs = [], lupa = null, boca = false, vento = null, notebook = false, pontinhos = 0, lagrima = null, escrita = null, tomba = 0, topo = false, espelho = false, estouro = null, confete = null, varinha = null, lente = null, maos = null, aviao = null, bocejo = false, assobio = false, notas = null, papel = null, lupaChao = null } = {}) {
    const t = grade();
    // A CAMADA FINA (26/09/2026, o Vitor: "quando precisa o Clawd tem mais densidade de pixel"): o
    // corpo é de pixel inteiro, mas lupa, cabo, varinha, nota, faísca, confete e aviãozinho são de
    // MEIO pixel. pf(x2, y2, cor) em meias unidades.
    const fino = [];
    const pf = (x2, y2, c) => fino.push([x2, y2, c]);
    const linhaFina = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let k = 0; k <= n; k++) pf(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c); };
    const v = Math.abs(vira);
    const X = OX + dx;
    const f = FORMAS[forma || (dy > 0 ? 'agachado' : 'normal')];
    const alt = pernas === 'encolhidas' ? 1 : f.perna;
    const oy = CHAO - alt - f.linhas.length + Math.min(0, dy);
    f.linhas.forEach(([a, b], i) => t.faixa(oy + i, X + a, X + b, 'B'));
    const mascara = Array.from({ length: H }, () => Array(W).fill(false));
    f.linhas.forEach(([a, b], i) => { for (let x = X + a; x <= X + b; x++) if (oy + i >= 0 && oy + i < H && x >= 0 && x < W) mascara[oy + i][x] = true; });
    const minA = Math.min(...f.linhas.map((l) => l[0])), maxB = Math.max(...f.linhas.map((l) => l[1]));
    const caixa = { olho: oy + f.olho, x0: X + minA, x1: X + maxB + 1, y0: oy, y1: oy + f.linhas.length, r: Math.max(1.5, Math.min(4, f.linhas[0][0] - minA + 0.5)) };
    // a lateral em sombra: uma coluna no três quartos, duas no perfil (a linha de cima fica clara)
    if (v === 1 || v === 2) f.linhas.forEach(([a], i) => { if (i > 0) for (let k = 0; k < v; k++) t.pos(X + a + k, oy + i, 'S'); });
    if (topo) { const [a, b] = f.linhas[0]; t.faixa(oy, X + a, X + b, 'S'); const [a1, b1] = f.linhas[1]; t.pos(X + a1, oy + 1, 'S'); t.pos(X + b1, oy + 1, 'S'); }
    const [ba, bb] = f.linhas[f.braco];
    const by = oy + f.braco;
    if (v === 0 || v === 3) {
      // bracinhos: de lado, um pixel além do corpo em cada ponta; para cima, em diagonal
      if (bracos === 'caidos') { t.pos(X + ba - 1, by + 1, 'B'); t.pos(X + bb + 1, by + 1, 'B'); }
      if (bracos === 'lado') t.faixa(by, X + ba - 2, X + bb + 2, 'B');
      // digitando: os bracinhos sobem e descem um pixel, alternados
      if (bracos === 'digitaA' || bracos === 'digitaB') {
        const a = bracos === 'digitaA' ? 0 : 1;
        t.faixa(by + a, X + ba - 2, X + ba - 1, 'B');
        t.faixa(by + 1 - a, X + bb + 1, X + bb + 2, 'B');
      }
      // pensando: a mão direita no alto da cabeça, coçando
      if (bracos === 'cabeca') {
        t.faixa(by, X + ba - 2, X + ba - 1, 'B');
        t.pos(X + bb + 1, by - 1, 'B'); t.pos(X + bb + 2, by - 2, 'B'); t.pos(X + bb + 2, by - 3, 'B'); t.pos(X + bb + 1, by - 4, 'B');
      }
      // tchauzinho: o esquerdo de lado, o direito acenando entre a diagonal e o vertical
      if (bracos === 'tchauA' || bracos === 'tchauB') {
        t.faixa(by, X + ba - 2, X + ba - 1, 'B');
        const mao = bracos === 'tchauA' ? [[1, -1], [2, -2], [3, -3]] : [[1, -1], [1, -2], [1, -3]];
        for (const [dx2, dy2] of mao) t.pos(X + bb + dx2, by + dy2, 'B');
      }
      if (bracos === 'cima') {
        t.pos(X + ba - 1, by - 1, 'B'); t.pos(X + ba - 2, by - 2, 'B');
        t.pos(X + bb + 1, by - 1, 'B'); t.pos(X + bb + 2, by - 2, 'B');
      }
      // vivaA / vivaB (a comemoração empinada): o braço da frente lá no alto, balançando entre a
      // diagonal e o vertical; o de trás abre para o lado e sobe um pixel
      if (bracos === 'vivaA' || bracos === 'vivaB') {
        const alto = bracos === 'vivaA' ? [[1, -1], [2, -2], [3, -3]] : [[1, -1], [1, -2], [2, -3], [2, -4]];
        for (const [dx2, dy2] of alto) t.pos(X + bb + dx2, by + dy2, 'B');
        t.pos(X + ba - 1, by, 'B'); t.pos(X + ba - 2, by - (bracos === 'vivaA' ? 1 : 0), 'B');
      }
    } else {
      // virado: o braço da frente faz o gesto; o de trás é um toco na sombra (some no perfil)
      if (v === 1) t.pos(X + ba - 1, bracos === 'cima' ? by - 1 : by, 'S');
      if (bracos === 'cima') { t.pos(X + bb + 1, by - 1, 'B'); t.pos(X + bb + 2, by - 2, 'B'); }
      else if (bracos === 'escreveA' || bracos === 'escreveB') { const d = bracos === 'escreveA' ? 0 : 1; t.pos(X + bb + 1, by + 1, 'B'); t.pos(X + bb + 2, by + 1 + d, 'B'); }
      else if (bracos === 'segura') { t.pos(X + bb + 1, by, 'B'); t.pos(X + bb + 2, by - 1, 'B'); }
      else if (bracos !== 'nenhum') t.faixa(by, X + bb + 1, X + bb + 2, 'B');
    }
    const base = oy + f.linhas.length;
    const e = f.olho;
    const furo = (x, y) => t.pos(X + x, oy + y, '.');
    // onde ficam os olhos: de frente, no três quartos (para a direita e mais juntos), no perfil
    const OLHOS = [[[(f.olhosX || [5])[0], -1], [(f.olhosX || [0, 10])[1], 1]], [[7, -1], [11, 1]], [[11, 1]], []][v];
    for (const [x, lado] of OLHOS) {
      const estilo = olhos === 'piscaE' ? (lado < 0 ? 'fechados' : 'abertos') : olhos === 'piscaD' ? (lado > 0 ? 'fechados' : 'abertos') : olhos;
      if (estilo === 'abertos') { furo(x, e); furo(x, e + 1); }
      if (estilo === 'fechados') { furo(x, e + 1); furo(x + lado, e + 1); }
      if (estilo === 'esquerda') { furo(x - 1, e); furo(x - 1, e + 1); }
      if (estilo === 'direita') { furo(x + 1, e); furo(x + 1, e + 1); }
      if (estilo === 'baixo') { furo(x, e + 1); furo(x, e + 2); }
      if (estilo === 'cima') { furo(x, e - 1); furo(x, e); }
      // triste: o canto de dentro de cada olho sobe (a sobrancelha de quem ficou chateado)
      if (estilo === 'triste') { furo(x, e + 1); furo(x - lado, e); }
      if (estilo === 'feliz') { furo(x, e); furo(x - 1, e + 1); furo(x + 1, e + 1); }
      // setaD / setaE: os dois olhos fechados em seta para o mesmo lado (>> ou <<), de quem olha
      // para lá disfarçando, assobiando
      if (estilo === 'setaD') { furo(x, e); furo(x + 1, e + 1); furo(x, e + 2); }
      if (estilo === 'setaE') { furo(x + 1, e); furo(x, e + 1); furo(x + 1, e + 2); }
      // contente: fechado em curva para baixo (◡), de quem está de boa, cantarolando
      if (estilo === 'contente') { furo(x - 1, e); furo(x, e + 1); furo(x + 1, e); }
      // surpreso: o olho arregalado, um quadrado de 2 por 2 que abre para fora
      if (estilo === 'surpreso') { furo(x, e); furo(x + lado, e); furo(x, e + 1); furo(x + lado, e + 1); }
      if (estilo === 'baixoDir') { furo(x + 1, e + 1); furo(x + 1, e + 2); }
      // apertado: > < (a ponta de cada olho aponta para o meio)
      if (estilo === 'apertado') { furo(x + lado, e); furo(x, e + 1); furo(x + lado, e + 2); }
      // espiando de canto: o olho de trás abre e olha para trás; o da frente continua apertado
      if (estilo === 'espia') { if (lado < 0) { furo(x - 1, e); furo(x - 1, e + 1); } else { furo(x + lado, e); furo(x, e + 1); furo(x + lado, e + 2); } }
    }
    // a boquinha em "o" (um furo de 2 px no meio, abaixo dos olhos) e o vento saindo para a direita
    if (boca && v === 0) { furo(7, e + 3); furo(8, e + 3); }
    if (boca && v === 1) { furo(9, e + 3); furo(10, e + 3); }
    if (vento !== null) {
      const vx = X + f.linhas[f.braco][1] + 4 + vento; // começa depois da ponta do bracinho
      for (const [dx2, dy2, n] of [[0, 0, 3], [1, -2, 2], [1, 2, 2]]) for (let k = 0; k < n; k++) t.pos(vx + dx2 + k, oy + e + 3 + dy2, 'G');
    }
    // as pernas: de frente, em dois pares; virado, desencontradas, com a de trás na sombra
    const PERNAS = v === 1 || v === 2
      ? { paradas: [5, 7, 10, 12], passoA: [4, 6, 10, 13], passoB: [6, 8, 9, 11], encolhidas: [5, 7, 10, 12], esticadas: [6, 7, 10, 11] }
      : { paradas: [4, 6, 9, 11], passoA: [3, 6, 9, 12], passoB: [5, 7, 8, 10], encolhidas: [4, 6, 9, 11], esticadas: [5, 6, 9, 10] };
    PERNAS[pernas].forEach((x, i) => { for (let k = 0; k < alt; k++) t.pos(X + x, base + k, (v === 1 || v === 2) && i === 0 ? 'S' : 'B'); });
    if (lapis) {
      const lx = X + 15, ly = by + lapis.dy;
      t.pos(lx + 1, ly - 1, 'K'); t.pos(lx + 2, ly - 2, 'K'); t.pos(lx + 3, ly - 3, 'K'); t.pos(lx + 4, ly - 4, 'B');
      t.pos(lx, ly, 'G');
    }
    if (lupa && v === 0) {
      const cx = X - 3 + lupa.dx, cy = oy + 3;
      for (const [x, y] of [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]]) t.pos(cx + x, cy + y, 'K');
      t.pos(cx + 3, cy + 4, 'K'); t.pos(X, by, 'B');
    }
    // virado, a lupa vai na frente, na mão que segura, e balança um pixel com o passo
    if (lupa && v > 0) {
      const cx = X + bb + 2, cy = by - 6 + (lupa.dy || 0);
      for (const [x, y] of [[1, 0], [2, 0], [0, 1], [3, 1], [0, 2], [3, 2], [1, 3], [2, 3]]) t.pos(cx + x, cy + y, 'K');
      t.pos(cx, cy + 4, 'K');
    }
    // escrevendo virado (como o Clawd varrendo): a folha no chão, o lápis da mão até a folha e o
    // risco que cresce a cada pose. escrita = { ponta, riscos } (a ponta anda sobre a folha)
    if (escrita && v > 0) {
      const fx = X + bb + 2;
      t.faixa(CHAO, fx, fx + 6, 'G');
      for (let k = 0; k < Math.min(escrita.riscos, 7); k++) t.pos(fx + k, CHAO, 'K');
      const hx = X + bb + 2, hy = by + 1 + (bracos === 'escreveB' ? 1 : 0);
      const tx = fx + Math.min(escrita.ponta, 6), ty = CHAO - 1;
      // o lápis: uma linha da mão até a ponta (a ponta em grafite, o resto em tinta)
      const n = Math.max(Math.abs(tx - hx), Math.abs(ty - hy));
      for (let k = 1; k <= n; k++) t.pos(Math.round(hx + ((tx - hx) * k) / n), Math.round(hy + ((ty - hy) * k) / n), k === n ? 'G' : 'K');
    }
    // o notebook visto por trás: a tampa cinza com o pontinho azul no meio, e a mesa escondendo as
    // pernas. Só os olhos (olhando a tela) e os bracinhos digitando aparecem por cima e dos lados.
    if (notebook) {
      const topo = oy + 6;
      t.faixa(topo, X + 3, X + 12, 'K');
      for (let y = topo + 1; y <= topo + 4; y++) { t.pos(X + 3, y, 'K'); t.faixa(y, X + 4, X + 11, 'G'); t.pos(X + 12, y, 'K'); }
      t.pos(X + 7, topo + 2, 'B'); t.pos(X + 8, topo + 2, 'B');
      t.faixa(topo + 5, X - 1, X + 16, 'K');
      for (let y = topo + 6; y < 16; y++) t.faixa(y, X - 1, X + 16, '.');
    }
    // a lágrima escorrendo embaixo do olho esquerdo (lagrima = quantos pixels já desceu)
    if (lagrima !== null) t.pos(X + 5, oy + f.olho + 2 + lagrima, 'G');
    // os pontinhos de quem está pensando, acima da cabeça, à direita (um, dois, três)
    for (let k = 0; k < pontinhos; k++) t.pos(X + 14 + k * 2, oy - 1 - k, 'G');
    // A VARINHA (escrevendo): o lápis que o Vitor viu como varinha virou varinha de verdade. Na
    // conversa quem escreve é o lápis do balão, sozinho; o Ponto rege com a varinha e solta faísca.
    // varinha = { pos: 'A' (no alto) | 'B' (no meio) | 'C' (embaixo), faiscas: [[x, y, cor]] }
    if (varinha) {
      const hx = X + bb, hy = by;
      const POS = {
        A: { braco: [[1, -1], [2, -2]], ponta: [5, -5] },
        B: { braco: [[1, 0], [2, 0]], ponta: [5, -3] },
        C: { braco: [[1, 0], [2, 1]], ponta: [5, 1] },
      }[varinha.pos];
      for (const [a, b] of POS.braco) t.pos(hx + a, hy + b, 'B');
      const [ma, mb] = POS.braco[1];
      const tx = 2 * (hx + POS.ponta[0]) + 1, ty = 2 * (hy + POS.ponta[1]) + 1;
      // a vara fina, da mão até a ponta, e a estrelinha na ponta (o miolo azul, as pontas claras)
      linhaFina(2 * (hx + ma) + 2, 2 * (hy + mb) + 1, tx, ty, 'K');
      pf(tx, ty, 'B'); pf(tx - 1, ty, 'L'); pf(tx + 1, ty, 'L'); pf(tx, ty - 1, 'L'); pf(tx, ty + 1, 'L');
      for (const [fx, fy, cor] of varinha.faiscas || []) pf(2 * (X + fx) + ((fx + fy) & 1), 2 * (by + fy) + (fx & 1), cor === 'B' ? 'L' : cor);
    }
    // A LENTE (procurando): a lupa na frente de um olho, que aparece grande lá dentro; o cabo desce
    // até a mão. lente = { dy } (o balanço do passo)
    if (lente) {
      // a lente de 6 por 6 (cantos arredondados) com o olho grande, 2 por 2, bem no meio dela e na
      // mesma altura do outro olho (a primeira, de 5 por 5, deixava o olho grande torto, fora do centro)
      const ly = oy + e + (lente.dy || 0);
      const ox = X + 8;
      for (let k = 1; k <= 4; k++) { t.pos(ox + k, ly - 2, 'K'); t.pos(ox + k, ly + 3, 'K'); t.pos(ox, ly - 2 + k, 'K'); t.pos(ox + 5, ly - 2 + k, 'K'); }
      for (let yy = ly - 1; yy <= ly + 2; yy++) for (let xx = ox + 1; xx <= ox + 4; xx++) t.pos(xx, yy, 'B');
      for (const [a2, b2] of [[2, 0], [3, 0], [2, 1], [3, 1]]) t.pos(ox + a2, ly + b2, '.');
      t.pos(ox + 5, ly + 3, 'K'); t.pos(ox + 6, ly + 4, 'K');
      t.faixa(by, X + bb + 1, X + bb + 2, 'B');
    }
    // AS MÃOS NOS OLHOS (a senha): o braço sai pelo lado do corpo, sobe, e a mão (na sombra, com os
    // dedos separados em cima) tapa o olho; maos = 'tapa' | 'espia' (os dedos da mão direita abrem e
    // o olho aparece no vão, espiando)
    if (maos) {
      const r = (x, y, c) => t.pos(X + x, oy + y, c);
      const bY = f.braco;
      for (const [lado, x0, bx] of [[-1, 4, ba - 1], [1, 9, bb + 1]]) {
        r(bx, bY, 'B'); r(bx, bY - 1, 'B');                     // o braço, de fora do corpo
        r(bx - lado, bY - 2, 'S');                              // o antebraço entrando no rosto
        for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) r(x0 + xx, e - 1 + yy, 'S');
        r(x0 + 1, e - 1, 'B');                                  // o vão entre os dedos, em cima
      }
      if (maos === 'espia') { r(10, e - 1, 'B'); r(10, e, '.'); r(10, e + 1, '.'); }
    }
    // AS NOTINHAS do assobio (sem olhar, versão A): sobem da boca para a direita, uma atrás da outra
    if (notas !== null) {
      // a nota ♪ em meio pixel: a cabeça, a haste e a bandeirinha
      const nota = (x2, y2, cor) => { for (const [a, b] of [[0, 4], [1, 4], [0, 5], [1, 5], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [3, 1], [4, 2]]) pf(x2 + a, y2 + b, cor); };
      for (let k = 0; k < 2; k++) {
        const fase = (notas + k * 4) % 8;
        nota(2 * (X + 15) + fase, 2 * (oy + e) - fase * 2 - 4, k ? 'G' : 'K');
      }
    }
    // O PAPEL na frente dos olhos (sem olhar, versão B): uma folhinha cinza com duas linhas escritas,
    // segurada pelas duas mãos; papel = quanto ela desceu (na espiada, desce e os olhos aparecem)
    if (papel !== null) {
      const py0 = oy + e - 1 + papel;
      for (let yy = 0; yy < 4; yy++) t.faixa(py0 + yy, X + 3, X + 12, 'G');
      t.faixa(py0 + 1, X + 5, X + 9, 'K'); t.faixa(py0 + 2, X + 5, X + 7, 'K');
      t.pos(X + 2, py0 + 2, 'B'); t.pos(X + 1, py0 + 3, 'B'); t.pos(X + 13, py0 + 2, 'B'); t.pos(X + 14, py0 + 3, 'B');
    }
    // A LUPA NO CHÃO (procurando): virado e curvado, ele passa a lupa rente ao chão, na frente dos pés
    // (fora do corpo), e o cabo fino sobe até a mão. lupaChao = { x } (em meios pixels para a frente)
    if (lupaChao) {
      const x2 = 2 * (X + bb + 2) + lupaChao.x, y2 = 2 * CHAO - 6;
      for (const [a, b] of [[1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [5, 1], [0, 2], [5, 2], [0, 3], [5, 3], [0, 4], [5, 4], [1, 5], [2, 5], [3, 5], [4, 5]]) pf(x2 + a, y2 + b, 'K');
      pf(x2 + 1, y2 + 1, 'L'); pf(x2 + 2, y2 + 1, 'L'); pf(x2 + 1, y2 + 2, 'L'); // o brilho do vidro
      const hx = X + bb + 1, hy = by + 1;
      t.pos(hx, hy, 'B');
      linhaFina(2 * hx + 2, 2 * hy + 1, x2 + 4, y2 - 1, 'K');
    }
    // O AVIÃOZINHO de papel saindo do notebook quando a mensagem vai (aviao = quantos passos já voou)
    if (aviao !== null && aviao >= 0) {
      // o aviãozinho em meio pixel: a asa clara em cima, o corpo cinza, o bico em tinta
      const x2 = 2 * (X + 13) + aviao * 4, y2 = 2 * (oy + 5) - aviao * 2;
      for (const [a, b, c] of [[2, 0, 'L'], [3, 0, 'L'], [0, 1, 'G'], [1, 1, 'G'], [2, 1, 'G'], [3, 1, 'G'], [4, 1, 'K'], [1, 2, 'G'], [2, 2, 'G']]) pf(x2 + a, y2 + b, c);
    }
    // o assobio: a boquinha pequena, um furo só, puxada para o lado das notas (com sombra em volta
    // virou mancha)
    if (assobio && v === 0) furo(9, e + 3);
    // o bocejo: a boca abre grande (2 por 2) embaixo dos olhos fechados
    if (bocejo && v === 0) { furo(7, e + 3); furo(8, e + 3); furo(7, e + 4); furo(8, e + 4); }
    if (estouro) {
      const [a0] = f.linhas[0];
      const tx = 2 * (X + a0 + 1) + 1, ty = 2 * oy - 1;
      const CORES = ['B', 'L', 'K', 'G', 'L', 'B'];
      for (let k = 0; k < 22; k++) {
        const r1 = Math.abs(Math.sin(k * 12.9898 + 4.1) * 43758.5453) % 1, r2 = Math.abs(Math.sin(k * 78.233 + 1.7) * 43758.5453) % 1;
        const vx = (r1 - 0.5) * 4.4 + 0.8, vy = -2.2 - r2 * 2.2, tt = estouro.t;
        if (tt > 6 || (tt > 4 && k % 3 === 0)) continue;
        const x = Math.round(tx + vx * tt * 2.4), y = Math.round(ty + vy * tt * 2.2 + 1.1 * tt * tt);
        const c = CORES[k % CORES.length];
        pf(x, y, c);
        if (k % 2 === 0) pf(x + (vx > 0 ? 1 : -1), y + 1, c); // metade vira tracinho, como no Clawd
      }
    }
    if (confete !== null) {
      const PECAS = [[1, 'B'], [4, 'G'], [7, 'K'], [11, 'B'], [14, 'G'], [17, 'B'], [19, 'K'], [21, 'G']];
      PECAS.forEach(([cx, cor], k) => {
        const y = ((confete * (1 + (k % 3)) + k * 5) % 12) - 2;
        const xx = cx + ((confete + k) % 4 < 2 ? 0 : 1);
        if (y >= 0 && y < oy + 2) t.pos(xx, y, cor);
      });
    }
    for (const [zx, zy] of zs) {
      // um Z de verdade, 4 por 4 (o de 3 por 3 lia como um I)
      for (const [x, y] of [[0, 0], [1, 0], [2, 0], [3, 0], [2, 1], [1, 2], [0, 3], [1, 3], [2, 3], [3, 3]]) t.pos(zx + x, zy + y, 'G');
    }
    // virado para a esquerda: o mesmo desenho, espelhado no eixo do corpo
    let g = t.g;
    let m = mascara;
    let fn = fino;
    if (vira < 0 || espelho) {
      const eixo = 2 * X + 15;
      const espelha = (grade2, fora) => grade2.map((linha) => linha.map((_, x) => { const o = eixo - x; return o >= 0 && o < W ? linha[o] : fora; }));
      g = espelha(g, '.');
      m = espelha(m, false);
      fn = fino.map(([x2, y2, c]) => [2 * eixo + 1 - x2, y2, c]);
    }
    const r = tomba ? tombar(g, m, caixa, tomba, fn) : g;
    if (!tomba) r.fino = fn;
    return r;
  }

  // TOMBAR (26/09/2026, o Vitor: "não é tombar a cabeça, é tombar tudo, tipo levantar a perna e
  // deixar o corpo torto"). O que o Clawd faz ao tombar não é girar: o corpo INCLINA. Cada linha do
  // corpo desliza para o lado tanto mais quanto mais alta ela está (em degraus limpos, a linha
  // inteira anda junto, então o olho nunca quebra), as pernas ficam em pé, e a perna do lado de cima
  // sai do chão. tomba é em graus; positivo tomba para a direita. (Duas tentativas de girar de
  // verdade, por vizinho mais próximo e por três cisalhamentos, esburacaram o olho e soltaram as
  // pernas: num desenho de 12 pixels, girar destrói; inclinar lê como tombo.)
  function tombar(g, mascara, caixa, graus, fino = []) {
    const corpo = (c) => c === 'B' || c === 'S';
    // a base: a primeira linha abaixo do corpo (onde as pernas começam)
    const base = caixa.y1;
    let yPe = H - 1;
    while (yPe > 0 && !g[yPe].some(corpo)) yPe--;
    const k = Math.tan((graus * Math.PI) / 180);
    const out = Array.from({ length: H }, () => Array(W).fill('.'));
    for (let y = 0; y < H; y++) {
      // o rosto (duas linhas acima do olho até três abaixo: olho, boca, lente) anda num bloco só,
      // senão o degrau cai no meio do olho e ele quebra em dois
      const yy = y >= caixa.olho - 2 && y <= caixa.olho + 3 ? caixa.olho + 1 : y;
      const d = y < base ? Math.round(k * (base - yy - 0.5)) : 0;
      for (let x = 0; x < W; x++) { const nx = x + d; if (g[y][x] !== '.' && nx >= 0 && nx < W) out[y][nx] = g[y][x]; }
      // o furo do olho também anda com a linha (o que era furo dentro do corpo continua furo)
      for (let x = 0; x < W; x++) { const nx = x + d; if (g[y][x] === '.' && mascara[y][x] && nx >= 0 && nx < W) out[y][nx] = '.'; }
    }
    // a perna do lado de cima sai do chão: a do lado oposto ao tombo perde o pé (um pixel; dois,
    // se o tombo for grande)
    const pes = out[yPe].map((c, x) => (corpo(c) && !mascara[yPe][x] ? x : -1)).filter((x) => x >= 0);
    if (pes.length > 1) {
      const lado = graus > 0 ? Math.min(...pes) : Math.max(...pes);
      out[yPe][lado] = '.';
      if (Math.abs(graus) >= 14 && yPe - 1 >= base) out[yPe - 1][lado] = '.';
    }
    // a camada fina anda com a linha em que está
    out.fino = fino.map(([x2, y2, c]) => {
      const y = Math.floor(y2 / 2);
      const yy = y >= caixa.olho - 2 && y <= caixa.olho + 3 ? caixa.olho + 1 : y;
      const d = y < base ? Math.round(k * (base - yy - 0.5)) : 0;
      return [x2 + 2 * d, y2, c];
    });
    return out;
  }

  const rep = (n, f) => Array.from({ length: n }, f);

  // Vira purpurina: cada pixel do corpo tem a sua vez de soltar (um sorteio fixo por posição); solto,
  // ele sobe e se espalha, piscando entre o azul e o cinza, e some quatro poses depois.
  function purpurina() {
    const base = quadro({ olhos: 'feliz' });
    const sorte = (x, y, k) => { const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
    const N = 10;
    return rep(N, (_, i) => {
      const g = Array.from({ length: H }, () => Array(W).fill('.'));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (base[y][x] === '.') continue;
        const solta = sorte(x, y, 1) * (N - 3); // em que pose esse pixel solta
        if (i < solta) { g[y][x] = base[y][x]; continue; }
        const vida = i - solta;
        if (vida > 4 || sorte(x, y, 2) < 0.45) continue; // metade vira brilho, metade some na hora
        const nx = Math.round(x + (sorte(x, y, 3) - 0.5) * vida * 3);
        const ny = Math.round(y - vida * (1 + sorte(x, y, 4) * 1.5));
        if (ny >= 0 && ny < H && nx >= 0 && nx < W) g[ny][nx] = (i + x + y) % 3 ? 'B' : 'G';
      }
      return g;
    });
  }
  const SEQUENCIAS = {
    // parado: respira balançando um pixel, pisca, vira o corpo para olhar um lado e o outro, e dá
    // uma piscadinha de um olho só (o Clawd faz isso parado)
    parado: () => [
      ...rep(6, () => quadro()),
      quadro({ olhos: 'fechados' }),
      ...rep(3, () => quadro()),
      ...rep(3, () => quadro({ dx: 1 })),
      ...rep(3, () => quadro()),
      quadro({ forma: 'estreito', vira: 1 }),
      ...rep(2, () => quadro({ vira: 1 })),
      quadro({ vira: 1, tomba: 8 }),
      ...rep(3, () => quadro({ vira: 1, tomba: 16 })),
      quadro({ vira: 1, tomba: 8 }),
      quadro({ forma: 'estreito', vira: 1 }),
      ...rep(2, () => quadro()),
      quadro({ forma: 'estreito', vira: -1 }),
      ...rep(4, () => quadro({ vira: -1 })),
      quadro({ vira: -1, olhos: 'fechados' }),
      quadro({ forma: 'estreito', vira: -1 }),
      ...rep(3, () => quadro()),
      ...rep(3, () => quadro({ olhos: 'piscaD' })),
      ...rep(3, () => quadro({ dx: -1 })),
      ...rep(2, () => quadro()),
      // espreguiça: estica com os braços para cima, boceja de olho fechado e desmonta
      quadro({ forma: 'agachado', olhos: 'apertado' }),
      quadro({ forma: 'esticado', bracos: 'cima', olhos: 'apertado', pernas: 'esticadas' }),
      ...rep(3, () => quadro({ forma: 'esticado', bracos: 'cima', olhos: 'apertado', pernas: 'esticadas', bocejo: true })),
      quadro({ forma: 'agachado', olhos: 'apertado' }),
      ...rep(3, () => quadro()),
    ],
    // procurando (escolhido pelo Vitor, 26/09/2026): virado e curvado para a frente, passa a lupa rente
    // ao chão, para a frente e para trás, com os olhos atrás dela; pisca, vira e varre do outro lado
    procurando: () => {
      const varre = (sv) => [0, 1, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1].map((k, i) => quadro({
        vira: sv, bracos: 'nenhum', lupaChao: { x: k }, olhos: i === 5 ? 'fechados' : 'baixoDir',
        tomba: (6 + k * 2) * sv, pernas: i % 4 < 2 ? 'passoA' : 'paradas',
      }));
      return [...varre(1), quadro({ forma: 'estreito', vira: 1 }), quadro({ forma: 'estreito', vira: -1 }), ...varre(-1), quadro({ forma: 'estreito', vira: -1 }), quadro({ forma: 'estreito', vira: 1 })];
    },
    // escrevendo: virado para o texto, rege com a varinha (alto, meio, baixo, com pausas nas pontas
    // do gesto) e cada batida solta faísca que sobe e apaga; de vez em quando um floreio e uma piscada.
    // Na conversa, o lápis do balão escreve sozinho: parece que o Ponto o comanda por magia.
    escrevendo: () => {
      const GESTO = ['A', 'A', 'B', 'C', 'C', 'B', 'A', 'A', 'B', 'C', 'C', 'B', 'A', 'B', 'A', 'B', 'C', 'C', 'C', 'B'];
      const PONTA = { A: [18, -5], B: [18, -3], C: [18, 1] };
      return GESTO.map((pos, i) => {
        const faiscas = [];
        for (let idade = 0; idade < 3; idade++) {
          const antes = GESTO[(i - idade + GESTO.length) % GESTO.length];
          const [tx, ty] = PONTA[antes];
          if (idade === 0) continue;
          faiscas.push([tx + (idade % 2 ? 1 : -1), ty - idade - 1, idade === 1 ? 'B' : 'G']);
          if (antes === 'C' || antes === 'A') faiscas.push([tx - idade, ty - idade, 'G']);
        }
        return quadro({ vira: 1, olhos: i === 15 ? 'fechados' : 'baixoDir', bracos: 'nenhum', varinha: { pos, faiscas }, tomba: pos === 'A' ? -8 : pos === 'C' ? 8 : 0 });
      });
    },
    // achou: o olho arregala, agacha, pula com os braços para cima, cai amassado e comemora
    // tombando de um lado para o outro com confete caindo (o Clawd comemorando)
    // achou (estudado no Clawd comemorando, 26/09/2026): o olho arregala, ele amassa rente ao chão
    // (topo em sombra, olho ^ ^), EMPINA na diagonal e a ponta estoura em confete fino; amassa de novo
    // e empina para o outro lado. O contraste entre achatado e empinado é que dá a expressão.
    achou: () => {
      const amassa = (lado, t) => quadro({ forma: 'amassado', topo: true, olhos: 'feliz', bracos: 'lado', espelho: lado < 0, estouro: t === null ? null : { t } });
      // empinado: o corpo esticado para cima e tombado inteiro para o lado, numa perna só, com os braços
      // no alto (o da frente balança); o confete sai do alto da cabeça e acompanha o tombo
      const empina = (lado, t) => quadro({ forma: 'esticado', olhos: 'feliz', bracos: t % 2 ? 'vivaB' : 'vivaA', espelho: lado < 0, estouro: { t }, tomba: 16 * lado, pernas: 'esticadas' });
      return [
        quadro({ olhos: 'surpreso' }),
        quadro({ olhos: 'surpreso' }),
        amassa(1, null), amassa(1, null),
        empina(1, 0), empina(1, 1), empina(1, 2),
        amassa(1, 3), amassa(1, 4),
        empina(-1, 0), empina(-1, 1), empina(-1, 2),
        amassa(-1, 3), amassa(-1, 4),
        empina(1, 0), empina(1, 1), empina(1, 2),
        amassa(1, 3), amassa(1, 5),
        quadro({ olhos: 'feliz' }), quadro({ olhos: 'feliz' }), quadro({ olhos: 'piscaD' }),
      ];
    },
    // enviando: atrás do notebook, digitando; de vez em quando olha para você e volta
    notebook: () => rep(24, (_, i) => quadro({
      notebook: true,
      bracos: i % 2 ? 'digitaA' : 'digitaB',
      olhos: i >= 16 && i < 21 ? 'direita' : i === 9 ? 'fechados' : 'baixo',
      // a mensagem foi: o aviãozinho sai do notebook e voa para a direita, e ele acompanha com o olho
      aviao: i >= 16 && i < 21 ? i - 16 : null,
    })),
    // pensando: olha para cima, coça a cabeça, os pontinhos aparecem um a um
    pensando: () => rep(16, (_, i) => quadro({
      olhos: i === 13 ? 'fechados' : 'cima',
      bracos: i % 4 < 2 ? 'cabeca' : 'lado',
      pontinhos: Math.min(3, Math.floor((i % 8) / 2)),
    })),
    // triste, quando a pessoa interrompe: agachado, bracinhos caídos, uma lágrima que escorre e some
    triste: () => rep(24, (_, i) => quadro({
      forma: 'agachado',
      olhos: i === 19 ? 'fechados' : 'triste',
      bracos: 'caidos',
      tomba: i >= 14 && i < 20 ? -10 : 0,
      lagrima: i >= 4 && i < 12 ? Math.floor((i - 4) / 2) : null,
    })),
    // tchauzinho de despedida (o Ponto extra, antes de virar purpurina)
    tchau: () => rep(8, (_, i) => quadro({ olhos: 'feliz', bracos: i % 2 ? 'tchauB' : 'tchauA' })),
    purpurina: () => purpurina(),
    vazio: () => [Array.from({ length: H }, () => Array(W).fill('.'))],
    // entrando pela esquerda, andando
    andando: () => rep(4, (_, i) => quadro({ vira: 1, olhos: 'direita', pernas: i % 2 ? 'passoB' : 'passoA', dy: i % 2 ? -1 : 0 })),
    // parado há pouco tempo: olha para os lados, pisca, olha de novo
    olhandoEmVolta: () => [
      ...rep(5, () => quadro({ olhos: 'esquerda' })), ...rep(3, () => quadro()), ...rep(5, () => quadro({ olhos: 'direita' })),
      ...rep(4, () => quadro()), quadro({ olhos: 'fechados' }), ...rep(2, () => quadro()), ...rep(3, () => quadro({ olhos: 'cima' })), ...rep(3, () => quadro()),
    ],
    // o pulo de balão em balão (a conversa move o Ponto; estas são as poses de cada fase)
    // cada fase é um quadro só; a conversa troca a fase a cada pose de 125 ms
    agachado: () => [quadro({ forma: 'agachado', olhos: 'baixo' })],        // impulso, mirando o balão novo
    decola: () => [quadro({ forma: 'esticado', bracos: 'cima', olhos: 'cima', pernas: 'esticadas' })],
    alto: () => [quadro({ bracos: 'cima', pernas: 'encolhidas' })],       // o instante parado no topo
    caindo: () => [quadro({ bracos: 'cima', pernas: 'esticadas', olhos: 'baixo' })],
    impacto: () => [quadro({ forma: 'amassado', olhos: 'fechados' })],
    recupera: () => [quadro({ forma: 'agachado' })],
    // assopra os farelos da borracha: enche o peito, sopra com a boquinha em "o", volta
    assoprando: () => [
      quadro({ forma: 'esticado', olhos: 'fechados' }),
      quadro({ forma: 'esticado', olhos: 'fechados' }),
      ...[0, 1, 2, 2].map((v) => quadro({ olhos: 'fechados', boca: true, vento: v })),
      quadro(),
    ],
    ar: () => [quadro({ pernas: 'encolhidas' })],
    // olhando a mensagem que você mandou (à direita) e espiando o campo enquanto você digita
    // olhando para um lado: o corpo vira em três quartos para lá (não só os olhos)
    olhando: () => [...rep(8, () => quadro({ vira: 1, olhos: 'direita' })), quadro({ vira: 1, olhos: 'fechados' }), ...rep(7, () => quadro({ vira: 1, olhos: 'direita' }))],
    olhandoEsquerda: () => [...rep(8, () => quadro({ vira: -1, olhos: 'direita' })), quadro({ vira: -1, olhos: 'fechados' }), ...rep(7, () => quadro({ vira: -1, olhos: 'direita' }))],
    espiando: () => [...rep(10, () => quadro({ olhos: 'baixo' })), quadro({ olhos: 'fechados' }), ...rep(5, () => quadro({ olhos: 'baixo' }))],
    // dormindo largado no chão (o Clawd relaxando): respira subindo um pixel, e os z sobem
    dormindo: () => rep(24, (_, i) => {
      const fase = i % 12;
      const zs = [[18, 6 - Math.floor(fase / 4)]];
      if (fase >= 6) zs.push([20, 2 - Math.floor((fase - 6) / 3)]);
      return quadro({ olhos: 'fechados', forma: i % 12 < 6 ? 'deitado' : 'amassado', pernas: 'encolhidas', bracos: 'nenhum', zs });
    }),
    // O PC SEM NINGUÉM (a linha dos agentes, sem agente ligado): só o notebook visto por trás, no
    // mesmo lugar em que ele fica quando o Ponto está sentado, com a luzinha da tampa piscando devagar
    // (em espera)
    pcVazio: () => rep(16, (_, i) => {
      const g = quadro({ notebook: true });
      const topo = CHAO - 2 - 10 + 6; // o mesmo topo do notebook com o Ponto de corpo normal
      return g.map((linha, y) => linha.map((c, x) => {
        if (y < topo || y > topo + 5) return '.';
        if (x < OX - 1 || x > OX + 16) return '.';
        if (c === 'B') return y === topo + 2 && (x === OX + 7 || x === OX + 8) ? (i < 12 ? 'S' : 'B') : '.';
        return c;
      }));
    }),
    // o meio do giro, um quadro só (quem anima é quem troca as poses: a chegada na lateral)
    meioGiro: () => [quadro({ forma: 'estreito', vira: 1 })],
    // a chegada atrás do notebook: cai com o olho fechado, abre feliz e começa a digitar
    sentando: () => [
      quadro({ notebook: true, olhos: 'fechados' }),
      quadro({ notebook: true, olhos: 'apertado' }),
      quadro({ notebook: true, olhos: 'feliz' }),
      quadro({ notebook: true, olhos: 'feliz' }),
      quadro({ notebook: true, olhos: 'feliz', bracos: 'digitaA' }),
    ],
    // a dancinha da porta (login): braço pra cima num tempo, agachadinho no outro, pé trocando
    // e no meio da dança, um giro inteiro: frente, três quartos, perfil, costas, o outro perfil e volta
    danca: () => [
      ...rep(8, (_, i) => {
        const t = i % 4;
        if (t === 0) return quadro({ olhos: 'feliz', bracos: 'cima', pernas: 'passoA' });
        if (t === 1) return quadro({ olhos: 'feliz', bracos: i < 4 ? 'tchauA' : 'tchauB', tomba: i < 4 ? 15 : -15 });
        if (t === 2) return quadro({ olhos: 'feliz', bracos: 'cima', pernas: 'passoB' });
        return quadro({ forma: 'agachado', olhos: 'feliz', bracos: 'lado' });
      }),
      quadro({ forma: 'estreito', vira: 1, bracos: 'cima', olhos: 'feliz' }),
      quadro({ vira: 2, bracos: 'cima', dy: -1, pernas: 'encolhidas' }),
      quadro({ vira: 3, bracos: 'cima', dy: -1, pernas: 'encolhidas' }),
      quadro({ vira: -2, bracos: 'cima', dy: -1, pernas: 'encolhidas' }),
      quadro({ forma: 'estreito', vira: -1, bracos: 'cima', olhos: 'feliz' }),
      quadro({ olhos: 'feliz', bracos: 'cima', dy: -2, pernas: 'encolhidas' }),
      quadro({ forma: 'agachado', olhos: 'feliz' }),
      quadro({ olhos: 'piscaD' }),
    ],
    // a senha sendo digitada: ele fecha os olhos e põe as mãos na cabeça, espiando de vez em quando
    // a senha sendo digitada (escolhido pelo Vitor, 26/09/2026): canta assobiando de olho apertado (> <),
    // balançando de um pé para o outro; quando para, abre um olho e espia, arregala e volta a cantar
    semOlhar: () => [
      ...rep(10, (_, i) => quadro({ olhos: 'apertado', assobio: true, notas: i, tomba: i % 8 < 4 ? 6 : -6, bracos: i % 4 < 2 ? 'lado' : 'caidos' })),
      quadro({ olhos: 'piscaE', tomba: -10 }),
      ...rep(3, () => quadro({ olhos: 'espia', tomba: -14 })),
      quadro({ olhos: 'surpreso' }),
      ...rep(6, (_, i) => quadro({ olhos: 'apertado', assobio: true, notas: 10 + i, tomba: i % 8 < 4 ? 6 : -6 })),
    ],
  };

  const CLASSE = { B: 'pt-b', S: 'pt-s', K: 'pt-k', G: 'pt-g', L: 'pt-l' };
  function svgDoQuadro(g) {
    let s = '';
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        const c = g[y][x];
        if (c === '.') { x++; continue; }
        let x1 = x;
        while (x1 + 1 < W && g[y][x1 + 1] === c) x1++;
        s += `<rect class="${CLASSE[c]}" x="${x}" y="${y}" width="${x1 - x + 1}" height="1"/>`;
        x = x1 + 1;
      }
    }
    for (const [x2, y2, c] of g.fino || []) s += `<rect class="${CLASSE[c]}" x="${x2 / 2}" y="${y2 / 2}" width="0.5" height="0.5"/>`;
    return s;
  }

  const cache = {};
  function quadrosDe(pose) {
    if (!cache[pose]) cache[pose] = (SEQUENCIAS[pose] || SEQUENCIAS.parado)().map(svgDoQuadro);
    return cache[pose];
  }

  const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function montar(el) {
    const pose = el.dataset.pose || 'parado';
    const escala = Number(el.dataset.escala) || 2;
    const qs = quadrosDe(pose);
    // sem movimento: a pose mais legível de cada estado (o dormindo de olho fechado, o feliz no chão)
    const fixo = pose === 'achou' ? qs.length - 1 : 0;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W * escala}" height="${H * escala}" aria-hidden="true" focusable="false">${qs.map((q, i) => `<g${i === (quieto() ? fixo : 0) ? '' : ' style="display:none"'}>${q}</g>`).join('')}</svg>`;
    el._pose = pose;
    el._q = 0;
    el._n = qs.length;
  }

  function tique() {
    if (document.hidden) return;
    const parar = quieto();
    document.querySelectorAll('.ponto[data-pose]').forEach((el) => {
      if (el._pose !== el.dataset.pose || !el.firstElementChild) { montar(el); return; }
      if (parar) return;
      const gs = el.firstElementChild.children;
      const prox = el._q + 1;
      if (prox >= el._n) {
        // pose tocada uma vez (Ponto.tocar): termina e passa para a seguinte
        if (el.dataset.depois) { el.dataset.pose = el.dataset.depois; delete el.dataset.depois; montar(el); return; }
      }
      gs[el._q].style.display = 'none';
      el._q = prox % el._n;
      gs[el._q].style.display = '';
    });
  }
  setInterval(tique, POSE_MS);

  window.Ponto = {
    html: (pose = 'parado', escala = 2, classe = '') => `<span class="ponto ${classe}" data-pose="${pose}" data-escala="${escala}" aria-hidden="true"></span>`,
    // a troca de pose desenha na hora: quem move o Ponto (o pulo) troca pose e posição no mesmo quadro
    pose(el, pose) { if (el && el.dataset.pose !== pose) { delete el.dataset.depois; el.dataset.pose = pose; montar(el); } },
    tocar(el, pose, depois = 'parado') { if (!el) return; el.dataset.pose = pose; el.dataset.depois = depois; montar(el); },
    quadrosDe, // o terminal (cli/prospect.js) tem a sua cópia; aqui fica para teste
    _quadro: quadro, _svg: svgDoQuadro, // para as pranchas de conferência
  };
})();
