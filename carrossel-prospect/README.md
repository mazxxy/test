# Carrossel do Obliq Prospect

11 slides de 1080 x 1350 (feed 4:5) que são **uma folha só**, de 11880 x 1350. O que atravessa a
borda de um slide continua no seguinte: o "prospecta." da capa termina no slide 2, e um caule a lápis
corre embaixo do primeiro ao último, com o Ponto andando nele na capa. Cada slide tem a sua própria
composição: colagem de recortes tortos, tipografia gigante, linha do tempo a lápis, noite cheia.

| slide | o que tem |
|---|---|
| 01 capa | "você pede." / "ele" / "prospecta." em Fraunces itálico azul atravessando para o 02; o Ponto com a lupa no caule; "arrasta." |
| 02 | o pedido num balão grande e o balão do Ponto (passos, ajudante) como impresso torto |
| 03 | "dá nota pra cada uma.": quatro linhas da lista de leads soltas, o 91 circulado a lápis e a nota "77: abaixo da nota mínima. essa ele não chama." |
| 04 | a abertura "Oi, boa tarde! É o WhatsApp da Clínica Ipê?" em tipografia gigante, e o gancho em três balões |
| 05 | "uma por vez.": a linha do tempo a lápis com os envios das 14:07, 14:08, 14:09 e a resposta das 14:12 |
| 06 | "roda no seu computador.": a janela do app e o celular em colagem |
| 07 | noite: "instalar é uma linha." com as duas linhas inteiras e o Ponto do terminal |
| 08 | o plano No seu computador, R$ 49/mês, e o cartão do Grátis |
| 09 | noite com borda de gravura: os 10 primeiros, R$ 39/mês, pra sempre |
| 10 | em breve: o agente na nuvem; o caule sobe pela margem e acaba num botão fechado |
| 11 fecho | o O de flores, "obliq." com o Ponto no lugar do ponto, e o "testa agora" com a linha e o link |

## Arquivos

- `png/01.png` a `png/11.png`: os slides.
- `prancha-036.png`: todos lado a lado a 0,36, como o feed aparece no celular.
- `legenda.txt`: a legenda do post.
- `carrossel.html`: a folha inteira. Textos, preços, posições e rotações estão ali; `?z=0.36` mostra
  do tamanho do feed.
- `render.mjs`: fotografa cada faixa de 1080 px e monta a prancha. `node render.mjs` (precisa do
  Playwright: `npm i -D playwright`). No Windows, se o Chromium do Playwright não abrir, use o Edge:
  `$env:EDGE=1; node render.mjs` no PowerShell.
- `ferramentas/preparar.py`: tira do filme os recortes de `telas/` (as linhas da lista, a janela do
  PC, o celular e o O de flores). `python3 ferramentas/preparar.py caminho/prospect-feed-celular.mp4`
  (ffmpeg, Pillow, numpy).
- `fontes/`: Fraunces e Hanken variáveis da marca, e a Cascadia Mono (SIL OFL, licença junto) para as
  linhas de comando.
- `icones/`: os ícones a lápis da casa usados (o aviãozinho e a resposta, na pose parada).
- `lib/`: `ponto.js` (o mascote, com as poses do app), `lapis.js` (o motor do lápis: o caule, as setas,
  o círculo, o botão fechado) e `papel.svg` (a textura do papel).

## O que continua da marca

Papel, tinta e Fraunces/Hanken variáveis; o lápis só nas bordas e nas formas; caixa baixa na voz de
rede; zero travessão e meia-risca (conferido em todos os arquivos); azul em três lugares:
"prospecta." (01 e 02), o acento da interface (os recortes e o Ponto em 02, 03, 06 e 07) e a flor
azul do O (11). O Ponto no lugar do ponto do "obliq." não conta. A noite aparece como interlúdio
(07 e 09).

## Antes de publicar

- O slide 10 diz "sem depender do seu computador ligado": é o que um agente na nuvem 24 horas implica.
  Conferir com o produto quando ele sair.
- "Vale para o plano No seu computador." (09): o preço de lançamento foi lido como o do plano pago único.
- As linhas de instalação precisam estar no ar no dia.
