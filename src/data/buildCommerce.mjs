// Mappatura PURA dei prodotti Shopify → struttura `commerce` del sito.
// È il port browser-side della logica di scripts/sync-commerce.mjs: prende gli array
// grezzi di /products.json e produce lo STESSO oggetto di commerce.json, così il resto
// del sito (commerce.ts + componenti) funziona identico, sia da snapshot che dal vivo.
// NB: tenere allineato a scripts/sync-commerce.mjs se quella cambia.

const WATCH_BRANDS = [
  'Audemars Piguet', 'Breguet', 'Breitling', 'Bulgari', 'Cartier', 'Chopard',
  'Franck Muller', 'Girard Perregaux', 'Hublot', 'IWC', 'Jaeger-LeCoultre',
  'Omega', 'Panerai', 'Patek Philippe', 'Piaget', 'Richard Mille', 'Rolex',
  'Tag Heuer', 'Tudor', 'Ulysse Nardin', 'Vacheron Constantin', 'Zenith',
]

const BAG_BRANDS = [
  'Balenciaga', 'Bottega Veneta', 'Burberry', 'Celine', 'Chanel', 'Dior', 'Dolce & Gabbana',
  'Fendi', 'Goyard', 'Gucci', 'Hermes', 'Jacquemus', 'Louis Vuitton', 'Prada', 'Saint Laurent',
]
const NON_BAG_TERMS =
  /\b(felpa|hoodie|sweatshirt|maglia|t-?shirt|shirt|camicia|giacca|jacket|pantalon|pants|shorts|scarpa|sneaker|shoes|cappello|hat|coat|gilet)\b/i
const BAG_TERMS =
  /\b(luxury bag|borse?|handbag|borsa|borsone|tracolla|marsupio|zaino|tote|clutch|pochette|valigia|wallet|portafogli|birkin|kelly|marmont|papillon|alma|noe|agenda)\b/i

// Gioielli (store ruzzabags.com → collezione "Gioielli"). La sorgente autoritativa è la
// collezione; questi servono come fallback di classificazione e per le etichette/tipo.
const JEWELRY_TERMS =
  /\b(anelli?|braccial\w*|bracelet|collan\w*|necklace|orecchin\w*|earring|ciondol\w*|pendant|gioiell\w*|jewel|groumette|girocollo|solitario|bangle|spilla)\b/i

function isJewelryProduct(product) {
  const pt = (product.product_type || '').toLowerCase()
  if (/anello|braccial|collana|orecchin|ciondol|gioiell/.test(pt)) return true
  const haystack = `${product.title || ''} ${(product.tags || []).join(' ')}`.toLowerCase()
  return JEWELRY_TERMS.test(haystack)
}

// Per i gioielli usiamo il TIPO come "brand"/filtro (più utile della maison su oreficeria).
// Il titolo ha priorità sul product_type, che su ruzzabags a volte è incoerente.
function jewelryType(product) {
  const title = (product.title || '').toLowerCase()
  const pt = (product.product_type || '').toLowerCase()
  if (/anelli?|solitario|\bfede\b|fedin/.test(title)) return 'Anelli'
  if (/braccial|bracelet|groumette|tennis|bangle/.test(title)) return 'Bracciali'
  if (/collan|necklace|girocollo|catenin/.test(title)) return 'Collane'
  if (/orecchin|earring/.test(title)) return 'Orecchini'
  if (/ciondol|pendant|charm/.test(title)) return 'Ciondoli'
  if (/spilla|brooch/.test(title)) return 'Spille'
  if (/anello/.test(pt)) return 'Anelli'
  if (/braccial/.test(pt)) return 'Bracciali'
  if (/collana/.test(pt)) return 'Collane'
  return 'Gioielli'
}

