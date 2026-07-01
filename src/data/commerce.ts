import { getCommerceData } from './liveStore'

// Solo i campi realmente usati dal sito vivono nel bundle: commerce.json è stato
// sfoltito (996KB → 249KB) per velocizzare il caricamento. Il dataset Shopify
// completo è in ../_data_backup/commerce.full.json, da ri-esportare se serve.
//
// La SORGENTE è getCommerceData(): snapshot statico al primo render, dati LIVE da
// Shopify quando prepareLiveCommerce() li riceve in background (vedi main.tsx/App).
export type CommerceProduct = {
  id: string
  title: string
  brand: string
  category: 'ruzza-watch' | 'orologi' | 'luxury-bags' | 'gioielli' | 'profumi'
  subcategory: string
  sku: string
  url: string
  handle: string
  tags: string[]
  price: number
  currency: 'EUR'
  onRequest: boolean
  available: boolean
  description: string
  images: Array<{
    src: string
    alt?: string
    position?: number
    width?: number | null
    height?: number | null
  }>
  featuredImage: string
  altText: string
  variants: Array<Record<string, unknown>>
  publishedAt?: string | null
  updatedAt?: string | null
}

type BrandCollection = {
  name: string
  count: number
  handle: string
}

type CommerceData = {
  generatedAt: string
  sources: Record<string, string>
  collections: {
    ruzzaWatch: Record<'luxury' | 'basic' | 'accessori', string[]>
    watchMaison: string[]
    watchBrands: BrandCollection[]
    bagBrands: BrandCollection[]
    jewelryBrands: BrandCollection[]
    perfumeBrands: BrandCollection[]
  }
  products: {
    ruzzaWatch: CommerceProduct[]
    watches: CommerceProduct[]
    luxuryBags: CommerceProduct[]
    jewelry: CommerceProduct[]
    perfumes: CommerceProduct[]
  }
}

export let commerce = getCommerceData() as CommerceData

export let ruzzaWatchProducts = commerce.products.ruzzaWatch
export let watchProducts = commerce.products.watches
export let luxuryBagProducts = commerce.products.luxuryBags
export let jewelryProducts = commerce.products.jewelry ?? []
export let perfumeProducts = commerce.products.perfumes
export let allCommerceProducts = [
  ...watchProducts,
  ...ruzzaWatchProducts,
  ...luxuryBagProducts,
  ...jewelryProducts,
  ...perfumeProducts,
]

function byPublishedDate(products: CommerceProduct[]): CommerceProduct[] {
  return [...products].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt || a.updatedAt || '')
    const bTime = Date.parse(b.publishedAt || b.updatedAt || '')
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
    if (Number.isNaN(aTime)) return 1
    if (Number.isNaN(bTime)) return -1
    return bTime - aTime
  })
}

function buildNewProducts(): CommerceProduct[] {
  const latestWatches = byPublishedDate(watchProducts).slice(0, 16)
  const latestBags = byPublishedDate(luxuryBagProducts).slice(0, 8)
  const latestJewelry = byPublishedDate(jewelryProducts).slice(0, 6)
  const latestRuzzaWatch = byPublishedDate(ruzzaWatchProducts.filter((product) => product.subcategory !== 'accessori')).slice(0, 4)

  return [...latestWatches, ...latestBags, ...latestJewelry, ...latestRuzzaWatch]
}

export let newProducts = buildNewProducts()

export let mainWatchMaisons = commerce.collections.watchMaison
export let watchBrands = commerce.collections.watchBrands
export let bagBrands = commerce.collections.bagBrands
export let jewelryBrands = commerce.collections.jewelryBrands ?? []
export let perfumeBrands = commerce.collections.perfumeBrands

