import raw from './collection.json'

export type Watch = {
  title: string
  brand: string
  price: number
  on_request: boolean
  url: string
  image: string
  images: string[]
}

type CollectionData = { featured: Watch[]; all: Watch[] }

const data = raw as CollectionData

export const featured = data.featured
export const all = data.all

/** Format a price the luxury way: "€ 250.000" or "Su richiesta". */
export function formatPrice(w: Watch): string {
  if (w.on_request) return 'Su richiesta'
  return '€ ' + w.price.toLocaleString('it-IT', { maximumFractionDigits: 0 })
}

/** Normalize the marketplace title: pair up '' …'' into proper “ ” quotes. */
export function cleanTitle(title: string): string {
  return title
    .replace(/''([^']*?)''/g, '“$1”') // “nickname”
    .replace(/''/g, '”') // any stray pair-half
    .replace(/\s+/g, ' ')
    .trim()
}