const PERFUMES = [
  { handle: 'prestigious-turchese', title: 'Prestigious Turchese', variant: 'Turchese', image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/prestigious-turchese.png?v=1781623366' },
  { handle: 'prestigious-lapislazzuli', title: 'Prestigious Lapislazzuli', variant: 'Lapislazzuli', image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/prestigious-lapislazzuli.png?v=1781623365' },
  { handle: 'prestigious-onice', title: 'Prestigious Onice', variant: 'Onice', image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/prestigious-onice.png?v=1781623365' },
]

// Soglia-lusso (allineata a commerce.ts): prezzi-segnaposto sotto i 100€ → su richiesta.
const MIN_LUX_PRICE = 100
// Prefisso SKU sintetico quando Shopify non espone lo SKU (feed pubblico), così la
// scheda mantiene il chip SKU sia in live sia da snapshot (coerenza live↔snapshot).
const SKU_PREFIX = { orologi: 'OR', 'luxury-bags': 'LB', 'ruzza-watch': 'RW', profumi: 'LR', gioielli: 'GI' }

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePrice(value) {
  const price = Number.parseFloat(String(value || 0))
  return Number.isFinite(price) ? price : 0
}

function firstVariant(product) {
  return product.variants?.[0] || {}
}

// Un tag NON è un brand se è un colore, uno stile, una misura o un descrittore generico.
// Ancorato (^...$): scarta solo i tag che SONO esattamente questi termini.
const NON_BRAND_TAG =
  /^(orologi|orologio|luxury ?bags?|import|a mano|fatto a mano|a spalla|a tracolla|tracolla|vintage|usat[oa]|nuov[oa]|new|original[ei]|gioiell\w*|borse?|bag|second[oa]|pelle|tela|canvas|bianc[oa]|ner[oa]|ross[oa]|beige|marron[ei]|verde|blu|giall[oa]|grigi[oa]|rosa|oro|argento|mini|maxi|medium|small|large|gm|pm|donna|uomo|unisex|marsupio|falabella|pochette|clutch|zaino|tote|shopper|shopping|baguette|hobo|portafogli\w*|wallet|cintura|belt|borsone|valigia|trolley)$/i

function detectBrand(product, brands, fallback = '') {
  const tags = product.tags || []
  const titleHaystack = `${product.title || ''} ${product.handle || ''}`.toLowerCase()
  const productBrand = brands.find((item) => titleHaystack.includes(item.toLowerCase()))
  if (productBrand) return productBrand
  const vendorBrand = brands.find((item) => String(product.vendor || '').toLowerCase().includes(item.toLowerCase()))
  if (vendorBrand) return vendorBrand
  const tagHaystack = tags.join(' ').toLowerCase()
  const brand = brands.find((item) => tagHaystack.includes(item.toLowerCase()))
  if (brand) return brand
  // Match anche con spazi/punteggiatura rimossi (es. tag "louisvuitton" → Louis Vuitton).
  const compactHaystack = `${titleHaystack} ${tagHaystack} ${String(product.vendor || '').toLowerCase()}`.replace(/[^a-z0-9]/g, '')
  const compactBrand = brands.find((item) => compactHaystack.includes(item.toLowerCase().replace(/[^a-z0-9]/g, '')))
  if (compactBrand) return compactBrand
  // Solo per categorie senza fallback dedicato (orologi): prova un tag come brand.
  // Per le borse (fallback='Luxury Bags') NON usiamo tag arbitrari → niente brand-spazzatura.
  if (!fallback) {
    const tag = tags.find((item) => item && !NON_BRAND_TAG.test(item.trim()))
    if (tag) return tag.replace(/^Herm[eè]s$/i, 'Hermes')
  }
  if (product.vendor && !/ruzza/i.test(product.vendor)) return product.vendor
  return fallback || 'Ruzza Orologi'
}

function isLikelyBagProduct(product) {
  const haystack = `${product.title || ''} ${(product.tags || []).join(' ')} ${product.product_type || ''} ${product.body_html || ''}`
  if (NON_BAG_TERMS.test(haystack)) return false
  return BAG_TERMS.test(haystack) || BAG_BRANDS.some((brand) => haystack.toLowerCase().includes(brand.toLowerCase()))
}

function mapImages(product) {
  return (product.images || []).map((image, index) => ({
    src: image.src || '',
    alt: `${product.title || 'Prodotto'} ${index + 1}`,
    position: Number(image.position || index + 1),
    width: image.width || null,
    height: image.height || null,
  }))
}

function mapVariants(product) {
  return (product.variants || []).map((variant) => ({
    id: String(variant.id || ''),
    title: variant.title || 'Default Title',
    sku: variant.sku || '',
    price: parsePrice(variant.price),
    compareAtPrice: variant.compare_at_price ? parsePrice(variant.compare_at_price) : null,
    available: Boolean(variant.available),
    requiresShipping: Boolean(variant.requires_shipping),
    taxable: Boolean(variant.taxable),
    options: [variant.option1, variant.option2, variant.option3].filter(Boolean),
  }))
}

function mapProduct(product, { category, source, baseUrl, brand, collectionHandle, subcategory = '' }) {
  const variant = firstVariant(product)
  const price = parsePrice(variant.price)
  const images = mapImages(product)
  return {
    id: `${category}:${product.id}`,
    shopifyProductId: String(product.id),
    source,
    title: product.title || '',
    handle: product.handle || '',
    vendor: product.vendor || brand,
    brand,
    model: (product.title || '').replace(new RegExp(`^${brand}\\s*`, 'i'), '').trim() || product.title || '',
    productType: product.product_type || '',
    category,
    subcategory,
    collections: [collectionHandle, `${category === 'orologi' ? 'orologi' : category}-${slugify(brand)}`].filter(Boolean),
    tags: product.tags || [],
    descriptionHtml: product.body_html || '',
    description: stripHtml(product.body_html),
    price,
    compareAtPrice: variant.compare_at_price ? parsePrice(variant.compare_at_price) : null,
    currency: 'EUR',
    onRequest: price < MIN_LUX_PRICE,
    available: (product.variants || []).some((item) => Boolean(item.available)),
    inventoryPolicy: variant.inventory_policy || '',
    sku: variant.sku || `${SKU_PREFIX[category] || 'RZ'}-${product.id}`,
    variants: mapVariants(product),
    options: product.options || [],
    images,
    featuredImage: images[0]?.src || '',
    altText: product.title || '',
    url: `${baseUrl}/products/${product.handle}`,
    status: product.published_at ? 'published' : 'draft',
    publishedAt: product.published_at || null,
    updatedAt: product.updated_at || null,
    metafields: { 'ruzza.source_category': category },
  }
}

function productCollections(category, brand, subcategory) {
  if (category === 'ruzza-watch') return [`ruzza-watch-${subcategory}`, 'ruzza-watch']
  if (category === 'orologi') return ['orologi', `orologi-${slugify(brand)}`]
  if (category === 'luxury-bags') return ['luxury-bags', `luxury-bags-${slugify(brand)}`]
  if (category === 'gioielli') return ['gioielli', `gioielli-${slugify(brand)}`]
  return [category]
}

function remapCollections(product, category, brand, subcategory) {
  return {
    ...product,
    collections: productCollections(category, brand, subcategory),
  }
}

function brandCollections(products, prefix) {
  const counts = new Map()
  for (const product of products) counts.set(product.brand, (counts.get(product.brand) || 0) + 1)
  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      handle: `${prefix}-${slugify(name)}`,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'it'))
}

function ruzzaSubcategory(product) {
  const haystack = `${product.title || ''} ${product.handle || ''}`.toLowerCase()
  if (haystack.includes('garanzia')) return 'accessori'
  if (haystack.includes('luxury')) return 'luxury'
  return 'basic'
}

function dedupe(products) {
  const seen = new Map()
  for (const product of products) seen.set(String(product.id), product)
  return Array.from(seen.values())
}

function perfumeProducts() {
  const url = 'https://ruzzawatch.com/pages/lorenzo-ruzza-prestigious'
  return PERFUMES.map((item) => ({
    id: `profumi:${item.handle}`,
    shopifyProductId: item.handle,
    source: 'ruzzawatch.com/pages/lorenzo-ruzza-prestigious',
    title: item.title,
    handle: item.handle,
    vendor: 'Lorenzo Ruzza',
    brand: 'Prestigious',
    model: item.variant,
    productType: 'fragrance',
    category: 'profumi',
    subcategory: item.variant.toLowerCase(),
    collections: ['profumi', 'prestigious'],
    tags: ['Prestigious', item.variant, 'Profumi'],
    descriptionHtml: `<p>Elixir Lorenzo Ruzza Prestigious, variante ${item.variant}.</p>`,
    description: `Elixir Lorenzo Ruzza Prestigious, variante ${item.variant}.`,
    price: 0,
    compareAtPrice: null,
    currency: 'EUR',
    onRequest: true,
    available: true,
    inventoryPolicy: '',
    sku: '',
    variants: [],
    options: [],
    images: [{ src: item.image, alt: item.title, position: 1, width: null, height: null }],
    featuredImage: item.image,
    altText: item.title,
    url,
    status: 'published',
    publishedAt: null,
    updatedAt: null,
    metafields: { 'ruzza.source_category': 'profumi' },
  }))
}

/**
 * Costruisce l'oggetto `commerce` dagli array grezzi di Shopify /products.json.
 * @param {{ allRuzzaOrologi?:any[], collectionWatches?:any[], bagRaw?:any[], ruzzaRaw?:any[], bagsStoreRaw?:any[], jewelryRaw?:any[] }} raw
 */
export function buildCommerce(raw = {}) {
  const allRuzzaOrologi = raw.allRuzzaOrologi || []
  const collectionWatches = raw.collectionWatches || []
  const bagsStoreRaw = raw.bagsStoreRaw || []
  const jewelryRaw = raw.jewelryRaw || []
  let bagRaw = raw.bagRaw || []
  const ruzzaRaw = raw.ruzzaRaw || []

  const watchRaw = dedupe([
    ...collectionWatches,
    ...allRuzzaOrologi.filter((product) => {
      const text = `${product.product_type || ''} ${(product.tags || []).join(' ')}`.toLowerCase()
      return text.includes('watch') || text.includes('orologi') || text.includes('orologio')
    }),
  ])

  // Sorgente borse + gioielli: lo store dedicato ruzzabags.com. I gioielli sono quelli
  // della collezione "Gioielli" (autoritativa); le borse sono tutto il resto del catalogo.
  // Fallback: se ruzzabags non risponde, le borse si ricavano (come prima) dallo store orologi.
  const fromRuzzabags = bagsStoreRaw.length > 0
  let jewelrySourceRaw = []
  if (fromRuzzabags) {
    const jewelrySet = new Set(
      (jewelryRaw.length ? jewelryRaw : bagsStoreRaw.filter(isJewelryProduct)).map((product) => String(product.id)),
    )
    jewelrySourceRaw = bagsStoreRaw.filter((product) => jewelrySet.has(String(product.id)))
    bagRaw = bagsStoreRaw.filter((product) => !jewelrySet.has(String(product.id)))
  } else if (!bagRaw.length) {
    bagRaw = allRuzzaOrologi.filter(isLikelyBagProduct)
  }
  const bagsBaseUrl = fromRuzzabags ? 'https://ruzzabags.com' : 'https://ruzzaorologi.com'
  const bagsSource = fromRuzzabags ? 'ruzzabags.com' : 'ruzzaorologi.com'

  const jewelry = jewelrySourceRaw.map((product) => {
    const brand = jewelryType(product)
    return remapCollections(
      mapProduct(product, {
        category: 'gioielli',
        source: 'ruzzabags.com',
        baseUrl: 'https://ruzzabags.com',
        brand,
        collectionHandle: `gioielli-${slugify(brand)}`,
      }),
      'gioielli',
      brand,
      '',
    )
  })

  const watches = watchRaw.map((product) => {
    const brand = detectBrand(product, WATCH_BRANDS)
    return remapCollections(
      mapProduct(product, {
        category: 'orologi',
        source: 'ruzzaorologi.com',
        baseUrl: 'https://ruzzaorologi.com',
        brand,
        collectionHandle: `orologi-${slugify(brand)}`,
      }),
      'orologi',
      brand,
      '',
    )
  })

  const luxuryBags = bagRaw.map((product) => {
    const brand = detectBrand(product, BAG_BRANDS, 'Luxury Bags')
    return remapCollections(
      mapProduct(product, {
        category: 'luxury-bags',
        source: bagsSource,
        baseUrl: bagsBaseUrl,
        brand,
        collectionHandle: `luxury-bags-${slugify(brand)}`,
      }),
      'luxury-bags',
      brand,
      '',
    )
  })

  const ruzzaWatch = ruzzaRaw
    .filter((product) => /ruzza watch|ruzza-watch|garanzia/i.test(`${product.title || ''} ${product.handle || ''}`))
    .map((product) => {
      const subcategory = ruzzaSubcategory(product)
      return remapCollections(
        mapProduct(product, {
          category: 'ruzza-watch',
          source: 'ruzzawatch.com',
          baseUrl: 'https://ruzzawatch.com',
          brand: 'Ruzza Watch',
          collectionHandle: `ruzza-watch-${subcategory}`,
          subcategory,
        }),
        'ruzza-watch',
        'Ruzza Watch',
        subcategory,
      )
    })

  const perfumes = perfumeProducts()

  return {
    generatedAt: new Date().toISOString(),
    sources: {
      orologi: 'ruzza-orologi.myshopify.com (live)',
      luxuryBags: fromRuzzabags ? 'ruzzabags.com (live)' : 'ruzza-orologi.myshopify.com (live)',
      gioielli: fromRuzzabags ? 'ruzzabags.com/collections/gioielli (live)' : '—',
      ruzzaWatch: '6vm01f-ds.myshopify.com (live)',
      profumi: 'ruzzawatch.com/pages/lorenzo-ruzza-prestigious',
    },
    collections: {
      ruzzaWatch: {
        luxury: ruzzaWatch.filter((item) => item.subcategory === 'luxury').map((item) => item.id),
        basic: ruzzaWatch.filter((item) => item.subcategory === 'basic').map((item) => item.id),
        accessori: ruzzaWatch.filter((item) => item.subcategory === 'accessori').map((item) => item.id),
      },
      watchMaison: ['Rolex', 'Patek Philippe', 'Audemars Piguet'],
      watchBrands: brandCollections(watches, 'orologi'),
      bagBrands: brandCollections(luxuryBags, 'luxury-bags'),
      jewelryBrands: brandCollections(jewelry, 'gioielli'),
      perfumeBrands: [{ name: 'Prestigious', count: perfumes.length, handle: 'prestigious' }],
    },
    products: { ruzzaWatch, watches, luxuryBags, jewelry, perfumes },
  }
}
