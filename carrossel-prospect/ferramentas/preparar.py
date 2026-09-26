# preparar.py: tira do filme os recortes de tela da colagem e o O de flores.
#
# Uso: python3 ferramentas/preparar.py <caminho/prospect-feed-celular.mp4>
# Precisa de ffmpeg no PATH, Pillow e numpy. Tudo sai em telas/ (PNG).
#
# O filme é 1080 x 1350 a 24 fps; no filme as telas moram numa moldura de 780 x 760 em x 150, y 190,
# e os recortes partem dela. Quadro = segundos x 24. Tudo sai 1:1, sem ampliar.
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


# Os slides 02 (o balão do Ponto), 04 (a abertura), 05 (a linha do tempo), 07 (as linhas de
# instalação) e o preço não saem do filme: são réplicas e tipografia em HTML no carrossel.html,
# com os mesmos textos da interface.

# as linhas da lista de leads, soltas, para a colagem (quadro 316; divisores nas linhas 123, 247,
# 371, 495, 618 e 742; a lista vai até x 752, antes da barra de rolagem)
lista = moldura(316)
cortes = [0, 124, 248, 372, 496, 619, 742]
nomes = ['ipe', 'sabia', 'aroeira', 'jatoba', 'manaca', 'pitanga']
for k, nome in enumerate(nomes):
    if nome in ('jatoba', 'manaca'):
        continue  # a colagem usa quatro: a melhor nota, duas do meio e a que fica abaixo de 80
    salva(lista.crop((6, cortes[k], 752, cortes[k + 1])), f'lead-{nome}.png')

# o celular no Modo autônomo (quadro 725): o aparelho inteiro, sem o fundo escuro
salva(moldura(725).crop((224, 20, 556, 740)), 'celular-modo-autonomo.png')

# a janela do app no computador (quadro 590), do canto da janela até a borda do recorte
salva(moldura(590).crop((172, 56, 780, 760)), 'janela-pc.png')


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


# o O de flores do fecho (quadro 1296: o O fechado, sem frase dentro)
salva(sem_papel(quadro(1296).crop((40, 100, 1050, 1080))), 'o-de-flores.png')
