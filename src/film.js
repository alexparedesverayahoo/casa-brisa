// Secuencia de fotogramas dibujada en canvas y controlada por el scroll.
// Carga progresiva: primero el fotograma 0, luego uno de cada 8, luego el resto,
// así el scrub funciona desde el primer segundo y gana nitidez mientras carga.

const pad = (n, w) => String(n).padStart(w, '0')

export class FrameSequence {
  constructor(canvas, { base, count, ext = 'webp', digits = 4, focusX = 0.5, focusY = 0.5, version = '', fit = 'cover' }) {
    this.fit = fit
    this.query = version ? `?v=${version}` : ''
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.base = base
    this.count = count
    this.ext = ext
    this.digits = digits
    this.focusX = focusX
    this.focusY = focusY
    this.frames = new Array(count)
    this.current = -1
    this.target = 0
    this.listeners = new Set()
    this.resize = this.resize.bind(this)
    window.addEventListener('resize', this.resize)
    this.resize()
  }

  src(i) {
    return `${this.base}/${pad(i + 1, this.digits)}.${this.ext}${this.query}`
  }

  loadFrame(i) {
    if (this.frames[i]) return this.frames[i].promise
    const img = new Image()
    img.decoding = 'async'
    const entry = { img, ready: false }
    entry.promise = new Promise(resolve => {
      img.onload = () => {
        const done = () => { entry.ready = true; resolve(entry); this.onFrameReady(i) }
        img.decode ? img.decode().then(done, done) : done()
      }
      img.onerror = () => resolve(entry)
    })
    img.src = this.src(i)
    this.frames[i] = entry
    return entry.promise
  }

  async load() {
    await this.loadFrame(0)
    this.draw(0)
    const order = []
    for (let step of [8, 4, 2, 1]) {
      for (let i = 0; i < this.count; i += step) if (!order.includes(i)) order.push(i)
    }
    // Cargar de a 6 en paralelo para no saturar la red móvil
    let cursor = 0
    const worker = async () => {
      while (cursor < order.length) await this.loadFrame(order[cursor++])
    }
    await Promise.all(Array.from({ length: 6 }, worker))
  }

  onFrameReady(i) {
    // Si llega un fotograma más cercano al objetivo, redibujar
    if (Math.abs(i - this.target) < Math.abs(this.current - this.target)) this.draw(this.target)
    this.listeners.forEach(fn => fn(i))
  }

  nearestReady(i) {
    for (let d = 0; d < this.count; d++) {
      const a = this.frames[i - d], b = this.frames[i + d]
      if (a && a.ready) return i - d
      if (b && b.ready) return i + d
    }
    return -1
  }

  setProgress(p) {
    this.target = Math.round(Math.min(1, Math.max(0, p)) * (this.count - 1))
    this.draw(this.target)
  }

  draw(i) {
    const k = this.nearestReady(i)
    if (k < 0 || k === this.current) return
    this.current = k
    const img = this.frames[k].img
    if (this.fit === 'band') drawBand(this.ctx, img, this.canvas.width, this.canvas.height)
    else drawCover(this.ctx, img, this.canvas.width, this.canvas.height, this.focusX, this.focusY)
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = this.canvas.getBoundingClientRect()
    this.canvas.width = Math.round(r.width * dpr)
    this.canvas.height = Math.round(r.height * dpr)
    this.onResize && this.onResize(r.width, r.height)
    const k = this.current
    this.current = -1
    if (k >= 0) this.draw(k)
  }
}

// Dibuja una imagen cubriendo el canvas (como object-fit: cover) con punto focal.
export function drawCover(ctx, img, cw, ch, fx = 0.5, fy = 0.5) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const s = Math.max(cw / iw, ch / ih)
  const w = iw * s, h = ih * s
  const x = (cw - w) * fx, y = (ch - h) * fy
  ctx.drawImage(img, x, y, w, h)
}

// Celular en vertical: la escena completa (16:9) a todo el ancho, sin recortar.
// Devuelve el rectángulo que ocupa dentro de un área cw × ch (en las mismas unidades).
export function bandRect(cw, ch, ratio = 16 / 9) {
  const w = cw, h = cw / ratio
  const y = Math.max(ch * 0.11, (ch - h) * 0.34)
  return { x: 0, y, w, h }
}

// Fondo ambiente: el mismo fotograma reducido a pocos píxeles y ampliado (desenfoque barato), oscurecido
const tiny = typeof document !== 'undefined' ? document.createElement('canvas') : null
if (tiny) { tiny.width = 24; tiny.height = 14 }

export function drawBand(ctx, img, cw, ch) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const t = tiny.getContext('2d')
  t.drawImage(img, 0, 0, tiny.width, tiny.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'low'
  const s = Math.max(cw / tiny.width, ch / tiny.height) * 1.15
  ctx.drawImage(tiny, (cw - tiny.width * s) / 2, (ch - tiny.height * s) / 2, tiny.width * s, tiny.height * s)
  ctx.fillStyle = 'rgba(12, 20, 24, 0.55)'
  ctx.fillRect(0, 0, cw, ch)
  const r = bandRect(cw, ch, iw / ih)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, r.x, r.y, r.w, r.h)
}
