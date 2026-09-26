# Posts fixados da obliq

**Um banner de 3240 x 1350 cortado em três posts** de 1080 x 1350, para os fixados do perfil.

No meio do banner, o **Ponto gigante**, em tinta, em pé (a pose parada do app, 24 x 16 pixels a 90 px
cada), com o corpo centrado na segunda emenda: cada um dos posts 2 e 3 fica com um olho dele, e só
juntos ele aparece inteiro. Com a mão esquerda ele segura o caderninho (a lista escrita à mão, que
atravessa a primeira emenda); da mão direita, os ícones dos oito sistemas caem em cascata (relevo 3d,
validade, confere nf, vitrine, entrega epi, controle, adega e o Prospect, que é o próprio Ponto em papel
sobre o azul da casa).

A frase corre pelo alto, sublinhada por um traço só: **"o caderninho | vira | sistema."** No post 1,
"sistema próprio, no preço de negócio pequeno.", "oito sistemas próprios, seis no ar.", "duas mentes:
uma desenha, a outra programa.", o "obliq." e "a prévia do seu sistema sai antes de você pagar."

## Publicar

Publique na ordem **fixado-3, fixado-2, fixado-1** e fixe os três. O grade mostra o 1 à esquerda.

## Arquivos

- `png/fixado-1.png`, `png/fixado-2.png`, `png/fixado-3.png`: os posts.
- `png/fixados-inteiro.png`: o banner inteiro.
- `previa-grade.png`: como o perfil mostra, com cada post cortado em 3:4 (34 px de cada lado).
- `fixados.html`: a fonte. Textos e posições no HTML; os ícones (posição, giro) na lista `ICONES`;
  o caderninho e os traços a lápis nas funções `caderno()` e `tracos()`, com semente fixa.
- `render.mjs`: `node render.mjs` gera tudo (Playwright; no Windows, `$env:EDGE=1` usa o Edge).
- `lib/`: `ponto.js` (as poses do app), `lapis.js` (o motor do lápis) e `papel.svg`.

## Regras que a peça segue

- O que atravessa as emendas é o Ponto, o caderninho e o sublinhado; o texto fica longe delas, então o
  corte 3:4 do grade não come letra. Nenhum ícone passa acima do sublinhado nem encosta no braço.
- O texto vem do site e da guideline: "planilha e caderninho", "oito sistemas próprios", "seis no ar",
  "duas mentes: uma desenha, a outra programa", a prévia antes de pagar.
- Os ícones seguem a família da guideline (§2b): tinta cheia de cada produto, raio de 22,4%,
  qualificador em Fraunces itálica, o epi com o filete, a adega com a moldura.
- Azul: "sistema." e o ícone do Prospect, e o ponto do "obliq.", que não conta. O Ponto grande é tinta.
- Zero travessão e meia-risca.

## Antes de publicar

- Conferir se "oito sistemas próprios, seis no ar" continua valendo no dia.
- O ícone do Prospect (o Ponto em papel sobre o azul) é novo: a guideline ainda não define um ícone
  mínimo para ele. Vale registrar na guideline se for adotado.
