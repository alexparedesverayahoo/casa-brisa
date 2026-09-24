"""Exporta las fotos editadas a WebP optimizado para la web (public/img/).

Versión "staging ligero": mismos muebles del depa; solo limpieza, vajilla, velas, telas, cielo y luz.
"""
from pathlib import Path

from PIL import Image

from whiten import whiten

ROOT = Path(__file__).resolve().parent.parent
HF = ROOT.parent / 'HIGGSFIELD'
OUT = ROOT / 'public' / 'img'

# nombre web -> (archivo fuente, opciones)
#   crop: (izq, arriba, der, abajo) en fracciones a recortar de cada borde
#   white: aplicar blanco LED fuerte (fotos de noche)
IMAGES = {
    # Exteriores comunes
    'condominio-atardecer': ('fotos_v1/07_condominio_atardecer.png', {}),
    'condominio-noche': ('fotos_v1/08_condominio_noche.png', {}),
    'caleta-dia': ('fotos_v1/01_playa_dia.png', {}),
    'caleta-atardecer': ('fotos_v1/02_playa_atardecer.png', {}),
    'caleta-noche': ('fotos_v1/03_playa_noche.png', {}),
    'camino': ('fotos_v1/04_camino_playa.png', {}),
    'juegos': ('fotos_v1/05_juegos_ninos.png', {}),
    # El depa
    'fachada-dia': ('fotos_v2/09b_fachada_dia.png', {}),
    'fachada-noche': ('fotos_v2/10b_fachada_noche.png', {}),
    'terraza-dia': ('fotos_v1/11_terraza_parrilla.png', {}),
    'terraza-noche': ('fotos_v3_ligero/terraza_noche.png', {}),
    'jacuzzi-dia': ('fotos_v3_ligero/jacuzzi_dia.png', {}),
    'jacuzzi-noche': ('fotos_v2/12b_jacuzzi_noche.png', {}),
    'sala': ('fotos_v3_ligero/sala_dia_fix.png', {'crop': (0, 0, 0, 0.09)}),
    'sala-comedor': ('fotos_v3_ligero/sala_comedor_dia.png', {'crop': (0.03, 0, 0, 0)}),
    'sala-comedor-noche': ('fotos_v3_ligero/sala_comedor_noche_led.png', {'white': True}),
    'comedor': ('fotos_v3_ligero/comedor_noche_led.png', {'white': True}),
    'comedor-dia': ('fotos_v2/15b_comedor_cocina.png', {}),
    'cocina': ('fotos_v3_ligero/cocina.png', {}),
    'dormitorio-principal': ('fotos_v1/17_dormitorio_principal.png', {}),
    'dormitorio-principal-noche': ('fotos_v3_ligero/dormitorio_principal_noche_led.png', {'white': True}),
    'dormitorio-principal-tv': ('fotos_v3_ligero/dormitorio_tv_sin_ventilador.png', {}),
    'dormitorio-ninos': ('fotos_v1/19_dormitorio_ninos.png', {}),
    'dormitorio-ninos-2': ('fotos_v1/20_dormitorio_surf.png', {}),
    'bano': ('fotos_v3_ligero/bano_sin_ventilador.png', {}),
    'bano-2': ('fotos_v1/22_bano_2.png', {}),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for name, (src, opt) in IMAGES.items():
        path = HF / src
        if not path.exists():
            print('falta', src)
            continue
        im = Image.open(path).convert('RGB')
        if 'crop' in opt:
            l, t, r, b = opt['crop']
            w, h = im.size
            im = im.crop((round(w * l), round(h * t), round(w * (1 - r)), round(h * (1 - b))))
        if opt.get('white'):
            im = whiten(im)
        w, h = im.size
        width = 1800 if w >= h else 1100
        im = im.resize((width, round(h * width / w)), Image.LANCZOS)
        p = OUT / f'{name}.webp'
        im.save(p, 'WEBP', quality=78, method=6)
        total += p.stat().st_size
    og = Image.open(HF / IMAGES['caleta-atardecer'][0]).convert('RGB')
    w, h = og.size
    ch = round(w * 630 / 1200)
    og.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).resize((1200, 630), Image.LANCZOS).save(OUT / 'og.jpg', quality=85)
    print(f'{len(IMAGES)} imágenes · {total/1e6:.1f} MB')


if __name__ == '__main__':
    main()
