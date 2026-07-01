#!/usr/bin/env node

const DEFAULT_SITE_URL = 'https://ruzza-orologi-staging.pages.dev'
const OFFICIAL_HOSTS = new Set(['ruzzaorologi.com', 'www.ruzzaorologi.com'])

const args = new Map()
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i]
  if (!arg.startsWith('--')) continue
  const key = arg.slice(2)
  const next = process.argv[i + 1]
  if (!next || next.startsWith('--')) args.set(key, true)
  else {
    args.set(key, next)
    i += 1
  }
}

const skipShopify = args.has('skip-shopify')
const skipSite = args.has('skip-site')
const strictHandoff = args.has('strict-handoff')
const siteUrl = normalizeOrigin(String(args.get('site-url') || DEFAULT_SITE_URL))
const shopifyOrigin = args.has('shopify-origin') ? normalizeOrigin(String(args.get('shopify-origin'))) : ''

const checks = []
let firstProductHandle = String(args.get('product-handle') || '')

function normalizeOrigin(value) {
  try {
    return new URL(String(value || '').replace(/\/+$/, '')).origin
  } catch {
    return ''
  }
}

function hostOf(value) {
  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

function mark(ok, label, details = '') {
  checks.push({ ok, label, details })
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`${icon} ${label}${details ? ` — ${details}` : ''}`)
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
    },
    redirect: 'manual',
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* handled by caller */
  }
  return { res, text, json }
}

async function fetchChain(url, init = {}, maxRedirects = 5) {
  const chain = []
  let current = url

  for (let i = 0; i <= maxRedirects; i += 1) {
    const res = await fetch(current, {
      ...init,
      redirect: 'manual',
      headers: {
        accept: init.method === 'POST' ? 'text/html,*/*' : 'text/html,application/xhtml+xml,application/json,*/*',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
        ...(init.headers || {}),
      },
    })
    const location = res.headers.get('location') || ''
    chain.push({ url: current, status: res.status, location })

    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, current).toString()
      if (chain.some((entry) => entry.url === next)) {
        return { chain, finalUrl: next, finalStatus: res.status, loop: true }
      }
      current = next
      continue
    }

    return { chain, finalUrl: current, finalStatus: res.status, loop: false }
  }

  return { chain, finalUrl: current, finalStatus: chain.at(-1)?.status || 0, loop: true }
}

function chainSummary(result) {
  return result.chain
    .map((entry) => {
      const location = entry.location ? ` -> ${entry.location}` : ''
      return `${entry.status} ${entry.url}${location}`
    })
    .join(' | ')
}

function chainTouchesOfficial(result, allowedOrigin = '') {
  const allowedHost = hostOf(allowedOrigin)
  return result.chain.some((entry) => {
    const hosts = [hostOf(entry.url), hostOf(entry.location)].filter(Boolean)
    return hosts.some((host) => OFFICIAL_HOSTS.has(host) && host !== allowedHost)
  })
}

async function checkShopifyOrigin() {
  if (!shopifyOrigin) {
    mark(false, 'Shopify origin richiesto', 'usa --shopify-origin https://shop.ruzzaorologi.com')
    return
  }

  const originHost = hostOf(shopifyOrigin)
  mark(!OFFICIAL_HOSTS.has(originHost), 'Shopify origin non e il dominio ufficiale', shopifyOrigin)

  const productFeedUrl = `${shopifyOrigin}/products.json?limit=1`
  try {
    const { res, json } = await getJson(productFeedUrl)
    const products = Array.isArray(json?.products) ? json.products : []
    firstProductHandle = firstProductHandle || products[0]?.handle || ''
    mark(res.ok && products.length > 0, 'Shopify products.json leggibile', `${res.status} ${productFeedUrl}`)
    mark(Boolean(firstProductHandle), 'Handle prodotto reale trovato', firstProductHandle || 'mancante')
  } catch (error) {
    mark(false, 'Shopify products.json leggibile', error instanceof Error ? error.message : String(error))
  }

  const paths = [
    firstProductHandle ? `/products/${firstProductHandle}` : '',
    '/pages/contact',
    '/pages/privacy-policy',
    '/contact',
  ].filter(Boolean)

  for (const path of paths) {
    const result = await fetchChain(`${shopifyOrigin}${path}`)
    const touchesOfficial = chainTouchesOfficial(result, shopifyOrigin)
    const healthyStatus = result.finalStatus >= 200 && result.finalStatus < 400
    mark(!result.loop, `Shopify ${path} senza loop`, chainSummary(result))
    mark(!touchesOfficial, `Shopify ${path} NON torna a ruzzaorologi.com`, chainSummary(result))
    mark(healthyStatus, `Shopify ${path} status sano`, `final ${result.finalStatus}`)
  }
}

