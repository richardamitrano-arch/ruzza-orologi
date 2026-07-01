const DEFAULT_SHOPIFY_ORIGIN = 'https://ruzzaorologi.com'
const DEFAULT_SHOPIFY_FEED_ORIGIN = 'https://ruzza-orologi.myshopify.com'
const DEFAULT_RUZZA_WATCH_FEED_ORIGIN = 'https://6vm01f-ds.myshopify.com'
const DEFAULT_RUZZABAGS_FEED_ORIGIN = 'https://ruzzabags.com'
const RUZZA_OROLOGI_HOSTS = new Set(['ruzzaorologi.com', 'www.ruzzaorologi.com'])

type ShopifyProductRef = {
  category?: string
  handle: string
  url?: string
  variants?: Array<Record<string, unknown>>
  available?: boolean
  onRequest?: boolean
  price?: number
}

function normalizeOrigin(value: string | undefined): string {
  const candidate = (value || DEFAULT_SHOPIFY_ORIGIN).trim().replace(/\/+$/, '')
  try {
    return new URL(candidate).origin
  } catch {
    return DEFAULT_SHOPIFY_ORIGIN
  }
}

export const SHOPIFY_ORIGIN = normalizeOrigin(import.meta.env.VITE_SHOPIFY_ORIGIN)
export const SHOPIFY_FEED_ORIGIN = normalizeOrigin(
  import.meta.env.VITE_SHOPIFY_FEED_ORIGIN || DEFAULT_SHOPIFY_FEED_ORIGIN,
)
export const RUZZA_WATCH_FEED_ORIGIN = normalizeOrigin(
  import.meta.env.VITE_RUZZA_WATCH_FEED_ORIGIN || DEFAULT_RUZZA_WATCH_FEED_ORIGIN,
)
export const RUZZABAGS_FEED_ORIGIN = normalizeOrigin(
  import.meta.env.VITE_RUZZABAGS_FEED_ORIGIN || DEFAULT_RUZZABAGS_FEED_ORIGIN,
)

export function shopifyUrl(value: string): string {
  if (!value) return value

  try {
    const parsed = new URL(value, SHOPIFY_ORIGIN)
    const isRelative = value.startsWith('/')
    const isRuzzaOrologi = RUZZA_OROLOGI_HOSTS.has(parsed.hostname)

    if (isRelative || isRuzzaOrologi) {
      return `${SHOPIFY_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`
    }

    return value
  } catch {
    return value
  }
}

function shopifyOriginForProduct(product: ShopifyProductRef): string {
  if (product.category === 'ruzza-watch' || product.category === 'profumi') {
    return RUZZA_WATCH_FEED_ORIGIN
  }

  if (product.category === 'luxury-bags' || product.category === 'gioielli') {
    return RUZZABAGS_FEED_ORIGIN
  }

  if (product.category === 'orologi') {
    return SHOPIFY_FEED_ORIGIN
  }

  if (product.url) {
    try {
      return new URL(product.url).origin
    } catch {
      /* fallback below */
    }
  }

  return SHOPIFY_ORIGIN
}

function firstVariantId(product: ShopifyProductRef): string {
  const variants = product.variants || []
  const availableVariant = variants.find((variant) => variant.available !== false && variant.id)
  const fallbackVariant = variants.find((variant) => variant.id)
  return String((availableVariant || fallbackVariant)?.id || '')
}

export function shopifyProductUrl(product: ShopifyProductRef): string {
  const origin = shopifyOriginForProduct(product)
  return `${origin}/products/${encodeURIComponent(product.handle)}?utm_source=ruzza_app&utm_medium=ios_app`
}

export function shopifyCartUrl(product: ShopifyProductRef, quantity = 1): string {
  const variantId = firstVariantId(product)
  if (!variantId || product.available === false || product.onRequest) {
    return shopifyProductUrl(product)
  }

  const origin = shopifyOriginForProduct(product)
  return `${origin}/cart/${encodeURIComponent(variantId)}:${Math.max(1, quantity)}?utm_source=ruzza_app&utm_medium=ios_app`
}

export function canOpenShopifyCart(product: ShopifyProductRef): boolean {
  return Boolean(firstVariantId(product) && product.available !== false && !product.onRequest)
}

// URL "Acquista ora" → pagina prodotto sullo store Shopify giusto, dove il cliente completa l'acquisto.
// IMPORTANTE: per gli orologi si usa shop.ruzzaorologi.com (SHOPIFY_ORIGIN), NON ruzzaorologi.com
// che ora è il sito nuovo. Ruzza Watch/Profumi → ruzzawatch.com; Borse/Gioielli → ruzzabags.com.
const RUZZAWATCH_PUBLIC_ORIGIN = 'https://ruzzawatch.com'

export function storeBuyUrl(product: ShopifyProductRef): string {
  let base = SHOPIFY_ORIGIN
  if (product.category === 'ruzza-watch' || product.category === 'profumi') {
    base = RUZZAWATCH_PUBLIC_ORIGIN
  } else if (product.category === 'luxury-bags' || product.category === 'gioielli') {
    base = RUZZABAGS_FEED_ORIGIN
  }
  return `${base}/products/${encodeURIComponent(product.handle)}`
}

// "Acquista ora" SOLO per il Ruzza Watch (brand proprio, store pubblico ruzzawatch.com).
// Orologi di lusso, borse, gioielli, profumi = pezzi "su richiesta" → solo "Contattaci su WhatsApp".
export function canBuyDirect(product: ShopifyProductRef): boolean {
  if (product.category !== 'ruzza-watch') return false
  return product.available !== false && !product.onRequest && (product.price ?? 0) > 0
}
