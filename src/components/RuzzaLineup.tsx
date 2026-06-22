import { useMemo, useState } from 'react'
import { productsBySubcategory, ruzzaWatchProducts, productStats } from '../data/commerce'
import ProductCard from './ProductCard'
import { Reveal } from './Reveal'

const tabs = [
  {
    id: 'luxury',
    label: 'Luxury',
  },
  {
    id: 'basic',
    label: 'Basic',
  },
] as const

type TabId = (typeof tabs)[number]['id']

export default function RuzzaLineup() {
  const [active, setActive] = useState<TabId>('luxury')
  const groups = useMemo(
    () => ({
      luxury: productsBySubcategory(ruzzaWatchProducts, 'luxury'),
      basic: productsBySubcategory(ruzzaWatchProducts, 'basic'),
    }),
    [],
  )
  const products = groups[active]
  const stats = productStats(products)
  const current = tabs.find((tab) => tab.id === active)!

  return (
    <section id="ruzza-watch" className="marble-section marble-section-dark relative overflow-hidden bg-ink-900 py-[14vh]">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vh] w-[90vh] -translate-x-1/2 rounded-full bg-malachite-deep/15 blur-[140px]" />

      <div className="relative mx-auto mb-12 max-w-editorial px-6 text-center md:px-10">
        <Reveal delay={0.06}>
          <h2 className="chrome display text-[clamp(2.8rem,9vw,7.5rem)]">Ruzza Watch</h2>
        </Reveal>
      </div>

      <div className="relative mx-auto max-w-editorial px-6 md:px-10">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`border px-6 py-3 font-sans text-[0.72rem] uppercase tracking-wide transition-all duration-300 ${
                  active === tab.id
                    ? 'border-malachite-bright bg-malachite/25 text-bone'
                    : 'border-white/12 text-bone-muted hover:border-bone/40 hover:text-bone'
                }`}
                aria-pressed={active === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="data text-[0.68rem] uppercase tracking-[0.16em] text-bone-faint">
            {stats.total} modelli · {stats.available} disponibili
          </p>
        </div>

        <div className="mb-10 border-y border-white/10 py-6">
          <p className="font-display text-3xl text-bone md:text-5xl">{current.label}</p>
        </div>

        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              dense
              priority={index < 4}
              showDescription={false}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
