import { useEffect, useMemo, useState } from 'react'
import { productStats, productsByBrand, watchBrands, watchProducts } from '../data/commerce'
import ProductCard from './ProductCard'
import { Reveal } from './Reveal'
import { appHref } from '../lib/routing'

type WatchCatalogProps = {
  mode?: 'preview' | 'full'
  initialBrand?: string
}

const HOME_PREVIEW_DESKTOP = 12 // PC: 12 = righe PARI su 2/3/4 colonne (niente riga monca)
const HOME_PREVIEW_MOBILE = 4 // Mobile: lista corta (meno scroll)
const priorityBrands = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Richard Mille']

export default function WatchCatalog({ mode = 'preview', initialBrand = 'Tutti' }: WatchCatalogProps) {
  const orderedWatchBrands = [
    ...priorityBrands.map((name) => watchBrands.find((brand) => brand.name === name)).filter(Boolean),
    ...watchBrands.filter((brand) => !priorityBrands.includes(brand.name)),
  ] as typeof watchBrands
  const previewBrands = orderedWatchBrands.slice(0, 8)
  const safeInitialBrand =
    initialBrand === 'Tutti' || watchBrands.some((item) => item.name === initialBrand) ? initialBrand : 'Tutti'
  const [brand, setBrand] = useState(safeInitialBrand)

  useEffect(() => {
    setBrand(safeInitialBrand)
  }, [safeInitialBrand])

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const products = useMemo(
    () => (brand === 'Tutti' ? watchProducts : productsByBrand(watchProducts, brand)),
    [brand, watchProducts],
  )
  const previewCount = isMobile ? HOME_PREVIEW_MOBILE : HOME_PREVIEW_DESKTOP
  const visibleProducts = mode === 'full' ? products : products.slice(0, previewCount)
  const stats = productStats(products)
  const shownBrands = mode === 'full' ? orderedWatchBrands : previewBrands
  const catalogHref = brand === 'Tutti' ? '/orologi' : `/orologi?brand=${encodeURIComponent(brand)}`

  return (
    <section id="orologi" className={`relative bg-ink-900 ${mode === 'full' ? 'pb-[14vh] pt-[18vh]' : 'py-[14vh]'}`}>
      <div className="mx-auto max-w-editorial px-6 md:px-10">
        <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal delay={0.06}>
              <h2 className="chrome display text-[clamp(2.5rem,8vw,6.5rem)]">Orologi</h2>
            </Reveal>
          </div>
          <p className="data text-[0.68rem] uppercase tracking-[0.16em] text-bone-faint">
            {mode === 'preview' ? `${visibleProducts.length} selezionati · ` : ''}
            {stats.total} orologi · {stats.brands} Maison · {stats.available} disponibili
          </p>
        </div>

        <div className="mb-10 flex gap-3 overflow-x-auto pb-3">
          <button
            type="button"
            onClick={() => setBrand('Tutti')}
            aria-pressed={brand === 'Tutti'}
            className={`shrink-0 border px-5 py-3 font-sans text-[0.68rem] uppercase tracking-wide ${
              brand === 'Tutti' ? 'border-malachite-bright bg-malachite/20 text-bone' : 'border-white/10 text-bone-muted'
            }`}
          >
            Tutti
          </button>
          {shownBrands.map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => setBrand(b.name)}
              aria-pressed={brand === b.name}
              className={`shrink-0 border px-5 py-3 font-sans text-[0.68rem] uppercase tracking-wide transition-colors ${
                brand === b.name ? 'border-malachite-bright bg-malachite/20 text-bone' : 'border-white/10 text-bone-muted hover:text-bone'
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
              Altri orologi
            </a>
            <p className="data text-[0.62rem] uppercase tracking-[0.16em] text-bone-faint">
              {stats.total} pezzi in boutique
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
