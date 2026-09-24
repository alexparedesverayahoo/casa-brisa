import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { FrameSequence, drawCover } from './film.js'
import { LISTING, airbnbUrl, whatsappUrl } from './config.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const portrait = () => matchMedia('(max-aspect-ratio: 1/1)').matches
const clamp01 = v => Math.min(1, Math.max(0, v))

/* Scroll suave sincronizado con GSAP */
let lenis = null
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href')
    const el = id.length > 1 && document.querySelector(id)
    if (!el) return
    e.preventDefault()
    lenis ? lenis.scrollTo(el, { duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' })
  })
})

/* Capítulos: opacidad según el rango de progreso de su película */
function chapterAlpha(p, [a, b]) {
  const f = 0.045
  if (p < a || p > b) return 0
  return Math.min(1, (p - a) / f, (b - p) / f)
}

function setupChapters(section) {
  return [...section.querySelectorAll('[data-range]')].map(el => ({
    el,
    range: el.dataset.range.split(',').map(Number),
  }))
}

function renderChapters(chapters, p) {
  for (const c of chapters) {
    const a = chapterAlpha(p, c.range)
    c.el.style.opacity = a
    c.el.style.transform = `translateY(${(1 - a) * 24}px)`
    c.el.style.visibility = a > 0 ? 'visible' : 'hidden'
  }
}

/* Reloj solar del hero: 12:00 → 18:40 (atardecer) → 21:30 (noche con luna) */
const sundial = document.querySelector('.sundial')
const sun = document.querySelector('.sundial__sun')
const clock = document.querySelector('.sundial__time')
function renderSundial(p) {
  if (!sundial) return
  const minutes = p < 0.5 ? 720 + Math.pow(p / 0.5, 1.6) * 410 : 1130 + ((p - 0.5) / 0.5) * 160
  const h = Math.floor(minutes / 60), m = Math.floor(minutes % 60)
  clock.textContent = `${h}:${String(m).padStart(2, '0')}`
  // el sol baja por el arco hasta el horizonte; de noche la luna sube del otro lado
  const t = p < 0.5 ? 0.5 + (p / 0.5) * 0.5 : ((p - 0.5) / 0.5) * 0.45
  const ang = Math.PI * (1 - t)
  sun.setAttribute('cx', (60 + 52 * Math.cos(ang)).toFixed(1))
  sun.setAttribute('cy', (58 - 52 * Math.sin(ang)).toFixed(1))
  sundial.classList.toggle('is-night', p >= 0.5)
}

/* Escenas apiladas: navegar entre secciones aunque estén dentro de un .stack-group */
const inGroup = el => el.parentElement?.classList.contains('stack-group')
const isStack = el => !!el && (el.classList.contains('stack') || el.classList.contains('stack-group'))
const nextScene = el => el.nextElementSibling || (inGroup(el) ? el.parentElement.nextElementSibling : null)
function prevScene(el) {
  let p = el.previousElementSibling || (inGroup(el) ? el.parentElement.previousElementSibling : null)
  if (p?.classList.contains('stack-group')) p = p.lastElementChild
  return p
}

/* Películas */
const films = []
function buildFilm(section) {
  const name = section.dataset.film
  const variant = portrait() ? 'm' : 'd'
  const canvas = section.querySelector('.film__canvas')
  const seq = new FrameSequence(canvas, {
    base: `${import.meta.env.BASE_URL}film/${name}/${variant}`,
    count: Number(section.dataset.frames),
    focusX: 0.5,
  })
  const chapters = setupChapters(section)
  const film = { section, seq, chapters, name, progress: 0 }

  if (section.classList.contains('film--hero')) setupHero(film, variant)

  // Si la escena siguiente sube encima (carta apilada), la película termina antes de que la cubra
  const covered = () => (isStack(nextScene(section)) ? innerHeight : 0)
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => '+=' + Math.max(1, section.offsetHeight - innerHeight - covered()),
    invalidateOnRefresh: true,
    onUpdate: self => {
      film.progress = self.progress
      seq.setProgress(self.progress)
      renderChapters(chapters, self.progress)
      film.onProgress && film.onProgress(self.progress)
    },
  })
  renderChapters(chapters, 0)
  films.push(film)
  return film
}

