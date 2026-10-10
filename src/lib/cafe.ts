export const CAFE = {
  name: 'Maña Katha',
  shortName: 'MKC',
  tagline: 'Let’s begin our story',
  handle: '@manakathacafe',
  instagram: 'https://www.instagram.com/manakathacafe/',
  maps: 'https://maps.app.goo.gl/VdpnYcdjKGbKVV2u7',
  /** Approximate pin for embed preview (BNR Tower / Panama Godowns). */
  mapCenter: { lat: 17.3324, lng: 78.5799 },
  phone: '+91 88830 31111',
  phoneHref: 'tel:+918883031111',
  addressLines: [
    '5th & 6th floor, BNR Tower, Panama Godowns',
    'Above Mithaiwala, Vanasthalipuram, Hyderabad 500070',
  ],
  area: 'Vanasthalipuram',
  city: 'Hyderabad',
  blurb: 'Largest rooftop café in Hyderabad — Idi… MaNa Katha.',
} as const

/** Google Maps embed preview (no API key). Overlay link uses CAFE.maps. */
export function cafeMapEmbedUrl(): string {
  const { lat, lng } = CAFE.mapCenter
  const q = encodeURIComponent(
    'Mana Katha Cafe & Restaurant, Vanasthalipuram, Hyderabad',
  )
  return `https://maps.google.com/maps?q=${q}&ll=${lat},${lng}&z=16&output=embed`
}