export function refreshCommerceData(): void {
  commerce = getCommerceData() as CommerceData
  ruzzaWatchProducts = commerce.products.ruzzaWatch
  watchProducts = commerce.products.watches
  luxuryBagProducts = commerce.products.luxuryBags
  jewelryProducts = commerce.products.jewelry ?? []
  perfumeProducts = commerce.products.perfumes
  allCommerceProducts = [
    ...watchProducts,
    ...ruzzaWatchProducts,
    ...luxuryBagProducts,
    ...jewelryProducts,
    ...perfumeProducts,
  ]
  newProducts = buildNewProducts()
  mainWatchMaisons = commerce.collections.watchMaison
  watchBrands = commerce.collections.watchBrands
  bagBrands = commerce.collections.bagBrands
  jewelryBrands = commerce.collections.jewelryBrands ?? []
  perfumeBrands = commerce.collections.perfumeBrands
}

// Soglia-lusso: i prezzi-segnaposto (es. 1€ su Shopify per "prezzo su richiesta")
// non devono MAI apparire come "€ 1" su orologi da decine di migliaia di euro.
// Nessun pezzo legittimo (anche Ruzza Watch Basic da ~130€) sta sotto questa soglia.
export const MIN_LUX_PRICE = 100

function formatEuroAmount(price: number): string {
  return Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Orologi di lusso: stato "boutique" legato alla quantità su Shopify (come il sito originale).
// qty 1 (available) → "Prenotato" · qty 0 (non available) → "Su richiesta" (prezzo su richiesta).
// NIENTE "Disponibile". NON si applica a Ruzza Watch (acquistabile) né ai profumi.
const RESERVATION_CATEGORIES = new Set<CommerceProduct['category']>(['orologi', 'luxury-bags', 'gioielli'])

export function formatCommercePrice(product: CommerceProduct): string {
  // Orologi con quantità 0 su Shopify → prezzo su richiesta (niente prezzo mostrato).
  if (RESERVATION_CATEGORIES.has(product.category) && !product.available) return 'Su richiesta'
  if (product.onRequest || product.price < MIN_LUX_PRICE) return product.category === 'profumi' ? 'Campione omaggio' : 'Su richiesta'
  return '€ ' + formatEuroAmount(product.price)
}

export function availabilityLabel(product: CommerceProduct): string {
  // Orologi: quantità 1 = "Prenotato", quantità 0 = "Su richiesta". Nessun "Disponibile".
  if (RESERVATION_CATEGORIES.has(product.category)) {
    return product.available ? 'Prenotato' : 'Su richiesta'
  }
  return product.available ? 'Disponibile' : 'Non disponibile'
}

export function cleanProductTitle(title: string): string {
  return title
    .replace(/''([^']*?)''/g, '“$1”')
    .replace(/''/g, '”')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanImportedDescription(description: string): string {
  const importedBoilerplate = ['prodotto', 'reale', 'dal', 'catalogo', 'ufficiale', 'Ruzza'].join('\\s+')
  const importedBoilerplatePattern = new RegExp(
    `:?\\s*${importedBoilerplate}(?:\\s+Orologi)?(?:\\s+Luxury\\s+Bags)?\\.?`,
    'gi',
  )

  return description
    .replace(importedBoilerplatePattern, '.')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
}

export function shortDescription(product: CommerceProduct, max = 150): string {
  const text = cleanImportedDescription(product.description)
  const fallback = product.tags.slice(0, 4).join(' · ')
  if (!text || /lorem ipsum/i.test(text)) return fallback
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '...'
}

export function productsByBrand(products: CommerceProduct[], brand: string): CommerceProduct[] {
  return products.filter((product) => product.brand.toLowerCase() === brand.toLowerCase())
}

export function productsBySubcategory(products: CommerceProduct[], subcategory: string): CommerceProduct[] {
  return products.filter((product) => product.subcategory === subcategory)
}

export function productByHandle(handle: string): CommerceProduct | undefined {
  return allCommerceProducts.find((product) => product.handle === handle)
}

export function uniqueBrands(products: CommerceProduct[]): string[] {
  return Array.from(new Set(products.map((product) => product.brand))).sort((a, b) => a.localeCompare(b))
}

export function productStats(products: CommerceProduct[]) {
  const available = products.filter((product) => product.available).length
  return {
    total: products.length,
    available,
    brands: uniqueBrands(products).length,
  }
}
