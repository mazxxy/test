# O Ponto dançando (GIF da fatura)

Um GIF para mandar junto com a fatura pelo WhatsApp: o Ponto dançando num palco de papel, com a sombra
a lápis que amassa quando ele agacha e encolhe quando ele pula, e notinhas a lápis em volta com o traço
vivo. A dança é a pose "danca" do `ponto.js`, a mesma do app: 16 quadros de 125 ms (passinhos com
tchauzinho, um giro, um pulinho e uma piscadela no fim), em laço de 2 segundos.

## Arquivos

- `saida/ponto-danca.gif` e `saida/ponto-danca.mp4`: com "a fatura chegou." em cima e "obliq." embaixo.
- `saida/ponto-danca-sem-texto.gif` e `.mp4`: só o Ponto, as notinhas e o "obliq.", para qualquer mensagem.
- `ponto-danca.html`: a cena. `?texto=0` tira a frase.
- `render.mjs`: `node render.mjs` fotografa os quadros e monta o GIF e o MP4 (Playwright e ffmpeg no PATH).

## Como mandar no WhatsApp

O WhatsApp transforma GIF em vídeo curto em laço. Mande o **MP4** como vídeo (ou o GIF pelo botão de
GIF do teclado, anexando o arquivo): os dois tocam em laço, sem som. O GIF tem 540 x 540 e ~130 KB; o
MP4 tem 720 x 720, 8 segundos (a dança 4 vezes) e ~320 KB.

## Regras que a peça segue

- Pose do Ponto já existente, nunca inventada.
- Papel liso (sem a textura: no GIF ela só pesa e suja a paleta), lápis da casa, Fraunces e Hanken.
- Azul: o Ponto, o "chegou." e o ponto do "obliq.", que não conta. Zero travessão.
