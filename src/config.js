// Datos del anuncio. Los marcados con POR CONFIRMAR deben validarse con el propietario
// antes de publicar: la web no debe prometer nada que el depa no tenga.
export const LISTING = {
  name: 'Casa Brisa',
  airbnbId: '', // POR CONFIRMAR: ID numérico del anuncio (airbnb.com.pe/rooms/<ID>)
  airbnbDomain: 'https://www.airbnb.com.pe',
  whatsapp: '51991966430',
  maxGuests: 8,
  heatedJacuzzi: false, // con hidromasaje, no temperado
  petsAllowed: true,
  includes: ['TV con cable', '2 cocheras', 'ropa de cama y toallas', 'limpieza de salida'],
  condo: 'Condominio Arena y Campo',
  areaM2: 100,
  priceFrom: 'S/ 1,500',
  checkIn: '15:00',
  checkOut: '12:00',
  walkToBeachMin: 5,
  bedrooms: 3,
  bathrooms: 2,
  place: 'Playa Chocalla',
  km: 'km 92.5 Panamericana Sur',
  district: 'Asia, Lima',
  coords: '12°44′12″S · 76°37′55″O',
}

export function airbnbUrl({ checkIn, checkOut, adults, children }) {
  if (!LISTING.airbnbId) return null
  const u = new URL(`/rooms/${LISTING.airbnbId}`, LISTING.airbnbDomain)
  if (checkIn) u.searchParams.set('check_in', checkIn)
  if (checkOut) u.searchParams.set('check_out', checkOut)
  if (adults) u.searchParams.set('adults', adults)
  if (children) u.searchParams.set('children', children)
  return u.toString()
}

export function whatsappUrl({ checkIn, checkOut, guests }) {
  if (!LISTING.whatsapp) return null
  const fmt = d => (d ? new Date(d + 'T12:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }) : '—')
  const people = guests ? ` para ${guests} ${guests == 1 ? 'persona' : 'personas'}` : ''
  const text = checkIn && checkOut
    ? `Hola, me interesa alquilar ${LISTING.name} (${LISTING.place}) del ${fmt(checkIn)} al ${fmt(checkOut)}${people}. ¿Está disponible?`
    : `Hola, me interesa alquilar ${LISTING.name} (${LISTING.place})${people}. ¿Qué fechas tienen disponibles?`
  return `https://wa.me/${LISTING.whatsapp}?text=${encodeURIComponent(text)}`
}
