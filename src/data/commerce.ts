import raw from './commerce.json'

export type ProductVariant = {
  id: string
  title: string
  sku: string
  price: number
  compareAtPrice: number | null
  available: boolean
  requiresShipping: boolean
  taxable: boolean
  options: string[]
}

export type ProductImage = {
  src: string
  alt: string
  position: number
  width?: number | null
  height?: number | null
}

export type CommerceProduct = {
  id: string
  shopifyProductId: string
  source: string
  title: string
  handle: string
  vendor: string
  brand: string
  model: string
  productType: string
  category: 'ruzza-watch' | 'orologi' | 'luxury-bags' | 'profumi'
  subcategory: string
  collections: string[]
  tags: string[]
  descriptionHtml: string
  description: string
  price: number
  compareAtPrice: number | null
  currency: 'EUR'
  onRequest: boolean
  available: boolean
  inventoryPolicy: string
  sku: string
  variants: ProductVariant[]
  options: Array<Record<string, unknown>>
  images: ProductImage[]
  featuredImage: string
  altText: string
  url: string
  collectionUrl: string
  status: string
  publishedAt: string | null
  updatedAt: string | null
  metafields: Record<string, string>
}

type BrandCollection = {
  name: string
  count: number
  handle: string
  url: string
}

type CommerceData = {
  generatedAt: string
  sources: Record<string, string>
  collections: {
    ruzzaWatch: Record<'luxury' | 'basic' | 'accessori', string[]>
    watchMaison: string[]
    watchBrands: BrandCollection[]
    bagBrands: BrandCollection[]
    perfumeBrands: BrandCollection[]
  }
  products: {
    ruzzaWatch: CommerceProduct[]
    watches: CommerceProduct[]
    luxuryBags: CommerceProduct[]
    perfumes: CommerceProduct[]
  }
}

export const commerce = raw as CommerceData

export const ruzzaWatchProducts = commerce.products.ruzzaWatch
export const watchProducts = commerce.products.watches
export const luxuryBagProducts = commerce.products.luxuryBags
export const perfumeProducts = commerce.products.perfumes

export const mainWatchMaisons = commerce.collections.watchMaison
export const watchBrands = commerce.collections.watchBrands
export const bagBrands = commerce.collections.bagBrands
export const perfumeBrands = commerce.collections.perfumeBrands

export function formatCommercePrice(product: CommerceProduct): string {
  if (product.onRequest || product.price <= 0) return product.category === 'profumi' ? 'Campione omaggio' : 'Su richiesta'
  return '€ ' + product.price.toLocaleString('it-IT', { maximumFractionDigits: 0 })
}

export function availabilityLabel(product: CommerceProduct): string {
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
  const fallback = product.metafields?.story || product.tags.slice(0, 4).join(' · ')
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
