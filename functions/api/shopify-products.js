const STORE_ORIGINS = {
  orologi: 'https://ruzza-orologi.myshopify.com',
  'ruzza-watch': 'https://6vm01f-ds.myshopify.com',
  bags: 'https://ruzzabags.com',
}

const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url)
  const store = url.searchParams.get('store') || 'orologi'
  const origin = STORE_ORIGINS[store]

  if (!origin) {
    return Response.json({ error: 'Unknown store' }, { status: 400, headers: corsHeaders })
  }

  const limit = clampInt(url.searchParams.get('limit'), 250, 1, 250)
  const page = clampInt(url.searchParams.get('page'), 1, 1, 20)
  // Opzionale: feed di una collezione specifica (es. gioielli) invece dell'intero catalogo.
  const collection = (url.searchParams.get('collection') || '').replace(/[^a-z0-9-]/gi, '')
  const path = collection ? `/collections/${collection}/products.json` : '/products.json'
  const upstream = `${origin}${path}?limit=${limit}&page=${page}`
  const upstreamResponse = await fetch(upstream, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'it-IT,it;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
    },
  })

  const body = await upstreamResponse.text()
  return new Response(body, {
    status: upstreamResponse.status,
    headers: {
      ...corsHeaders,
      'content-type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  })
}
