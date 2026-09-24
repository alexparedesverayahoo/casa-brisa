"""Exporta las fotos editadas a WebP optimizado para la web (public/img/)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HF = ROOT.parent / 'HIGGSFIELD'
OUT = ROOT / 'public' / 'img'

# nombre web -> archivo fuente (la versión más reciente gana)
IMAGES = {
    'fachada-dia': 'fotos_v2/09b_fachada_dia.png',
    'fachada-noche': 'fotos_v2/10b_fachada_noche.png',
    'condominio-atardecer': 'fotos_v1/07_condominio_atardecer.png',
    'condominio-noche': 'fotos_v1/08_condominio_noche.png',
    'caleta-dia': 'fotos_v1/01_playa_dia.png',
    'caleta-atardecer': 'fotos_v1/02_playa_atardecer.png',
    'caleta-noche': 'fotos_v1/03_playa_noche.png',
    'camino': 'fotos_v1/04_camino_playa.png',
    'juegos': 'fotos_v1/05_juegos_ninos.png',
    'terraza': 'fotos_v1/11_terraza_parrilla.png',
    'jacuzzi-noche': 'fotos_v2/12b_jacuzzi_noche.png',
    'sala': 'fotos_v1/14_sala.png',
    'sala-comedor': 'fotos_v1/13_sala_comedor.png',
    'comedor': 'fotos_v2/15b_comedor_cocina.png',
    'cocina': 'fotos_v2/16b_cocina_noche.png',
    'dormitorio-principal': 'fotos_v1/17_dormitorio_principal.png',
    'dormitorio-2': 'fotos_v1/18_dormitorio_tv.png',
    'dormitorio-ninos': 'fotos_v1/19_dormitorio_ninos.png',
    'dormitorio-surf': 'fotos_v1/20_dormitorio_surf.png',
    'bano': 'fotos_v1/21_bano.png',
    'bano-2': 'fotos_v1/22_bano_2.png',
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, src in IMAGES.items():
        im = Image.open(HF / src).convert('RGB')
        w, h = im.size
        width = 1800 if w >= h else 1100
        im = im.resize((width, round(h * width / w)), Image.LANCZOS)
        p = OUT / f'{name}.webp'
        im.save(p, 'WEBP', quality=78, method=6)
        total += p.stat().st_size
    # Imagen para compartir en redes (1200x630)
    og = Image.open(HF / IMAGES['caleta-atardecer']).convert('RGB')
    w, h = og.size
    ch = round(w * 630 / 1200)
    og.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).resize((1200, 630), Image.LANCZOS).save(OUT / 'og.jpg', quality=85)
    print(f'{len(IMAGES)} imágenes · {total/1e6:.1f} MB')


if __name__ == '__main__':
    main()
