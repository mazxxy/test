# Carrossel do Obliq Prospect

12 slides de 1080 x 1350 (feed 4:5), com a estética e a composição do mini filme
`prospect-feed-celular.mp4`: a mesma moldura de tela em todo slide, a frase na linha de diário e os
caules a lápis nas margens.

| slide | frase | na moldura |
|---|---|---|
| 01 capa | Você pede. Ele prospecta. | "prospecta." em Fraunces itálico azul, o Ponto procurando |
| 02 | Você **pede.** | a Conversa vazia com o pedido digitado (réplica em HTML) |
| 03 | Busca as clínicas. Liga o **modo autônomo.** | o balão do Ponto com os passos e o ajudante (réplica em HTML) |
| 04 | Avalia **cada uma.** Segue suas regras de venda. | a lista de leads com as notas (quadro 316 do filme) |
| 05 | Escreve a **abertura.** E deixa o gancho pronto pra resposta. | "A conversa": abertura e gancho (quadros 419 e 422) |
| 06 | Envia **uma por vez,** no ritmo de uma pessoa. | "O que ele fez" no celular, com a hora de cada envio (quadro 775) |
| 07 | Roda no seu **computador.** E você acompanha pelo celular. | o app no PC com a barra "prospect BY obliq." (quadro 590) |
| 08 | Instalar é **uma linha.** Uma pro app, outra pro terminal. | o PowerShell com as duas linhas (réplica em HTML) |
| 09 | A IA vem **incluída.** Ou use a sua assinatura do Codex. | os planos, na moldura noite |
| 10 | Os 10 primeiros **travam o preço.** | R$ 39/mês pra sempre, na moldura noite |
| 11 | Em breve, um agente **24 horas.** O primeiro é grátis. | o agente na nuvem, num cartão de papel (sem tela: ainda não existe) |
| 12 fecho | Controle total das suas vendas, com o seu **agente pessoal.** | o O de flores, "obliq." com o Ponto no lugar do ponto, e o "testa agora" |

## Arquivos

- `png/01.png` a `png/12.png`: os slides.
- `prancha-036.png`: todos lado a lado a 0,36, como o feed aparece no celular.
- `legenda.txt`: a legenda do post.
- `carrossel.html`: todos os slides numa página (`?s=05` mostra um só). Os textos, preços e
  posições estão ali.
- `render.mjs`: fotografa cada slide e monta a prancha. `node render.mjs` (precisa do Playwright:
  `npm i -D playwright`). No Windows, se o Chromium do Playwright não abrir: `EDGE=1 node render.mjs`
  (no PowerShell: `$env:EDGE=1; node render.mjs`).
- `ferramentas/preparar.py`: tira do filme os recortes de `telas/` (as telas 04 a 07, os caules e o
  O de flores). `python3 ferramentas/preparar.py caminho/prospect-feed-celular.mp4` (ffmpeg, Pillow,
  numpy).
- `fontes/`: Fraunces e Hanken variáveis da marca, e a Cascadia Mono (SIL OFL, licença junto) para o
  PowerShell.
- `lib/`: `ponto.js` (o mascote, as poses do app), `lapis.js` (o motor do lápis, para a seta da capa e o
  botão fechado do slide 11) e `papel.svg` (a textura do papel).

## Conferência (feita no render final)

- Moldura em x 150, y 190, 780 x 760 nos 10 slides de tela (medida no DOM).
- Primeira linha da frase com linha de base em y 1115 em todos; 66 px de folga até a etiqueta.
- Nada nas faixas x < 120 e x > 960 além dos caules (medido nos pixels); o conteúdo fica entre 140 e 940.
- Azul em três lugares: "prospecta." (01), o acento da interface (02 a 05 e 07) e a flor azul do O (12).
  O Ponto no lugar do ponto do "obliq." não conta.
- Papel com média (250, 247.5, 240.5) contra o alvo #FAF7F0 (250, 247, 240).
- Zero U+2014 e zero U+2013 em slides, legenda e código.

## Antes de publicar

- "Segue suas regras de venda." (04): pela `FATOS.md`, as regras de venda ainda não existem no código.
- O slide 11 diz "sem depender do seu computador ligado": é o que um agente na nuvem 24 horas implica.
  Conferir com o produto quando ele sair.
- "Vale para o plano No seu computador." (10): o preço de lançamento foi lido como o do plano pago único.
- As linhas de instalação precisam estar no ar no dia.
