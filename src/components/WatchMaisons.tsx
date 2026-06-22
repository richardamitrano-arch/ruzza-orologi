import { useMemo, useState } from 'react'
import { mainWatchMaisons, productsByBrand, watchProducts } from '../data/commerce'
import ProductCard from './ProductCard'
import { Reveal } from './Reveal'
import { appHref } from '../lib/routing'

export default function WatchMaisons() {
  const [active, setActive] = useState(mainWatchMaisons[0])
  const products = useMemo(() => productsByBrand(watchProducts, active), [active])
  const previewProducts = products.slice(0, 4)
  const hero = products[0]
  const catalogHref = `/orologi?brand=${encodeURIComponent(active)}`

  return (
    <section id="maison-orologi" className="relative overflow-hidden bg-ink py-[14vh]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(70%_90%_at_50%_0%,rgba(194,165,111,0.13),transparent_72%)]" />
      <div className="relative mx-auto max-w-editorial px-6 md:px-10">
        <div className="mb-14 text-center">
          <Reveal delay={0.06}>
            <h2 className="chrome display text-[clamp(2.5rem,8vw,6.5rem)]">Tre Maison</h2>
          </Reveal>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {mainWatchMaisons.map((brand) => {
            const count = productsByBrand(watchProducts, brand).length
            return (
              <button
                key={brand}
                type="button"
                onClick={() => setActive(brand)}
                className={`group border p-6 text-left transition-all duration-500 ease-expo ${
                  active === brand
                    ? 'border-malachite-bright bg-malachite/15'
                    : 'border-white/10 bg-white/[0.015] hover:border-bone/35'
                }`}
                aria-pressed={active === brand}
              >
                <p className="font-display text-3xl text-bone">{brand}</p>
                <div className="tick-rail mt-5 opacity-60" />
                <p className="data mt-5 text-[0.68rem] uppercase tracking-[0.16em] text-bone-faint">
                  {count} segnatempo
                </p>
              </button>
            )
          })}
        </div>

        {hero && (
          <div className="mb-12 grid gap-8 border-y border-white/10 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
              <img
                src={hero.featuredImage}
                alt={hero.altText}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
            <div>
              <h3 className="font-display text-4xl text-bone md:text-6xl">{active}</h3>
              <div className="mt-8">
                <a href={appHref(catalogHref)} className="btn-solid">
                  Sfoglia tutti i {products.length}
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {previewProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} dense priority={index < 4} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a href={appHref(catalogHref)} className="btn-line">
            Entra nella Maison {active}
          </a>
        </div>
      </div>
    </section>
  )
}
