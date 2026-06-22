import { useEffect, useMemo, useState } from 'react'
import { bagBrands, luxuryBagProducts, productStats, productsByBrand } from '../data/commerce'
import ProductCard from './ProductCard'
import { Reveal } from './Reveal'
import { appHref } from '../lib/routing'

type LuxuryBagsProps = {
  mode?: 'preview' | 'full'
  initialBrand?: string
}

const HOME_PREVIEW_COUNT = 8

export default function LuxuryBags({ mode = 'preview', initialBrand = 'Tutti' }: LuxuryBagsProps) {
  const safeInitialBrand =
    initialBrand === 'Tutti' || bagBrands.some((item) => item.name === initialBrand) ? initialBrand : 'Tutti'
  const [brand, setBrand] = useState(safeInitialBrand)

  useEffect(() => {
    const onBrand = (event: Event) => {
      const requested = (event as CustomEvent<string>).detail
      if (requested === 'Tutti' || bagBrands.some((item) => item.name === requested)) {
        setBrand(requested)
      }
    }
    window.addEventListener('ruzza:set-bag-brand', onBrand)
    return () => window.removeEventListener('ruzza:set-bag-brand', onBrand)
  }, [])

  const products = useMemo(
    () => (brand === 'Tutti' ? luxuryBagProducts : productsByBrand(luxuryBagProducts, brand)),
    [brand],
  )
  const visibleProducts = mode === 'full' ? products : products.slice(0, HOME_PREVIEW_COUNT)
  const stats = productStats(products)
  const catalogHref = brand === 'Tutti' ? '/borse' : `/borse?brand=${encodeURIComponent(brand)}`

  return (
    <section id="borse" className={`marble-section marble-section-dark relative overflow-hidden bg-ink ${mode === 'full' ? 'pb-[14vh] pt-[18vh]' : 'py-[14vh]'}`}>
      <div className="pointer-events-none absolute right-[-15vw] top-20 h-[55vh] w-[55vh] rounded-full bg-champagne/10 blur-[120px]" />
      <div className="mx-auto max-w-editorial px-6 md:px-10">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <Reveal delay={0.06}>
              <h2 className="chrome display text-[clamp(2.5rem,8vw,6.5rem)]">Borse</h2>
            </Reveal>
          </div>
          <p className="data text-[0.68rem] uppercase tracking-[0.16em] text-bone-faint lg:text-right">
            {mode === 'preview' ? `${visibleProducts.length} selezionate · ` : ''}
            {stats.total} borse · {stats.brands} Maison · {stats.available} disponibili
          </p>
        </div>

        <div className="mb-10 flex gap-3 overflow-x-auto pb-3">
          <button
            type="button"
            onClick={() => setBrand('Tutti')}
            aria-pressed={brand === 'Tutti'}
            className={`shrink-0 border px-5 py-3 font-sans text-[0.68rem] uppercase tracking-wide ${
              brand === 'Tutti' ? 'border-champagne bg-champagne/15 text-bone' : 'border-white/10 text-bone-muted'
            }`}
          >
            Tutte
          </button>
          {bagBrands.map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => setBrand(b.name)}
              aria-pressed={brand === b.name}
              className={`shrink-0 border px-5 py-3 font-sans text-[0.68rem] uppercase tracking-wide transition-colors ${
                brand === b.name ? 'border-champagne bg-champagne/15 text-bone' : 'border-white/10 text-bone-muted hover:text-bone'
              }`}
            >
              {b.name} · {b.count}
            </button>
          ))}
        </div>

        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} dense priority={index < 4} />
          ))}
        </div>

        {mode === 'preview' && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-white/10 pt-10 sm:flex-row">
            <a href={appHref(catalogHref)} className="btn-solid">
              Sfoglia tutte le borse
            </a>
            <p className="data text-[0.62rem] uppercase tracking-[0.16em] text-bone-faint">
              {stats.total} pezzi selezionati
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