/* Hero: palabra gigante detrás de las sombrillas (recorte con el cielo transparente) */
function setupHero(film, variant) {
  const word = film.section.querySelector('.hero-word')
  const cut = film.section.querySelector('.hero-cutout')
  const copy = film.section.querySelector('.hero-copy')
  const hud = film.section.querySelector('.hud')
  const ctx = cut.getContext('2d')
  const img = new Image()
  let ok = false
  const paint = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const r = cut.getBoundingClientRect()
    cut.width = Math.round(r.width * dpr)
    cut.height = Math.round(r.height * dpr)
    if (ok) drawCover(ctx, img, cut.width, cut.height, 0.5, 0.5)
  }
  img.onload = () => { ok = true; paint() }
  img.onerror = () => { cut.remove() }
  img.src = `${import.meta.env.BASE_URL}film/${film.name}/cutout-${variant}.webp`
  window.addEventListener('resize', paint)

  film.onProgress = p => {
    const k = clamp01(p / 0.07)
    word.style.opacity = 1 - k
    word.style.transform = `translateX(-50%) translateY(${-k * 8}vh) scale(${1 + k * 0.06})`
    cut.style.opacity = 1 - k
    copy.style.opacity = 1 - clamp01((p - 0.02) / 0.08)
    copy.style.transform = `translateY(${-clamp01(p / 0.1) * 40}px)`
    copy.style.visibility = p > 0.12 ? 'hidden' : 'visible'
    hud.style.opacity = clamp01((p - 0.05) / 0.05)
    renderSundial(p)
  }
  film.onProgress(0)
}

/* Intro: esperar el primer fotograma del hero y abrir */
async function intro() {
  const bar = document.querySelector('.intro__bar i')
  document.querySelectorAll('[data-film]').forEach(buildFilm)
  const hero = films[0]
  let loaded = 0
  const need = Math.min(24, hero.seq.count)
  const off = new Promise(res => {
    const onReady = () => {
      loaded++
      bar.style.setProperty('--p', Math.min(1, loaded / need))
      if (loaded >= need) { hero.seq.listeners.delete(onReady); res() }
    }
    hero.seq.listeners.add(onReady)
  })
  hero.seq.load()
  await Promise.race([off, new Promise(r => setTimeout(r, 4500))])
  document.body.classList.remove('is-loading')
  requestAnimationFrame(() => document.body.classList.add('is-ready'))
  if (!reduced) {
    gsap.fromTo(hero.section.querySelector('.film__canvas'), { scale: 1.14, filter: 'brightness(0.45)' }, { scale: 1, filter: 'brightness(1)', duration: 2.2, ease: 'expo.out' })
    gsap.fromTo('.hero-word', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.8, ease: 'expo.out', delay: 0.3, clearProps: 'transform' })
    gsap.fromTo('.hero-copy > *', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.6 })
  }
  // El resto de películas carga en segundo plano, cuando el hero ya está listo
  films.slice(1).forEach((f, i) => setTimeout(() => f.seq.load(), 1200 + i * 800))
}
intro()

/* Transiciones entre escenas: la anterior se aleja y oscurece mientras la nueva sube encima */
const facts = document.querySelector('.facts.stack')
const setStickyTop = () => { if (facts) facts.style.top = Math.min(0, innerHeight - facts.offsetHeight) + 'px' }
setStickyTop()
ScrollTrigger.addEventListener('refreshInit', setStickyTop)
document.querySelectorAll('.stack').forEach(next => {
  const prev = prevScene(next)
  if (!prev) return
  // el disparador no puede ser un elemento sticky: si es el primero de un grupo, usar el grupo
  const trigger = inGroup(next) && !next.previousElementSibling ? next.parentElement : next
  const target = prev.classList.contains('film') ? prev.querySelector('.film__sticky') : prev.querySelector(':scope > .wrap') || prev
  const dim = document.createElement('div')
  dim.className = 'scene-dim'
  ;(prev.classList.contains('film') ? target : prev).appendChild(dim)
  if (reduced) return
  gsap.timeline({ scrollTrigger: { trigger, start: 'top bottom', end: 'top top', scrub: true } })
    .fromTo(target, { scale: 1, y: 0 }, { scale: 0.9, y: -30, ease: 'none' }, 0)
    .fromTo(dim, { opacity: 0 }, { opacity: 0.72, ease: 'none' }, 0)
})

