"""Exporta las fotos editadas a WebP optimizado para la web (public/img/)."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
HF = ROOT.parent / 'HIGGSFIELD'
OUT = ROOT / 'public' / 'img'

# nombre web -> archivo fuente (la versión más reciente gana)
IMAGES = {
    # Exteriores comunes (solo cielo y limpieza)
    'condominio-atardecer': 'fotos_v1/07_condominio_atardecer.png',
    'condominio-noche': 'fotos_v1/08_condominio_noche.png',
    'caleta-dia': 'fotos_v1/01_playa_dia.png',
    'caleta-atardecer': 'fotos_v1/02_playa_atardecer.png',
    'caleta-noche': 'fotos_v1/03_playa_noche.png',
    'camino': 'fotos_v1/04_camino_playa.png',
    'juegos': 'fotos_v1/05_juegos_ninos.png',
    # Rediseño "Costa Serena"
    'fachada-dia': 'rediseno/final/fachada_dia_jacuzzi_madera.png',
    'fachada-noche': 'rediseno/final/fachada_noche_jacuzzi_madera.png',
    'terraza-dia': 'rediseno/terraza/terraza_A_lounge_dia.png',
    'terraza-noche': 'rediseno/terraza/terraza_A_lounge_noche_v2.png',
    'jacuzzi-dia': 'rediseno/jacuzzi/jacuzzi_FINAL_dia.png',
    'jacuzzi-noche': 'rediseno/jacuzzi/jacuzzi_FINAL_noche.png',
    'sala': 'rediseno/sala/sala_frontal_dia_v3.png',
    'sala-comedor': 'rediseno/final/sala_comedor_general_nuevo.png',
    'comedor': 'rediseno/comedor_cocina/comedor_A2b_inversion_dia.png',
    'cocina': 'rediseno/comedor_cocina/cocina_B2b_inversion_noche.png',
    'dormitorio-principal': 'rediseno/dorm_principal/B2_dia_roble_rejilla.png',
    'dormitorio-principal-noche': 'rediseno/dorm_principal/B2_noche_roble_rejilla.png',
    'dormitorio-principal-tv': 'rediseno/final/dormitorio_principal_vista_tv.png',
    'dormitorio-ninos': 'rediseno/dorm_ninos/FINAL_A_dorm_ninos_friso.png',
    'dormitorio-ninos-2': 'rediseno/dorm_ninos/FINAL_B_dorm_ninos_friso.png',
    'bano': 'rediseno/banos/bano_lavatorio_premium_v2.png',
    'bano-2': 'rediseno/banos/bano_ducha_premium_v1.png',
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
