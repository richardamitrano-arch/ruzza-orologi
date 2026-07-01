import staticRaw from './commerce.json'

/**
 * Store del catalogo. Restituisce i dati LIVE presi da Shopify se disponibili,
 * altrimenti lo SNAPSHOT statico (commerce.json) come rete di sicurezza.
 *
 * Flusso (vedi main.tsx): React monta subito con lo snapshot statico, poi
 * prepareLiveCommerce() prova Shopify in background. Se risponde, setLiveCommerce()
 * aggiorna lo store e notifica App, che rigenera gli export commerce e fa re-render.
 * Cosi il primo render non resta appeso alla rete.
 */
let live: unknown = null

export function setLiveCommerce(data: unknown): void {
  if (!data) return
  live = data
  // Diagnostica (utile per verificare/dimostrare che i dati sono LIVE da Shopify).
  try {
    const d = data as { generatedAt?: string; products?: Record<string, unknown[]> }
    ;(window as unknown as { __ruzzaCommerce?: unknown }).__ruzzaCommerce = {
      source: 'live-shopify',
      generatedAt: d.generatedAt,
      watches: d.products?.watches?.length ?? 0,
      luxuryBags: d.products?.luxuryBags?.length ?? 0,
      ruzzaWatch: d.products?.ruzzaWatch?.length ?? 0,
    }
    document.documentElement.dataset.ruzzaCommerce = 'live-shopify'
    document.documentElement.dataset.ruzzaWatches = String(d.products?.watches?.length ?? 0)
    document.documentElement.dataset.ruzzaLuxuryBags = String(d.products?.luxuryBags?.length ?? 0)
    document.documentElement.dataset.ruzzaWatch = String(d.products?.ruzzaWatch?.length ?? 0)
    window.dispatchEvent(
      new CustomEvent('ruzza:commerce-updated', {
        detail: (window as unknown as { __ruzzaCommerce?: unknown }).__ruzzaCommerce,
      }),
    )
  } catch {
    /* no-op */
  }
}

export function hasLiveCommerce(): boolean {
  return live !== null
}

export function getCommerceData(): unknown {
  return live ?? staticRaw
}