/* Navegación más sólida fuera del hero */
const nav = document.querySelector('.nav')
ScrollTrigger.create({
  trigger: '#film-caleta',
  start: 'bottom 80px',
  onEnter: () => nav.classList.add('is-solid'),
  onLeaveBack: () => nav.classList.remove('is-solid'),
})

/* Día / noche */
const dn = document.querySelector('.daynight')
const dnBtn = document.querySelector('.dn-toggle')
dnBtn.addEventListener('click', e => {
  if (e.isTrusted) dnBtn.classList.add('is-touched')
  const night = dnBtn.getAttribute('aria-pressed') !== 'true'
  dnBtn.setAttribute('aria-pressed', String(night))
  dn.classList.toggle('is-night', night)
})
// Pasar a noche sola al llegar, para que se descubra el efecto (una vez)
ScrollTrigger.create({
  trigger: dn,
  start: 'top 35%',
  once: true,
  onEnter: () => setTimeout(() => { if (dnBtn.getAttribute('aria-pressed') !== 'true') dnBtn.click() }, 900),
})

/* Interiores: recorrido horizontal fijado en escritorio */
ScrollTrigger.matchMedia({
  '(min-width: 721px)': () => {
    const track = document.querySelector('.rooms__track')
    const dist = () => track.scrollWidth - (window.innerWidth - track.getBoundingClientRect().left) + 40
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: { trigger: '.rooms', pin: '.rooms__pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true },
    })
  },
})

/* Aparición de bloques */
const toReveal = document.querySelectorAll('.facts .display, .facts__list li, .facts__note, .perks li, .daynight__head, .dn-card, .where .display, .where__lede, .where__list li, .route, .book__inner > *')
toReveal.forEach((el, i) => { el.setAttribute('data-reveal', ''); el.style.transitionDelay = `${(i % 6) * 70}ms` })
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
}, { rootMargin: '0px 0px -10% 0px' })
toReveal.forEach(el => io.observe(el))

/* Reserva */
const form = document.querySelector('.book__form')
const note = document.querySelector('.book__note')
const guests = form.elements.guests
for (let i = 1; i <= LISTING.maxGuests; i++) guests.add(new Option(`${i} ${i === 1 ? 'persona' : 'personas'}`, i, false, i === 4))
const iso = d => d.toISOString().slice(0, 10)
const today = new Date()
form.elements.checkIn.min = iso(today)
form.elements.checkIn.addEventListener('change', () => {
  const d = new Date(form.elements.checkIn.value + 'T12:00')
  d.setDate(d.getDate() + 1)
  form.elements.checkOut.min = iso(d)
  if (form.elements.checkOut.value && form.elements.checkOut.value <= form.elements.checkIn.value) form.elements.checkOut.value = iso(d)
})
const data = () => ({ checkIn: form.elements.checkIn.value, checkOut: form.elements.checkOut.value, adults: guests.value, guests: guests.value })
form.addEventListener('submit', e => {
  e.preventDefault()
  const url = airbnbUrl(data())
  if (!url) { note.textContent = 'Falta configurar el enlace del anuncio de Airbnb.'; return }
  window.open(url, '_blank', 'noopener')
})
form.querySelector('[data-action="whatsapp"]').addEventListener('click', () => {
  const url = whatsappUrl(data())
  if (!url) { note.textContent = 'Falta configurar el número de WhatsApp.'; return }
  window.open(url, '_blank', 'noopener')
})
document.querySelectorAll('[data-fact="guests"]').forEach(el => { el.textContent = LISTING.maxGuests })

/* Si cambia la orientación, recargar las secuencias adecuadas */
let wasPortrait = portrait()
window.addEventListener('resize', () => {
  if (portrait() !== wasPortrait) location.reload()
})