async function checkSite() {
  const routes = ['/', '/novita', '/orologi?brand=Rolex', '/borse']
  for (const route of routes) {
    const res = await fetch(`${siteUrl}${route}`, { redirect: 'manual' })
    mark(res.status === 200, `Pages route ${route} HTTP 200`, `${res.status} ${siteUrl}${route}`)
  }

  for (const apiPath of ['/api/shopify-products?store=orologi&limit=1', '/api/shopify-products?store=ruzza-watch&limit=1']) {
    const { res, json } = await getJson(`${siteUrl}${apiPath}`)
    const count = Array.isArray(json?.products) ? json.products.length : 0
    mark(res.ok && count > 0, `Pages proxy ${apiPath}`, `${res.status}, prodotti ${count}`)
  }

  const handle = firstProductHandle || 'rolex-daytona-116518ln-newman-2023-oysterflex-new'
  const productPage = await fetchChain(`${siteUrl}/products/${handle}`)
  mark(!productPage.loop, `Pages prodotto interno /products/${handle} senza loop`, chainSummary(productPage))
  mark(productPage.finalStatus === 200, `Pages prodotto interno /products/${handle} HTTP 200`, `final ${productPage.finalStatus}`)
  mark(!chainTouchesOfficial(productPage, siteUrl), `Pages prodotto interno /products/${handle} resta sulla landing`, chainSummary(productPage))

  const handoffs = [
    { path: '/pages/contact', method: 'GET' },
    { path: '/pages/privacy-policy', method: 'GET' },
    { path: '/contact', method: 'GET' },
    { path: '/contact', method: 'POST', body: new URLSearchParams({ form_type: 'customer', 'contact[email]': 'preflight@example.com' }) },
  ]

  for (const item of handoffs) {
    const result = await fetchChain(`${siteUrl}${item.path}`, {
      method: item.method,
      body: item.body,
    })
    mark(!result.loop, `Pages handoff ${item.method} ${item.path} senza loop`, chainSummary(result))

    if (strictHandoff) {
      const expectedHost = hostOf(shopifyOrigin)
      const location = result.chain[0]?.location || ''
      const actualHost = hostOf(location)
      mark(
        Boolean(expectedHost) && actualHost === expectedHost,
        `Pages handoff ${item.method} ${item.path} punta al dominio tecnico Shopify`,
        location || 'nessun Location header',
      )
    }
  }
}

console.log('Ruzza go-live preflight')
console.log(`site-url: ${siteUrl}`)
console.log(`shopify-origin: ${shopifyOrigin || '(saltato/non impostato)'}`)
console.log(`strict-handoff: ${strictHandoff ? 'si' : 'no'}`)
console.log('')

if (!skipShopify) await checkShopifyOrigin()
if (!skipSite) await checkSite()

const failed = checks.filter((check) => !check.ok)
console.log('')
console.log(`Risultato: ${checks.length - failed.length}/${checks.length} check passati`)
if (failed.length) {
  console.log('Blocchi:')
  for (const check of failed) console.log(`- ${check.label}${check.details ? ` — ${check.details}` : ''}`)
  process.exit(1)
}
