import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode, type TouchEvent } from 'react'
import {
  availabilityLabel,
  cleanProductTitle,
  formatCommercePrice,
  ruzzaWatchProducts,
  type CommerceProduct,
} from '../data/commerce'
import { WHATSAPP_NUMBER } from '../lib/contact'
import { imageSrcSet, sizedImage } from '../lib/img'
import { appHref, mediaPath, productHref } from '../lib/routing'
import { RUZZA_WATCH_FEED_ORIGIN, canOpenShopifyCart, shopifyCartUrl } from '../lib/shopify'

type WatchFilter = 'luxury' | 'basic'
type WatchAppProduct = CommerceProduct & { sourceProductTitle?: string }

const ruzzaWatchLoginHref = `${RUZZA_WATCH_FEED_ORIGIN}/account/login?utm_source=ruzza_app&utm_medium=ios_app`
const explodedWatchPosterFrame = 70
const explodedWatchFrames = [70, 67, 64, 61, 58, 55, 52, 49, 46, 43, 40, 37, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68, 71, 74, 77, 80, 77, 74]
const explodedFrameSrc = (frame: number) => mediaPath(`/media/hero-picsart-webp/f_${String(frame).padStart(3, '0')}.webp`)

const watchFilters: Array<{ id: WatchFilter; label: string; test: (product: CommerceProduct) => boolean }> = [
  { id: 'luxury', label: 'Luxury', test: (product) => product.subcategory === 'luxury' && !/cofanetto/i.test(product.title) },
  { id: 'basic', label: 'Basic', test: (product) => product.subcategory === 'basic' && !/cofanetto/i.test(product.title) },
]

const nativeSafeImage = { format: 'pjpg' as const }

