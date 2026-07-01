import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { cleanProductTitle, formatCommercePrice, watchProducts, type CommerceProduct } from '../data/commerce'
import { sizedImage, imageSrcSet } from '../lib/img'
import { productHref } from '../lib/routing'

/**
 * Vetrina ORIZZONTALE: scrollando in verticale la riga di orologi trasla di lato
 * (effetto "scroll orizzontale guidato dallo scroll verticale"). Un pezzo di
 * punta per maison (il più prezioso di ogni marchio), ordinati per prezzo.
 */
function buildReel(products: CommerceProduct[]): CommerceProduct[] {
  const byBrand = new Map<string, CommerceProduct>()
  for (const w of products) {
    if (!w.featuredImage || w.price <= 0) continue
    const cur = byBrand.get(w.brand)
    if (!cur || w.price > cur.price) byBrand.set(w.brand, w)
  }
  return Array.from(byBrand.values())
    .sort((a, b) => b.price - a.price)
    .slice(0, 16)
}

function ReelCard({ w }: { w: CommerceProduct }) {
  return (
    <a
      href={productHref(w.handle)}
      className="group block w-[clamp(244px,30vw,392px)] shrink-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
        <img
          src={sizedImage(w.featuredImage, 600)}
          srcSet={imageSrcSet(w.featuredImage, [300, 500, 700, 900])}
          sizes="(max-width: 768px) 60vw, 392px"
          alt={w.altText || cleanProductTitle(w.title)}
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-expo group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <p className="data mt-4 text-[0.64rem] uppercase tracking-[0.24em] text-bone-faint">{w.brand}</p>
      <h3 className="font-display text-lg text-bone md:text-xl">{cleanProductTitle(w.title)}</h3>
      <p className="data mt-1 text-champagne">{formatCommercePrice(w)}</p>
    </a>
  )
}

function Heading() {
  return (
    <div className="mx-auto mb-9 w-full max-w-editorial px-6 md:mb-12 md:px-10">
      <p className="label text-malachite-bright">Il caveau</p>
      <h2 className="chrome display mt-3 text-[clamp(2.1rem,7vw,5rem)]">Pezzi da collezione</h2>
    </div>
  )
}

export default function CatalogScroll() {
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)
  const [vh, setVh] = useState(0)
  const reel = useMemo(() => buildReel(watchProducts), [watchProducts])
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])

  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current
      if (!row) return
      setVh(window.innerHeight)
      setDistance(Math.max(0, row.scrollWidth - window.innerWidth + 48))
    }
    measure()
    window.addEventListener('resize', measure)
    const imgs = rowRef.current ? Array.from(rowRef.current.querySelectorAll('img')) : []
    imgs.forEach((im) => im.addEventListener('load', measure))
    return () => {
      window.removeEventListener('resize', measure)
      imgs.forEach((im) => im.removeEventListener('load', measure))
    }
  }, [reel])

  if (!reel.length) return null

  // Riduzione movimento: niente scroll-hijack, una riga sfogliabile a mano.
  if (reduced) {
    return (
      <section id="caveau" className="relative bg-ink py-20 md:py-28">
        <Heading />
        <div className="flex gap-6 overflow-x-auto px-6 pb-4 md:gap-8 md:px-10">
          {reel.map((w) => (
            <ReelCard key={w.id} w={w} />
          ))}
        </div>
      </section>
    )
  }

  // Altezza = corsa orizzontale × 0.6 + 1 schermo: lo scroll verticale muove la
  // riga ~1.6× più veloce → la vetrina si sfoglia in ~4-5 schermate.
  const sectionHeight = distance ? `${Math.round(distance * 0.6) + vh}px` : '100svh'

  return (
    <section ref={sectionRef} id="caveau" className="relative bg-ink" style={{ height: sectionHeight }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <Heading />

        <motion.div
          ref={rowRef}
          className="flex gap-6 px-6 will-change-transform md:gap-8 md:px-10"
          style={{ x }}
        >
          {reel.map((w) => (
            <ReelCard key={w.id} w={w} />
          ))}
        </motion.div>

        <div className="mx-auto mt-9 flex w-full max-w-editorial items-center gap-3 px-6 md:mt-12 md:px-10">
          <span className="data text-[0.62rem] uppercase tracking-[0.24em] text-bone-faint">
            Scorri per sfogliare
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
      </div>
    </section>
  )
}
