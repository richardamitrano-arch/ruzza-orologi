import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { whatsappContactHref } from '../lib/contact'
import { canBuyDirect, storeBuyUrl } from '../lib/shopify'
import { appHref, productHref } from '../lib/routing'
import { imageSrcSet, sizedImage } from '../lib/img'
import ProductWebGLLightbox from './ProductWebGLLightbox'
import {
  allCommerceProducts,
  availabilityLabel,
  cleanProductTitle,
  formatCommercePrice,
  productByHandle,
  shortDescription,
  type CommerceProduct,
} from '../data/commerce'

const CATEGORY_COPY: Record<CommerceProduct['category'], { label: string; href: string; back: string }> = {
  orologi: { label: 'Orologi', href: '/orologi', back: 'Torna agli orologi' },
  'luxury-bags': { label: 'Luxury Bags', href: '/borse', back: 'Torna alle borse' },
  gioielli: { label: 'Gioielli', href: '/gioielli', back: 'Torna ai gioielli' },
  'ruzza-watch': { label: 'Ruzza Watch', href: '/#ruzza-watch-video', back: 'Torna a Ruzza Watch' },
  profumi: { label: 'Profumi', href: '/#prestigious-video', back: 'Torna ai profumi' },
}

function productContactHref(product: CommerceProduct) {
  const text = `Buongiorno, vorrei informazioni su ${cleanProductTitle(product.title)}`
  return whatsappContactHref(product.category, text)
}

function detailLines(product: CommerceProduct) {
  const text = shortDescription(product, 520)
  return text
    .split(/(?:\. |\n| Ref:| Materiale:| Anno | Condizione:)/)
    .map((item) => item.trim().replace(/^[:.,\s]+/, ''))
    .filter((item) => item.length > 3)
    .slice(0, 7)
}

function relatedProducts(product: CommerceProduct) {
  return allCommerceProducts
    .filter((item) => item.id !== product.id && item.category === product.category && item.brand === product.brand)
    .slice(0, 4)
}

function productGallery(product: CommerceProduct | undefined) {
  if (!product) return []
  const rawImages = product.images?.length
    ? product.images
    : product.featuredImage
      ? [{ src: product.featuredImage, alt: product.altText || product.title, position: 1 }]
      : []
  const seen = new Set<string>()
  return rawImages
    .filter((image) => image.src && !seen.has(image.src) && seen.add(image.src))
    .sort((a, b) => (a.position || 999) - (b.position || 999))
}

type ProductDetailPageProps = {
  handle: string
}

