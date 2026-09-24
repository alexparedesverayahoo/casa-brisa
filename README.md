# Casa Brisa — web inmersiva

Landing para alquilar por temporada el depa 004 (Casa Brisa) de Playa Chocalla, Condominio Arena y Campo, (km 92.5 Panamericana Sur, Asia, Lima) vía Airbnb.

## Concepto
"Un día entero en la caleta": el scroll controla la hora del día. El hero es una secuencia de fotogramas (canvas) generada con Higgsfield (Seedance 2.5) a partir de fotos reales del depa editadas con Nano Banana Pro: mediodía → atardecer → noche.

## Desarrollo
```bash
npm install
npm run dev
```

## Estructura
- `index.html` — secciones de la página
- `src/film.js` — motor de secuencias de fotogramas (carga progresiva, dibujo tipo cover)
- `src/main.js` — Lenis + GSAP ScrollTrigger, capítulos, reloj solar, día/noche, galería, reserva
- `src/config.js` — datos del anuncio (ID de Airbnb, WhatsApp, capacidad) — **completar antes de publicar**
- `tools/build_frames.py` — convierte clips MP4 en secuencias WebP (escritorio 16:9 y celular 9:16)
- `tools/build_images.py` — exporta las fotos editadas a WebP

## Regenerar fotogramas
```bash
python tools/build_frames.py caleta 240 clip_dia_atardecer.mp4 clip_atardecer_noche.mp4 --focus 0.62
```
