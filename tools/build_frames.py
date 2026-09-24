"""Convierte uno o más clips (concatenados) en secuencias WebP para el scroll-scrub.

Uso:
  python tools/build_frames.py caleta 160 clipA.mp4 clipB.mp4 [--focus 0.55]

Genera public/film/<acto>/d/0001.webp… (escritorio, 16:9, 1600 px)
y public/film/<acto>/m/0001.webp… (celular, recorte 9:16 con punto focal).
Si existe un clip vertical nativo, pasar --mobile clip916.mp4 para usarlo en vez del recorte.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FILM = ROOT / 'public' / 'film'


def extract(clips, tmp):
    """Extrae todos los fotogramas de los clips, en orden, a PNG."""
    frames = []
    for n, clip in enumerate(clips):
        out = tmp / f'c{n}'
        out.mkdir()
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(clip), str(out / '%05d.png')], check=True)
        part = sorted(out.glob('*.png'))
        # El último fotograma de un clip es el primero del siguiente: no duplicarlo
        if n < len(clips) - 1 and part:
            part = part[:-1]
        frames += part
    return frames


def pick(frames, count):
    if count >= len(frames):
        return frames
    step = (len(frames) - 1) / (count - 1)
    return [frames[round(i * step)] for i in range(count)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('act')
    ap.add_argument('count', type=int)
    ap.add_argument('clips', nargs='+')
    ap.add_argument('--focus', type=float, default=0.5, help='punto focal horizontal del recorte 9:16')
    ap.add_argument('--mobile', help='clip vertical nativo opcional')
    ap.add_argument('--dw', type=int, default=1600)
    ap.add_argument('--mw', type=int, default=720)
    ap.add_argument('--q', type=int, default=64)
    a = ap.parse_args()

    dest = FILM / a.act
    for sub in ('d', 'm'):
        shutil.rmtree(dest / sub, ignore_errors=True)
        (dest / sub).mkdir(parents=True)

    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t)
        frames = pick(extract([Path(c) for c in a.clips], tmp), a.count)
        mframes = None
        if a.mobile:
            mt = tmp / 'mobile'
            mt.mkdir()
            mframes = pick(extract([Path(a.mobile)], mt), a.count)

        dsize = msize = 0
        for i, f in enumerate(frames, 1):
            im = Image.open(f).convert('RGB')
            w, h = im.size
            d = im.resize((a.dw, round(h * a.dw / w)), Image.LANCZOS)
            p = dest / 'd' / f'{i:04d}.webp'
            d.save(p, 'WEBP', quality=a.q, method=6)
            dsize += p.stat().st_size

            if mframes:
                m = Image.open(mframes[i - 1]).convert('RGB')
            else:
                cw = round(h * 9 / 16)
                x = round((w - cw) * a.focus)
                m = im.crop((x, 0, x + cw, h))
            m = m.resize((a.mw, round(m.height * a.mw / m.width)), Image.LANCZOS)
            p = dest / 'm' / f'{i:04d}.webp'
            m.save(p, 'WEBP', quality=a.q, method=6)
            msize += p.stat().st_size

    print(f'{a.act}: {len(frames)} fotogramas · escritorio {dsize/1e6:.1f} MB · celular {msize/1e6:.1f} MB')


if __name__ == '__main__':
    sys.exit(main())
