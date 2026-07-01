const OFFICIAL_HOSTS = new Set(['ruzzaorologi.com', 'www.ruzzaorologi.com'])
const DEFAULT_ORIGIN = 'https://ruzzaorologi.com'
const WHATSAPP_FALLBACK =
  'https://api.whatsapp.com/send?phone=+393319689707&text=Buongiorno,%20vorrei%20informazioni%20su%20un%20prodotto%20Ruzza%20Orologi'

function normalizeOrigin(value) {
  try {
    return new URL(String(value || '').replace(/\/+$/, '')).origin
  } catch {
    return ''
  }
}

export function shopifyHandoff(request, env, path) {
  const url = new URL(request.url)
  const configuredOrigin =
    normalizeOrigin(env.SHOPIFY_HANDOFF_ORIGIN) ||
    normalizeOrigin(env.SHOPIFY_ORIGIN) ||
    normalizeOrigin(env.VITE_SHOPIFY_ORIGIN)
  const fallbackOrigin = OFFICIAL_HOSTS.has(url.hostname) ? '' : DEFAULT_ORIGIN
  const origin = configuredOrigin || fallbackOrigin

  if (!origin) {
    return Response.redirect(WHATSAPP_FALLBACK, 302)
  }

  const target = new URL(path, origin)
  target.search = url.search
  const status = request.method === 'POST' ? 307 : 302
  return Response.redirect(target.toString(), status)
}
