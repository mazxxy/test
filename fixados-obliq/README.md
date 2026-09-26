# Posts fixados da obliq

**Um banner de 3240 x 1350 cortado em três posts** de 1080 x 1350, para os fixados do perfil. A folha
inteira é uma página de caderno: a espiral corre pelo alto dos três, as pautas a lápis atravessam de
ponta a ponta, e a frase **"o caderninho vira sistema."** corre pelos três, sublinhada por um traço só.

Da esquerda para a direita, o caderninho vira sistema:

- a lista escrita à mão nas pautas (leite, arroz, vinho tinto, luva entregue, conferir a nota, fechou o
  caixa), com riscado, círculo e visto, e o Ponto ainda em tinta, pensando;
- uma seta grande sai da lista, atravessa a emenda e chega no Ponto, já azul, no notebook
  ("duas mentes: uma desenha, a outra programa.");
- os ícones dos sistemas saem voando da tela dele (relevo 3d, validade, confere nf, vitrine), atravessam
  a outra emenda com rastro de lápis e pousam em fila com os outros (entrega epi, controle, adega e o
  Prospect, que é o próprio Ponto em papel sobre o azul da casa). Embaixo, "oito sistemas próprios, seis
  no ar.", o "obliq." e "a prévia do seu sistema sai antes de você pagar."

## Publicar

Publique na ordem **fixado-3, fixado-2, fixado-1** e fixe os três. O grade mostra o 1 à esquerda.

## Arquivos

- `png/fixado-1.png`, `png/fixado-2.png`, `png/fixado-3.png`: os posts.
- `png/fixados-inteiro.png`: o banner inteiro.
- `previa-grade.png`: como o perfil mostra, com cada post cortado em 3:4 (34 px de cada lado).
- `fixados.html`: a fonte. Textos e posições no HTML; os ícones (posição, tamanho, giro) na lista
  `ICONES`; o caderno e os traços a lápis nas funções `caderno()` e `tracos()`, com semente fixa.
- `render.mjs`: `node render.mjs` gera tudo (Playwright; no Windows, `$env:EDGE=1` usa o Edge).
- `lib/`: `ponto.js` (as poses do app), `lapis.js` (o motor do lápis) e `papel.svg`.

## Regras que a peça segue

- O que atravessa as emendas é desenho (espiral, pautas, sublinhado, seta, rastro dos ícones); o texto
  fica longe delas, então o corte 3:4 do grade não come letra.
- O texto vem do site e da guideline: "planilha e caderninho", "oito sistemas próprios", "seis no ar",
  "duas mentes: uma desenha, a outra programa", a prévia antes de pagar.
- Os ícones seguem a família da guideline (§2b): tinta cheia de cada produto, raio de 22,4%,
  qualificador em Fraunces itálica, o epi com o filete, a adega com a moldura.
- Azul: "sistema.", o Ponto e o ícone do Prospect (a mascote e a tinta dele), e o ponto do "obliq.",
  que não conta.
- Zero travessão e meia-risca.

## Antes de publicar

- Conferir se "oito sistemas próprios, seis no ar" continua valendo no dia.
- O ícone do Prospect (o Ponto em papel sobre o azul) é novo: a guideline ainda não define um ícone
  mínimo para ele. Vale registrar na guideline se for adotado.
