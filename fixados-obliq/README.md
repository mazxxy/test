# Posts fixados da obliq

Três posts de 1080 x 1350 que, lado a lado nos fixados do perfil, formam uma folha só de 3240 x 1350
e contam uma história da esquerda para a direita. A frase atravessa os três: **"o caderninho | vira |
sistema."**

1. **o caderninho**: a lista do negócio a lápis (leite, arroz, vinho tinto, luva entregue, conferir a
   nota, fechou o caixa), com riscado, círculo e visto, e o Ponto ainda em tinta, pensando.
2. **vira**: o Ponto, já azul, no notebook, com pedaços de sistema saindo a lápis (tabela, chave,
   visto, gráfico) e "duas mentes: uma desenha, a outra programa."
3. **sistema.**: os projetos da casa como ícones de celular, na família da guideline (§2b): relevo 3d,
   validade, confere nf, vitrine, entrega epi, controle, adega. O espaço do Prospect está vazio,
   tracejado: o Ponto pulou dele. Embaixo, "obliq." e "a prévia do seu sistema sai antes de você pagar."

Setas a lápis saem do caderninho, atravessam a emenda até o notebook e dali até os ícones.

## Publicar

Publique na ordem **fixado-3, fixado-2, fixado-1** e fixe os três. O grade mostra o 1 à esquerda.

## Arquivos

- `png/fixado-1.png`, `png/fixado-2.png`, `png/fixado-3.png`: os posts.
- `png/fixados-inteiro.png`: a folha inteira.
- `previa-grade.png`: como o perfil mostra, com cada post cortado em 3:4 (34 px de cada lado).
- `fixados.html`: a fonte. Textos, ícones e posições no HTML; os desenhos a lápis (caderninho, setas,
  pedaços de sistema) na função `desenha()`, com semente fixa (rodar de novo sai igual).
- `render.mjs`: `node render.mjs` gera tudo (Playwright; no Windows, `$env:EDGE=1` usa o Edge).
- `lib/`: `ponto.js` (as poses do app), `lapis.js` (o motor do lápis) e `papel.svg`.

## Regras que a peça segue

- Nenhum texto encosta nas emendas: o corte 3:4 do grade não come letra.
- O texto vem do site e da guideline: "planilha e caderninho", "oito sistemas próprios", "seis no ar",
  "duas mentes: uma desenha, a outra programa", a prévia antes de pagar.
- Os ícones seguem a família da guideline: tinta cheia de cada produto, raio de 22,4%, qualificador em
  Fraunces itálica; o epi com o filete; a adega com a moldura.
- Azul: "sistema.", o Ponto (a mascote) e o ponto do "obliq.", que não conta.
- Zero travessão e meia-risca.

## Antes de publicar

- Conferir se "oito sistemas próprios, seis no ar" continua valendo no dia.
- O Prospect aparece como espaço vazio (o Ponto pulou dele) porque a guideline não define um ícone
  mínimo para ele. Se ele ganhar um, é só trocar o espaço pelo ícone.
