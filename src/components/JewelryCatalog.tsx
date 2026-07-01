import { useEffect, useMemo, useState } from 'react'
import { jewelryBrands, jewelryProducts, productStats, productsByBrand } from '../data/commerce'
import ProductCard from './ProductCard'
import { Reveal } from './Reveal'
import { appHref } from '../lib/routing'

type JewelryCatalogProps = {
  mode?: 'preview' | 'full'
  initialBrand?: string
}

const HOME_PREVIEW_COUNT = 8

export default function JewelryCatalog({ mode = 'preview', initialBrand = 'Tutti' }: JewelryCatalogProps) {
  const safeInitialBrand =
    initialBrand === 'Tutti' || jewelryBrands.some((item) => item.name === initialBrand) ? initialBrand : 'Tutti'
  const [brand, setBrand] = useState(safeInitialBrand)

  useEffect(() => {
    setBrand(safeInitialBrand)
  }, [safeInitialBrand])

  useEffect(() => {
    const onBrand = (event: Event) => {
      const requested = (event as CustomEvent<string>).detail
      if (requested === 'Tutti' || jewelryBrands.some((item) => item.name === requested)) {
        setBrand(requested)
      }
    }
    window.addEventListener('ruzza:set-jewelry-brand', onBrand)
    return () => window.removeEventListener('ruzza:set-jewelry-brand', onBrand)
  }, [jewelryBrands])

  const products = useMemo(
    () => (brand === 'Tutti' ? jewelryProducts : productsByBrand(jewelryProducts, brand)),
    [brand, jewelryProducts],
  )
  const visibleProducts = mode === 'full' ? products : products.slice(0, HOME_PREVIEW_COUNT)
  const stats = productStats(products)
  const catalogHref = brand === 'Tutti' ? '/gioielli' : `/gioielli?brand=${encodeURIComponent(brand)}`

  return (
    <section
      id="gioielli"
      className={`marble-section marble-section-dark relative overflow-hidden bg-ink ${
        mode === 'full' ? 'pb-[14vh] pt-[18vh]' : 'py-[14vh]'
      }`}
    >
      <div className="pointer-events-none absolute left-[-15vw] top-20 h-[55vh] w-[55vh] rounded-full bg-champagne/10 blur-[120px]" />
      <div className="mx-auto max-w-editorial px-6 md:px-10">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <Reveal delay={0.06}>
              <h2 className="chrome display text-[clamp(2.5rem,8vw,6.5rem)]">Gioielli</h2>
            </Reveal>
          </div>
          <p className="data text-[0.68rem] uppercase tracking-[0.16em] text-bone-faint lg:text-right">
            {mode === 'preview' ? `${visibleProducts.length} selezionati · ` : ''}
            {stats.total} gioielli · {stats.available} disponibili
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
            Tutti
          </button>
          {jewelryBrands.map((b) => (
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

        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} dense priority={index < 4} />
          ))}
        </div>

        {mode === 'preview' && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-white/10 pt-10 sm:flex-row">
            <a href={appHref(catalogHref)} className="btn-solid">
              Scopri tutti i gioielli
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