function whatsappHref(product: CommerceProduct) {
  const text = [
    'Buongiorno, sono interessato a questo Ruzza Watch visto sull’app:',
    cleanProductTitle(product.title),
    `Link: ${window.location.origin}${productHref(product.handle)}`,
    'Vorrei sapere disponibilità e prossimi passaggi.',
  ].join('\n')
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function scoreProduct(product: CommerceProduct) {
  const lineBoost = product.subcategory === 'luxury' ? 8 : 2
  const availabilityBoost = product.available ? 10 : 0
  const imageBoost = product.featuredImage ? 2 : 0
  const cofanettoPenalty = /cofanetto/i.test(product.title) ? -3 : 0
  const priceBoost = product.price > 0 ? Math.min(5, product.price / 500) : 0
  return lineBoost + availabilityBoost + imageBoost + cofanettoPenalty + priceBoost
}

function variantText(variant: Record<string, unknown>, key: string) {
  const value = variant[key]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function variantNumber(variant: Record<string, unknown>, key: string, fallback: number) {
  const value = variant[key]
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function variantAvailable(variant: Record<string, unknown>, fallback: boolean) {
  return typeof variant.available === 'boolean' ? variant.available : fallback
}

function luxuryVariantImage(product: CommerceProduct, variantTitle: string, index: number) {
  const images = product.images || []
  const normalizedTitle = normalize(variantTitle)
  const position =
    normalizedTitle.includes('avventurina') ? 7 :
    normalizedTitle.includes('turchese') ? 11 :
    normalizedTitle.includes('meteorite') ? 10 :
    index + 1

  return images.find((image) => image.position === position) || images[index] || images[0]
}

function expandRuzzaWatchProducts(products: CommerceProduct[]): WatchAppProduct[] {
  return products.flatMap((product) => {
    const realVariants = (product.variants || []).filter((variant) => {
      const title = variantText(variant, 'title')
      return title && title !== 'Default Title'
    })

    if (product.handle !== 'ruzza-watch-luxury-1' || product.subcategory !== 'luxury' || realVariants.length <= 1) {
      return [product]
    }

    return realVariants.map((variant, index) => {
      const variantTitle = variantText(variant, 'title')
      const image = luxuryVariantImage(product, variantTitle, index)
      const price = variantNumber(variant, 'price', product.price)
      const available = variantAvailable(variant, product.available)

      return {
        ...product,
        id: `${product.id}:variant:${variantText(variant, 'id') || index}`,
        title: `${product.title} - ${variantTitle}`,
        sku: variantText(variant, 'sku') || product.sku,
        price,
        available,
        variants: [variant],
        images: image ? [image, ...product.images.filter((item) => item.src !== image.src)] : product.images,
        featuredImage: image?.src || product.featuredImage,
        altText: `${product.title} ${variantTitle}`,
        description: product.description || variantTitle,
        sourceProductTitle: product.title,
      }
    })
  })
}

function purchaseLabel(product: CommerceProduct) {
  if (canOpenShopifyCart(product)) return 'Acquista'
  return 'Acquista'
}

function showcaseProductTitle(product: CommerceProduct) {
  return cleanProductTitle(product.title)
    .replace(/^Ruzza Watch Luxury\s*-\s*/i, '')
    .replace(/^Ruzza Watch\s*/i, '')
}

async function openShopify(event: MouseEvent<HTMLAnchorElement>, url: string) {
  if (!Capacitor.isNativePlatform()) return

  event.preventDefault()
  await Browser.open({
    url,
    presentationStyle: 'fullscreen',
  })
}

export default function MobileWatchSalesApp() {
  const [watchFilter, setWatchFilter] = useState<WatchFilter>('luxury')
  const [showcaseIndex, setShowcaseIndex] = useState(0)
  const [showOpeningIntro, setShowOpeningIntro] = useState(true)
  const [openingIntroLeaving, setOpeningIntroLeaving] = useState(false)

  const appProducts = useMemo(
    () => expandRuzzaWatchProducts(ruzzaWatchProducts).filter((product) => product.subcategory !== 'accessori' && !/cofanetto/i.test(product.title)),
    [ruzzaWatchProducts],
  )

  const filteredProducts = useMemo(() => {
    const activeFilter = watchFilters.find((item) => item.id === watchFilter) || watchFilters[0]

    return appProducts
      .filter((product) => activeFilter.test(product))
      .sort((a, b) => scoreProduct(b) - scoreProduct(a))
  }, [appProducts, watchFilter])

  const heroProduct = filteredProducts[0] || appProducts[0]
  const showcaseProducts = filteredProducts
  const activeShowcaseProduct = showcaseProducts[showcaseIndex] || heroProduct
  const activeShowcaseHref = activeShowcaseProduct ? shopifyCartUrl(activeShowcaseProduct) : ''

  useEffect(() => {
    setShowcaseIndex((index) => Math.min(index, Math.max(showcaseProducts.length - 1, 0)))
  }, [showcaseProducts.length])

  function previousShowcaseProduct() {
    if (!showcaseProducts.length) return
    setShowcaseIndex((index) => (index - 1 + showcaseProducts.length) % showcaseProducts.length)
  }

  function nextShowcaseProduct() {
    if (!showcaseProducts.length) return
    setShowcaseIndex((index) => (index + 1) % showcaseProducts.length)
  }

  function selectWatchFilter(filter: WatchFilter) {
    setWatchFilter(filter)
    setShowcaseIndex(0)
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    window.scrollTo({ top: 0, left: 0 })
    document.body.style.overflow = 'hidden'

    const leaveTimer = window.setTimeout(() => setOpeningIntroLeaving(true), 2500)
    const hideTimer = window.setTimeout(() => {
      setShowOpeningIntro(false)
      document.body.style.overflow = previousOverflow
    }, 3150)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(hideTimer)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#050605] text-bone">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,rgba(47,176,137,0.18),transparent_34%),linear-gradient(180deg,#050605_0%,#0b0e0d_48%,#050605_100%)]" />
      {showOpeningIntro ? <ExplodedWatchIntro isLeaving={openingIntroLeaving} /> : null}

      <section className="relative mx-auto h-[100svh] w-full max-w-[520px] overflow-hidden bg-ink shadow-2xl shadow-black/60 sm:border-x sm:border-white/10">
        <ShowcaseScreen
          product={activeShowcaseProduct}
          products={showcaseProducts}
          watchFilter={watchFilter}
          productIndex={showcaseIndex}
          productCount={showcaseProducts.length}
          shopifyHref={activeShowcaseHref}
          onPrevious={previousShowcaseProduct}
          onNext={nextShowcaseProduct}
          onSelect={setShowcaseIndex}
          onFilterChange={selectWatchFilter}
        />
      </section>
    </main>
  )
}

function ShowcaseScreen({
  product,
  products,
  watchFilter,
  productIndex,
  productCount,
  shopifyHref,
  onPrevious,
  onNext,
  onSelect,
  onFilterChange,
}: {
  product?: CommerceProduct
  products: WatchAppProduct[]
  watchFilter: WatchFilter
  productIndex: number
  productCount: number
  shopifyHref: string
  onPrevious: () => void
  onNext: () => void
  onSelect: (index: number) => void
  onFilterChange: (filter: WatchFilter) => void
}) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  if (!product) {
    return (
      <section className="grid h-full place-items-center px-6 text-center" data-testid="watch-app-showcase">
        <p className="font-display text-3xl text-bone">Nessun modello trovato</p>
      </section>
    )
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return

    const end = event.changedTouches[0]?.clientX ?? start
    const delta = end - start
    if (Math.abs(delta) < 48) return
    if (delta < 0) onNext()
    else onPrevious()
  }

  function selectProduct(index: number) {
    onSelect(index)
    setSelectorOpen(false)
  }

  return (
    <section
      className="relative h-full overflow-hidden touch-pan-y"
      aria-label="Vetrina Ruzza Watch"
      data-testid="watch-app-showcase"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 bg-ink-900">
        {product.featuredImage ? (
          <img
            key={product.id}
            src={sizedImage(product.featuredImage, 1200, nativeSafeImage)}
            srcSet={imageSrcSet(product.featuredImage, [740, 900, 1200, 1500], nativeSafeImage)}
            sizes="100vw"
            alt={product.altText || cleanProductTitle(product.title)}
            className="product-photo-reveal h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/62 via-ink/4 to-ink/92" />
      <div className="absolute inset-0 bg-[radial-gradient(85%_58%_at_50%_42%,transparent_34%,rgba(5,6,5,0.54)_100%)]" />

      <AppFloatingChrome />

      <WatchLineSwitcher
        watchFilter={watchFilter}
        setWatchFilter={onFilterChange}
        className="absolute inset-x-4 top-[max(5rem,calc(env(safe-area-inset-top)+4.2rem))] z-30"
      />

      <div className="absolute inset-x-0 top-[max(8rem,calc(env(safe-area-inset-top)+7.1rem))] z-20 flex items-center justify-between px-4">
        <p className="data border border-white/10 bg-ink/45 px-3 py-2 text-[0.58rem] uppercase tracking-[0.14em] text-bone-muted shadow-lg shadow-black/20 backdrop-blur-xl">
          {String(productIndex + 1).padStart(2, '0')} / {String(Math.max(productCount, 1)).padStart(2, '0')}
        </p>
        <p className="data border border-malachite-bright/30 bg-malachite-deep/55 px-3 py-2 text-[0.58rem] uppercase tracking-[0.14em] text-malachite-bright shadow-lg shadow-black/20 backdrop-blur-xl">
          {availabilityLabel(product)}
        </p>
      </div>

      <div className="absolute inset-y-[9rem] left-0 z-10 flex items-center px-2">
        <button type="button" onClick={onPrevious} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-ink/18 text-bone/72 shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-ink/42" aria-label="Modello precedente">
          <Icon className="h-5 w-5"><path d="m15 18-6-6 6-6" /></Icon>
        </button>
      </div>
      <div className="absolute inset-y-[9rem] right-0 z-10 flex items-center px-2">
        <button type="button" onClick={onNext} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-ink/18 text-bone/72 shadow-lg shadow-black/20 backdrop-blur-md transition hover:bg-ink/42" aria-label="Modello successivo">
          <Icon className="h-5 w-5"><path d="m9 18 6-6-6-6" /></Icon>
        </button>
      </div>

      <div className="absolute inset-x-3 bottom-3 z-20 border border-white/12 bg-ink/56 p-3 shadow-2xl shadow-black/45 backdrop-blur-2xl">
        <div className="mx-auto mb-3 h-1 w-9 bg-white/24" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label text-malachite-bright">Vetrina Ruzza Watch</p>
            <h1 className="mt-2 line-clamp-2 max-w-[20rem] font-display text-[clamp(2.2rem,9vw,3.25rem)] leading-[0.86] text-bone drop-shadow-lg">
              {showcaseProductTitle(product)}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setSelectorOpen(true)}
            className="shrink-0 border border-white/12 bg-white/[0.04] px-3 py-2 data text-[0.54rem] uppercase tracking-[0.13em] text-bone-muted backdrop-blur-md"
            data-testid="watch-app-model-trigger"
          >
            Modelli
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="border border-champagne/40 bg-ink/58 px-3 py-2 data text-base text-champagne backdrop-blur-md">
              {formatCommercePrice(product)}
            </span>
            <span className="border border-white/10 bg-ink/48 px-3 py-2 data text-[0.62rem] uppercase text-bone-muted backdrop-blur-md">
              {product.subcategory === 'luxury' ? 'Luxury' : product.subcategory === 'basic' ? 'Basic' : 'Ruzza Watch'}
            </span>
          </div>
          <div className="flex shrink-0 gap-1.5" aria-hidden>
            {Array.from({ length: Math.min(productCount, 8) }).map((_, index) => (
              <span key={index} className={`h-1.5 rounded-full transition-all ${index === productIndex % 8 ? 'w-6 bg-malachite-bright' : 'w-1.5 bg-white/28'}`} />
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <a
            href={shopifyHref}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => openShopify(event, shopifyHref)}
            className="btn-solid justify-center text-center"
          >
            {purchaseLabel(product)}
          </a>
          <a href={whatsappHref(product)} target="_blank" rel="noreferrer" className="btn-line justify-center px-4">
            WhatsApp
          </a>
        </div>
      </div>

      {selectorOpen ? (
        <div className="absolute inset-0 z-40 bg-ink/68 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Scegli modello Ruzza Watch">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Chiudi modelli" onClick={() => setSelectorOpen(false)} />
          <div className="absolute inset-x-3 bottom-3 border border-white/12 bg-ink/84 p-3 shadow-2xl shadow-black/55 backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="label text-malachite-bright">Scegli modello</p>
                <p className="mt-1 data text-[0.58rem] uppercase tracking-[0.13em] text-bone-faint">
                  {productCount} pezzi nella linea {watchFilter === 'luxury' ? 'Luxury' : 'Basic'}
                </p>
              </div>
              <button type="button" onClick={() => setSelectorOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-bone-muted" aria-label="Chiudi modelli">
                <Icon><path d="M6 6l12 12M18 6 6 18" /></Icon>
              </button>
            </div>

            <div className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="watch-app-showcase-deck" aria-label="Modelli Ruzza Watch in vetrina">
              <div className="flex gap-2">
                {products.slice(0, 12).map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectProduct(index)}
                    aria-pressed={index === productIndex}
                    className={`w-[6rem] shrink-0 border bg-ink/66 p-1 text-left shadow-lg shadow-black/20 backdrop-blur-md transition ${
                      index === productIndex ? 'border-malachite-bright/60 text-bone' : 'border-white/12 text-bone-muted'
                    }`}
                  >
                    <span className="block aspect-[4/5] overflow-hidden bg-ink-800">
                      {item.featuredImage ? (
                        <img
                          src={sizedImage(item.featuredImage, 220, nativeSafeImage)}
                          srcSet={imageSrcSet(item.featuredImage, [160, 220, 320], nativeSafeImage)}
                          sizes="6rem"
                          alt={item.altText || cleanProductTitle(item.title)}
                          className="h-full w-full object-cover"
                          loading={index < 5 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate font-display text-sm leading-none">{showcaseProductTitle(item)}</span>
                    <span className="mt-1 block truncate data text-[0.48rem] text-champagne">{formatCommercePrice(item)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function AppFloatingChrome() {
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(0.9rem,env(safe-area-inset-top))]">
      <a href={appHref('/app-orologi')} className="flex items-center gap-2 border border-white/12 bg-ink/26 px-2.5 py-2 shadow-lg shadow-black/20 backdrop-blur-2xl" aria-label="Torna a Ruzza Watch App">
        <span className="grid h-9 w-9 place-items-center border border-champagne/45 font-display text-lg text-champagne">R</span>
        <span>
          <span className="block font-display text-lg leading-none text-bone">Ruzza Watch</span>
          <span className="data text-[0.48rem] uppercase tracking-[0.16em] text-bone-faint">Official App</span>
        </span>
      </a>
      <div className="flex items-center gap-2">
        <a
          href={ruzzaWatchLoginHref}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => openShopify(event, ruzzaWatchLoginHref)}
          className="grid h-10 w-10 place-items-center rounded-full border border-champagne/35 bg-ink/30 text-champagne shadow-lg shadow-black/20 backdrop-blur-2xl"
          aria-label="Accedi"
        >
          <Icon>
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6" />
          </Icon>
        </a>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Buongiorno, vorrei informazioni su un Ruzza Watch visto sull’app.')}`}
          className="grid h-10 w-10 place-items-center rounded-full border border-malachite-bright/35 bg-malachite-deep/40 text-malachite-bright shadow-lg shadow-black/20 backdrop-blur-2xl"
          aria-label="Apri WhatsApp"
        >
          <Icon>
            <path d="M20 11.5a7.7 7.7 0 0 1-11.4 6.8L4 20l1.7-4.4A7.7 7.7 0 1 1 20 11.5Z" />
            <path d="M9 8.8c.3 2 2.1 4 4.2 4.9l1.2-1.1 1.6.5c.2.1.3.3.3.5-.1.8-.7 1.5-1.5 1.7-2.8.2-7.2-3.1-7.6-6.2.1-.8.7-1.5 1.4-1.8.2-.1.4 0 .5.2L9 8.8Z" />
          </Icon>
        </a>
      </div>
    </div>
  )
}

function WatchLineSwitcher({
  watchFilter,
  setWatchFilter,
  className = '',
}: {
  watchFilter: WatchFilter
  setWatchFilter: (filter: WatchFilter) => void
  className?: string
}) {
  return (
    <div className={`grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-ink/26 p-1 shadow-lg shadow-black/20 backdrop-blur-2xl ${className}`} aria-label="Categorie Ruzza Watch" data-testid="watch-app-category-switcher">
      {watchFilters.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setWatchFilter(item.id)}
          aria-pressed={watchFilter === item.id}
          className={`h-9 rounded-full data text-[0.58rem] uppercase tracking-[0.14em] transition ${
            watchFilter === item.id ? 'bg-malachite-deep/78 text-malachite-bright shadow-lg shadow-black/20' : 'text-bone-muted'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function drawCoverFrame(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, image: HTMLImageElement) {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const width = Math.max(1, Math.round(rect.width * dpr))
  const height = Math.max(1, Math.round(rect.height * dpr))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const canvasRatio = canvas.width / canvas.height
  const imageRatio = image.naturalWidth / image.naturalHeight
  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight

  if (imageRatio > canvasRatio) {
    sourceWidth = image.naturalHeight * canvasRatio
    sourceX = (image.naturalWidth - sourceWidth) / 2
  } else {
    sourceHeight = image.naturalWidth / canvasRatio
    sourceY = (image.naturalHeight - sourceHeight) / 2
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
}

function ExplodedWatchIntro({ isLeaving }: { isLeaving: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let raf = 0
    let frameIndex = 0
    let lastTick = 0
    const images = new Map<number, HTMLImageElement>()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const getImage = (frame: number) => {
      const cached = images.get(frame)
      if (cached) return cached

      const image = new Image()
      image.decoding = 'async'
      image.src = explodedFrameSrc(frame)
      image.onload = () => {
        if (frame === explodedWatchPosterFrame) drawCoverFrame(canvas, context, image)
      }
      images.set(frame, image)
      return image
    }

    const poster = getImage(explodedWatchPosterFrame)
    if (poster.complete && poster.naturalWidth) drawCoverFrame(canvas, context, poster)
    explodedWatchFrames.forEach(getImage)

    const tick = (time: number) => {
      if (time - lastTick > 120) {
        const frame = explodedWatchFrames[frameIndex]
        const image = getImage(frame)
        if (image.complete && image.naturalWidth) {
          drawCoverFrame(canvas, context, image)
          frameIndex = (frameIndex + 1) % explodedWatchFrames.length
          lastTick = time
        }
      }

      raf = window.requestAnimationFrame(tick)
    }

    const handleResize = () => {
      const current = getImage(explodedWatchFrames[frameIndex] || explodedWatchPosterFrame)
      if (current.complete && current.naturalWidth) drawCoverFrame(canvas, context, current)
    }

    window.addEventListener('resize', handleResize)
    if (!reducedMotion) raf = window.requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      className={`fixed inset-0 z-[100] overflow-hidden bg-ink-900 transition duration-700 ease-out ${
        isLeaving ? 'pointer-events-none scale-[1.03] opacity-0' : 'opacity-100'
      }`}
      aria-label="Orologio scomposto Ruzza Watch"
      data-testid="exploded-watch-intro"
    >
      <div className="relative h-full">
        <img
          src={explodedFrameSrc(explodedWatchPosterFrame)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/10 via-transparent to-ink/65" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_44%,transparent_35%,rgba(5,6,5,0.58)_100%)]" />
        <div className="absolute inset-x-0 top-[max(1.5rem,env(safe-area-inset-top))] flex justify-center px-6">
          <div className="flex items-center gap-3 border border-champagne/35 bg-ink/55 px-4 py-3 shadow-2xl shadow-black/35 backdrop-blur-md">
            <span className="grid h-10 w-10 place-items-center border border-champagne/45 font-display text-xl text-champagne">R</span>
            <span>
              <span className="block font-display text-xl leading-none text-bone">Ruzza Watch</span>
              <span className="data text-[0.55rem] uppercase tracking-[0.16em] text-bone-faint">Official App</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}


function Icon({ children, className = 'h-5 w-5' }: { children: ReactNode; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {children}
    </svg>
  )
}