export default function ProductDetailPage({ handle }: ProductDetailPageProps) {
  const product = productByHandle(handle)
  const galleryImages = useMemo(() => productGallery(product), [product])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const galleryPointerRef = useRef<{ x: number; y: number } | null>(null)
  const suppressOpenRef = useRef(false)
  const imageCount = galleryImages.length
  const selectedImage = galleryImages[Math.min(selectedImageIndex, Math.max(galleryImages.length - 1, 0))]

  useEffect(() => {
    setSelectedImageIndex(0)
    setLightboxOpen(false)
  }, [handle])

  function selectImage(index: number) {
    if (!imageCount) return
    setSelectedImageIndex((index + imageCount) % imageCount)
  }

  function openLightbox() {
    if (suppressOpenRef.current) {
      suppressOpenRef.current = false
      return
    }
    setLightboxOpen(true)
  }

  function onMainPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    galleryPointerRef.current = { x: event.clientX, y: event.clientY }
    suppressOpenRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onMainPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = galleryPointerRef.current
    if (!start || imageCount < 2) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 18 || Math.abs(dx) < Math.abs(dy) * 1.15) return

    event.preventDefault()
    suppressOpenRef.current = true
  }

  function onMainPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = galleryPointerRef.current
    galleryPointerRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* pointer capture can already be released by the browser */
    }
    if (!start || imageCount < 2) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.2) return

    event.preventDefault()
    suppressOpenRef.current = true
    selectImage(selectedImageIndex + (dx < 0 ? 1 : -1))
    window.setTimeout(() => {
      suppressOpenRef.current = false
    }, 140)
  }

  useEffect(() => {
    if (!lightboxOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowLeft') selectImage(selectedImageIndex - 1)
      if (event.key === 'ArrowRight') selectImage(selectedImageIndex + 1)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [galleryImages.length, lightboxOpen, selectedImageIndex])

  if (!product) {
    return (
      <main>
        <section className="relative min-h-[80svh] bg-ink-900 px-6 pb-[14vh] pt-[22vh] md:px-10">
          <div className="mx-auto max-w-editorial">
            <p className="label text-malachite-bright">Scheda prodotto</p>
            <h1 className="chrome display mt-4 text-[clamp(2.8rem,8vw,6rem)]">Non trovato</h1>
            <p className="mt-5 max-w-xl font-sans text-base font-light leading-relaxed text-bone-muted">
              Questo prodotto non e disponibile nel catalogo caricato nella landing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={appHref('/orologi')} className="btn-solid">
                Orologi
              </a>
              <a href={appHref('/borse')} className="btn-line">
                Luxury Bags
              </a>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const category = CATEGORY_COPY[product.category]
  const title = cleanProductTitle(product.title)
  const details = detailLines(product)
  const related = relatedProducts(product)

  return (
    <main data-product-detail={product.handle}>
      <section className="marble-section marble-section-dark relative overflow-hidden bg-ink-900 pb-[12vh] pt-[14vh]">
        <div className="mx-auto grid max-w-editorial gap-10 px-6 md:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.75fr)] lg:gap-14">
          <div className="min-w-0">
            <a href={appHref(category.href)} className="data text-[0.62rem] uppercase tracking-[0.18em] text-bone-faint transition-colors hover:text-bone">
              {category.back}
            </a>
            <div className="mt-6" data-product-gallery-count={galleryImages.length}>
              <div className="group relative w-full overflow-hidden bg-ink-800">
                <button
                  type="button"
                  className="block w-full cursor-grab touch-pan-y text-left active:cursor-grabbing"
                  onClick={openLightbox}
                  onPointerDown={onMainPointerDown}
                  onPointerMove={onMainPointerMove}
                  onPointerUp={onMainPointerUp}
                  onPointerCancel={() => {
                    galleryPointerRef.current = null
                  }}
                  aria-label="Apri galleria prodotto"
                  data-product-lightbox-open
                  data-product-main-drag
                >
                  {selectedImage ? (
                    <img
                      key={selectedImage.src}
                      src={sizedImage(selectedImage.src, 1200)}
                      srcSet={imageSrcSet(selectedImage.src, [600, 900, 1200, 1600])}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      alt={selectedImage.alt || product.altText || title}
                      className="product-photo-reveal aspect-[4/5] w-full object-cover transition duration-700 ease-expo group-hover:scale-[1.018]"
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      data-product-main-image
                    />
                  ) : (
                    <div className="aspect-[4/5] bg-[radial-gradient(circle_at_50%_40%,rgba(47,176,137,0.2),transparent_55%)]" />
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent opacity-80" />

                  {imageCount > 1 && (
                    <div className="pointer-events-none absolute bottom-4 left-4 border border-white/15 bg-ink/75 px-3 py-1.5 backdrop-blur-md">
                      <p className="data text-[0.62rem] uppercase tracking-[0.16em] text-bone">
                        {String(selectedImageIndex + 1).padStart(2, '0')} / {String(imageCount).padStart(2, '0')}
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-4" aria-label="Galleria prodotto">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <p className="data text-[0.62rem] uppercase tracking-[0.16em] text-bone-faint">
                      Galleria
                    </p>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]" data-product-filmstrip>
                    {galleryImages.map((image, index) => {
                      const selected = index === selectedImageIndex
                      return (
                        <button
                          key={image.src}
                          type="button"
                          className={`relative h-24 w-20 shrink-0 snap-start overflow-hidden border bg-ink-800 transition-colors md:h-28 md:w-24 ${
                            selected ? 'border-champagne' : 'border-white/10 hover:border-bone-muted'
                          }`}
                          onClick={() => selectImage(index)}
                          aria-label={`Mostra immagine ${index + 1} di ${galleryImages.length}`}
                          aria-pressed={selected}
                          data-product-thumb={index + 1}
                        >
                          <img
                            src={sizedImage(image.src, 220)}
                            srcSet={imageSrcSet(image.src, [160, 220, 320])}
                            sizes="96px"
                            alt=""
                            className={`h-full w-full object-cover transition duration-500 ${selected ? 'opacity-100' : 'opacity-65 hover:opacity-100'}`}
                            loading={index < 5 ? 'eager' : 'lazy'}
                            decoding="async"
                          />
                          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-1 font-sans text-[0.58rem] text-bone-muted">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <p className="label text-malachite-bright">{product.brand} · {category.label}</p>
            <h1
              className="mt-4 font-display text-[clamp(2.2rem,5vw,4.7rem)] leading-[0.98] text-bone"
              data-product-title
            >
              {title}
            </h1>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <p className="data rounded-full border border-champagne/35 px-4 py-2 text-lg text-champagne">
                {formatCommercePrice(product)}
              </p>
              <p className="data rounded-full border border-white/10 px-4 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-bone-muted">
                {availabilityLabel(product)}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {canBuyDirect(product) ? (
                <>
                  <a
                    href={storeBuyUrl(product)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-solid justify-center"
                    data-product-buy
                  >
                    Acquista ora
                  </a>
                  <a
                    href={productContactHref(product)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-line justify-center"
                    data-product-whatsapp
                  >
                    Contattaci su WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <a
                    href={productContactHref(product)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-solid justify-center"
                    data-product-whatsapp
                  >
                    Contattaci su WhatsApp
                  </a>
                  <a href={appHref(category.href)} className="btn-line justify-center">
                    Continua a sfogliare
                  </a>
                </>
              )}
            </div>

            <p className="mt-8 font-sans text-base font-light leading-relaxed text-bone-muted">
              {shortDescription(product, 320)}
            </p>

            {details.length > 0 && (
              <dl className="mt-8 grid gap-3 border-y border-white/10 py-6">
                {details.map((line, index) => (
                  <div key={`${line}-${index}`} className="grid gap-1 sm:grid-cols-[92px_1fr]">
                    <dt className="data text-[0.58rem] uppercase tracking-[0.16em] text-bone-faint">
                      Dettaglio
                    </dt>
                    <dd className="font-sans text-sm font-light leading-relaxed text-bone-muted">
                      {line}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-ink pb-[6vh]">
          <div className="mx-auto max-w-[58rem] px-6 md:px-10">
            <div className="mb-4 flex items-end justify-between gap-6 border-t border-white/10 pt-6">
              <div>
                <p className="label text-malachite-bright">Ancora {product.brand}</p>
                <h2 className="mt-1.5 font-display text-[clamp(1.25rem,2.2vw,1.8rem)] leading-tight text-bone">
                  Selezione affine
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4">
              {related.map((item) => (
                <a key={item.id} href={productHref(item.handle)} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
                    {item.featuredImage ? (
                      <img
                        src={sizedImage(item.featuredImage, 320)}
                        srcSet={imageSrcSet(item.featuredImage, [220, 320, 480])}
                        sizes="(max-width: 768px) 45vw, 13rem"
                        alt={item.altText || cleanProductTitle(item.title)}
                        className="h-full w-full object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.035]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                  </div>
                  <p className="label mt-2 text-[0.58rem] text-malachite-bright">{item.brand}</p>
                  <p className="mt-1 line-clamp-2 font-display text-sm leading-snug text-bone">
                    {cleanProductTitle(item.title)}
                  </p>
                  <p className="data mt-1 text-[0.6rem] text-champagne">{formatCommercePrice(item)}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {lightboxOpen && (
        <ProductWebGLLightbox
          images={galleryImages}
          selectedIndex={selectedImageIndex}
          title={title}
          eyebrow={`${product.brand} · ${category.label}`}
          onClose={() => setLightboxOpen(false)}
          onSelect={selectImage}
        />
      )}
    </main>
  )
}
