"""Blanco LED más fuerte: neutraliza el tono amarillo de paredes y techo sin tocar las llamas de las velas."""
import sys
import numpy as np
from PIL import Image


def whiten(im, strength=1.25):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    sat = a.max(-1) - a.min(-1)
    # zonas claras y poco saturadas (paredes, techo, piso): enfriar hacia blanco neutro
    w = np.clip((lum - 0.35) / 0.45, 0, 1) * np.clip(1 - sat / 0.35, 0, 1) * strength
    gray = lum[..., None].repeat(3, -1)
    target = np.clip(gray * 1.10 + 0.03, 0, 1)  # más brillante: blanco LED fuerte
    target[..., 2] = np.clip(target[..., 2] * 1.015, 0, 1)
    out = a * (1 - w[..., None]) + target * w[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    whiten(Image.open(src), float(sys.argv[3]) if len(sys.argv) > 3 else 1.0).save(dst)
