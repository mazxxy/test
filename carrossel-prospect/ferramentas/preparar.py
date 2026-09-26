# preparar.py: tira do filme as telas, os caules das margens e o O de flores.
#
# Uso: python3 ferramentas/preparar.py <caminho/prospect-feed-celular.mp4>
# Precisa de ffmpeg no PATH, Pillow e numpy. Tudo sai em telas/ (PNG).
#
# O filme é 1080 x 1350 a 24 fps; a moldura das telas é 780 x 760 em x 150, y 190.
# Quadro = segundos x 24. As telas saem 1:1 (sem ampliar) a não ser onde está dito.
import subprocess, sys, tempfile, os
from PIL import Image
import numpy as np

VIDEO = sys.argv[1]
AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', 'telas')
os.makedirs(SAIDA, exist_ok=True)
TMP = tempfile.mkdtemp()


def quadro(n):
    p = os.path.join(TMP, f'q{n}.png')
    if not os.path.exists(p):
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', VIDEO, '-vf', f'select=eq(n\\,{n})',
                        '-frames:v', '1', p], check=True)
    return Image.open(p).convert('RGB')


def moldura(n):
    return quadro(n).crop((150, 190, 930, 950))


def salva(im, nome):
    im.save(os.path.join(SAIDA, nome))
    print(nome, im.size)


# 02, 03 e 08 não saem do filme: são réplicas em HTML no carrossel.html (a Conversa e o PowerShell),
# porque no filme essas telas estão pequenas demais, ou no meio de uma animação, para uma imagem parada.

# 04: a lista de leads com as notas (quadro 316: a lista já rolou e começa na Clínica Ipê, sem a
# barra de busca cortada em cima), 1:1.
salva(moldura(316), 'tela-04-leads.png')

# 05: "A conversa" inteira. O quadro 419 tem a abertura já assentada; o 422 é a mesma tela rolada
# 314 px para baixo, com o gancho. Junta as duas no divisor (linha 242 do 422) e mostra os
# primeiros 760 px: título, PRIMEIRO, a abertura, o botão, "Já enviei por fora" e a primeira
# linha do gancho, que termina na linha 743, inteira.
cima, baixo = moldura(419), moldura(422)
folha = Image.new('RGB', (780, 314 + 760))
folha.paste(baixo, (0, 314))
folha.paste(cima.crop((0, 0, 780, 314 + 242)), (0, 0))
salva(folha.crop((0, 0, 780, 760)), 'tela-05-conversa.png')

# 06: "O que ele fez" no celular, com a hora de cada envio (quadro 775), 1:1.
salva(moldura(775), 'tela-06-o-que-ele-fez.png')

# 07: o app no computador, com a barra "prospect BY obliq." (quadro 590), 1:1.
salva(moldura(590), 'tela-07-computador.png')


def sem_papel(im, papel=None, limiar=0.975):
    """Divide pelo papel do filme: o que era papel vira branco, e a imagem entra na página com
    mix-blend-mode: multiply sobre o papel da página, sem emenda."""
    a = np.asarray(im).astype(float)
    if papel is None:
        papel = np.median(a.reshape(-1, 3), axis=0)
    r = np.clip(a / papel, 0, 1)
    claro = (r > limiar).all(axis=2)
    r[claro] = 1
    return Image.fromarray((r * 255).round().astype('uint8'))


# os caules das margens, como estão no filme (quadro 300: sem a flor azul)
q = quadro(300)
salva(sem_papel(q.crop((0, 300, 130, 840))), 'caule-esq.png')
salva(sem_papel(q.crop((950, 300, 1080, 840))), 'caule-dir.png')

# o O de flores do fecho (quadro 1296: o O fechado, sem frase dentro)
salva(sem_papel(quadro(1296).crop((40, 100, 1050, 1080))), 'o-de-flores.png')
