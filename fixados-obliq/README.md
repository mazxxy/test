# Posts fixados da obliq

Três posts de 1080 x 1350 que, lado a lado nos fixados do perfil, formam uma folha só de 3240 x 1350.
O foco é sistema: a manchete "sistema próprio, no preço de negócio pequeno." atravessa os dois primeiros,
e embaixo corre o jardim da casa, uma planta a lápis por sistema, cada flor na tinta do produto
(validade, controle, entrega, relevo, confere, vitrine, adega, prospect). O terceiro traz o carimbo
"prévia grátis, antes de pagar", o "obliq." e o botão fechado de "o próximo broto é o seu."

## Publicar

Publique na ordem **fixado-3, fixado-2, fixado-1** e fixe os três. O grade mostra o 1 à esquerda.

## Arquivos

- `png/fixado-1.png`, `png/fixado-2.png`, `png/fixado-3.png`: os posts.
- `png/fixados-inteiro.png`: a folha inteira.
- `previa-grade.png`: como o perfil mostra, com cada post cortado em 3:4 (34 px de cada lado).
- `fixados.html`: a fonte. Textos e posições no HTML; as plantas (posição, altura, tinta) na lista
  `PLANTAS` do script.
- `render.mjs`: `node render.mjs` gera tudo (Playwright; no Windows, `$env:EDGE=1` usa o Edge).

## Regras que a peça segue

- As emendas entre os posts caem nos espaços entre palavras: nenhuma letra some no corte 3:4 do grade.
- O texto vem do jardim do site: "sistema próprio, no preço de negócio pequeno", "oito sistemas próprios.
  cada um começou numa tarefa que já existia e já era feita", "8 sistemas, 6 no ar", "o próximo broto
  é o seu", "duas mentes: uma desenha, a outra programa".
- As oito caixinhas medem uma coisa real: 8 sistemas, 6 cheias para os 6 no ar (guideline §8).
- Azul em três lugares: "negócio pequeno.", o carimbo e a flor do Prospect. O ponto do "obliq." não conta.
- Zero travessão e meia-risca.

## Antes de publicar

- Conferir se "8 sistemas, 6 no ar" continua valendo no dia.
- A prévia grátis antes de pagar vale para sistema como vale para site (é o que o site diz hoje).
