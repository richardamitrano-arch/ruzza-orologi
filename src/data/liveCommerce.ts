// @ts-ignore — modulo JS puro (la mappatura), nessun tipo necessario
import { buildCommerce } from './buildCommerce.mjs'
import { setLiveCommerce } from './liveStore'
import { RUZZA_WATCH_FEED_ORIGIN, RUZZABAGS_FEED_ORIGIN, SHOPIFY_FEED_ORIGIN } from '../lib/shopify'

/**
 * Aggancio LIVE a Shopify. Scarica i prodotti veri dai feed permanenti Shopify
 * (di default myshopify, quindi non dipendono dal dominio pubblico del sito),
 * li mappa e li mette nello store. Se qualcosa va storto (timeout, rete, CORS)
 * NON fa nulla → il sito usa lo snapshot statico (rete di sicurezza). Va chiamata
 * in main.tsx PRIMA di montare React.
 *
 * Nota produzione: se il CORS diretto non basta, FEED_BASE diventa l'URL di un
 * piccolo Cloudflare Worker che fa da proxy (server-to-server + cache + CORS).
 */
const BROWSER_TIMEOUT_MS = 3500
const NATIVE_TIMEOUT_MS = 6500
const MAX_PAGES = 6
const DEFAULT_COMMERCE_PROXY_ORIGIN = 'https://ruzza-orologi-staging.pages.dev'

type RawProduct = Record<string, unknown> & { variants?: unknown[] }
type StoreKey = 'orologi' | 'ruzza-watch' | 'bags'
type LiveDiagnosticEvent = Record<string, unknown>
type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean
  }
}

function normalizeOptionalOrigin(value: string | undefined): string {
  const candidate = (value || '').trim().replace(/\/+$/, '')
  if (!candidate) return ''
  try {
    return new URL(candidate).origin
  } catch {
    return ''
  }
}

const COMMERCE_PROXY_ORIGIN = normalizeOptionalOrigin(import.meta.env.VITE_COMMERCE_PROXY_ORIGIN)

function isNativeRuntime(): boolean {
  try {
    return Boolean((window as CapacitorWindow).Capacitor?.isNativePlatform?.())
  } catch {
    return false
  }
}

function commerceProxyUrl(path: string): string {
  const origin = COMMERCE_PROXY_ORIGIN || (isNativeRuntime() ? DEFAULT_COMMERCE_PROXY_ORIGIN : '')
  return origin ? `${origin}${path}` : path
}

function recordLiveDiagnostic(event: LiveDiagnosticEvent): void {
  try {
    const win = window as unknown as { __ruzzaLiveDiagnostics?: LiveDiagnosticEvent[] }
    win.__ruzzaLiveDiagnostics = [...(win.__ruzzaLiveDiagnostics || []), { at: new Date().toISOString(), ...event }]
    if (typeof event.step === 'string') {
      document.documentElement.dataset.ruzzaLiveStep = event.step
    }
    if (typeof event.reason === 'string') {
      document.documentElement.dataset.ruzzaLiveReason = event.reason
    }
    if (typeof event.message === 'string') {
      document.documentElement.dataset.ruzzaLiveError = event.message
    }
  } catch {
    /* no-op */
  }
}

async function fetchProductPage(url: string, signal: AbortSignal): Promise<RawProduct[]> {
  const started = Date.now()
  const res = await fetch(url, {
    signal,
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    recordLiveDiagnostic({ step: 'page', url, status: res.status, ok: false, ms: Date.now() - started })
    return []
  }
  const data = (await res.json()) as { products?: RawProduct[] }
  const products = Array.isArray(data.products) ? data.products : []
  recordLiveDiagnostic({ step: 'page', url, status: res.status, ok: true, count: products.length, ms: Date.now() - started })
  return products
}

async function fetchProducts(baseUrl: string, signal: AbortSignal): Promise<RawProduct[]> {
  const out: RawProduct[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const sep = baseUrl.includes('?') ? '&' : '?'
    const batch = await fetchProductPage(`${baseUrl}${sep}limit=250&page=${page}`, signal)
    out.push(...batch)
    if (batch.length < 250) break
  }
  return out
}

async function fetchProductsViaProxy(store: StoreKey, signal: AbortSignal, collection?: string): Promise<RawProduct[]> {
  const out: RawProduct[] = []
  const collectionParam = collection ? `&collection=${encodeURIComponent(collection)}` : ''
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = commerceProxyUrl(`/api/shopify-products?store=${store}${collectionParam}&limit=250&page=${page}`)
    const batch = await fetchProductPage(url, signal)
    out.push(...batch)
    if (batch.length < 250) break
  }
  return out
}

async function fetchProductsLive(
  store: StoreKey,
  fallbackBaseUrl: string,
  signal: AbortSignal,
  collection?: string,
): Promise<RawProduct[]> {
  try {
    const proxied = await fetchProductsViaProxy(store, signal, collection)
    if (proxied.length) return proxied
  } catch {
    /* fallback below */
  }
  return fetchProducts(fallbackBaseUrl, signal)
}

export async function prepareLiveCommerce(): Promise<boolean> {
  const timeoutMs = isNativeRuntime() ? NATIVE_TIMEOUT_MS : BROWSER_TIMEOUT_MS
  recordLiveDiagnostic({ step: 'start', fetchType: typeof fetch, timeoutMs })
  if (typeof fetch === 'undefined') {
    recordLiveDiagnostic({ step: 'stop', reason: 'fetch-unavailable' })
    return false
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const [allOro, ruzza, bagsAll, jewelry] = await Promise.all([
      fetchProductsLive('orologi', `${SHOPIFY_FEED_ORIGIN}/products.json`, ctrl.signal),
      fetchProductsLive('ruzza-watch', `${RUZZA_WATCH_FEED_ORIGIN}/products.json`, ctrl.signal),
      fetchProductsLive('bags', `${RUZZABAGS_FEED_ORIGIN}/products.json`, ctrl.signal),
      fetchProductsLive('bags', `${RUZZABAGS_FEED_ORIGIN}/collections/gioielli/products.json`, ctrl.signal, 'gioielli'),
    ])
    // Se non è arrivato niente di valido, NON sovrascrivo: resta lo snapshot.
    if (!allOro.length && !ruzza.length && !bagsAll.length) {
      recordLiveDiagnostic({ step: 'stop', reason: 'empty-live', watches: allOro.length, ruzzaWatch: ruzza.length, bags: bagsAll.length })
      return false
    }
    const data = buildCommerce({
      allRuzzaOrologi: allOro,
      collectionWatches: [],
      bagRaw: [],
      bagsStoreRaw: bagsAll,
      jewelryRaw: jewelry,
      ruzzaRaw: ruzza,
    }) as unknown
    setLiveCommerce(data)
    document.documentElement.dataset.ruzzaLiveReason = ''
    document.documentElement.dataset.ruzzaLiveError = ''
    recordLiveDiagnostic({
      step: 'success',
      watchesRaw: allOro.length,
      ruzzaWatchRaw: ruzza.length,
      bagsRaw: bagsAll.length,
      jewelryRaw: jewelry.length,
    })
    return true
  } catch (error) {
    // timeout / rete / CORS → fallback automatico allo snapshot statico
    recordLiveDiagnostic({ step: 'error', message: error instanceof Error ? error.message : String(error) })
    return false
  } finally {
    clearTimeout(timer)
  }
}
