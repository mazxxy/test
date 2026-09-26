# O Ponto dançando e jogando confete (GIFs da fatura)

Um GIF para mandar junto com a fatura pelo WhatsApp: o Ponto dançando num palco de papel, com a sombra
a lápis que amassa quando ele agacha e encolhe quando ele pula, e notinhas a lápis em volta com o traço
vivo. A dança é a pose "danca" do `ponto.js`, a mesma do app: 16 quadros de 125 ms (passinhos com
tchauzinho, um giro, um pulinho e uma piscadela no fim), em laço de 2 segundos.

A segunda cena é o **confete**: a pose "achou" do `ponto.js` (22 quadros, 2,75 s), a comemoração do app.
Ele agacha, pula empinado com os braços para cima e a ponta da cabeça estoura, três vezes, e termina
feliz de pé. A cada pulo sai um punhado de confete a lápis nas tintas dos produtos da casa (âmbar,
verde, petróleo, rosa, ameixa e o azul), que cai girando e some antes de o laço recomeçar.

## Arquivos

- `saida/ponto-danca.gif` e `saida/ponto-danca.mp4`: com "a fatura chegou." em cima e "obliq." embaixo.
- `saida/ponto-danca-sem-texto.gif` e `.mp4`: só o Ponto, as notinhas e o "obliq.", para qualquer mensagem.
- `saida/ponto-confete.gif` e `.mp4`, `saida/ponto-confete-sem-texto.gif` e `.mp4`: a cena do confete,
  com e sem a frase.
- `ponto-danca.html` e `ponto-confete.html`: as cenas. `?texto=0` tira a frase.
- `render.mjs`: `node render.mjs` fotografa os quadros e monta o GIF e o MP4 (Playwright e ffmpeg no PATH).

## Como mandar no WhatsApp

O WhatsApp transforma GIF em vídeo curto em laço. Mande o **MP4** como vídeo (ou o GIF pelo botão de
GIF do teclado, anexando o arquivo): os dois tocam em laço, sem som. Os GIFs têm 540 x 540 e 170 a
230 KB; os MP4 têm 720 x 720, o laço 4 vezes (8 s a dança, 11 s o confete) e 300 a 720 KB.

## Regras que a peça segue

- Pose do Ponto já existente, nunca inventada.
- Papel liso (sem a textura: no GIF ela só pesa e suja a paleta), lápis da casa, Fraunces e Hanken.
- Azul: o Ponto, o "chegou." e o ponto do "obliq.", que não conta; no confete, o azul entra entre
  as tintas da família. Zero travessão.
