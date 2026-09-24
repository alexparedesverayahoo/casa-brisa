// Datos del anuncio. Los marcados con POR CONFIRMAR deben validarse con el propietario
// antes de publicar: la web no debe prometer nada que el depa no tenga.
export const LISTING = {
  name: 'Caleta 004',
  airbnbId: '', // POR CONFIRMAR: ID numérico del anuncio (airbnb.com.pe/rooms/<ID>)
  airbnbDomain: 'https://www.airbnb.com.pe',
  whatsapp: '', // POR CONFIRMAR: número con código de país, sin + ni espacios (ej. 51987654321)
  maxGuests: 8,
  heatedJacuzzi: true,
  petsAllowed: true,
  includes: ['wifi', 'estacionamiento', 'ropa de cama y toallas'],
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
  const text = `Hola, me interesa el ${LISTING.name} en ${LISTING.place} del ${fmt(checkIn)} al ${fmt(checkOut)} para ${guests || '?'} personas. ¿Está disponible?`
  return `https://wa.me/${LISTING.whatsapp}?text=${encodeURIComponent(text)}`
}
