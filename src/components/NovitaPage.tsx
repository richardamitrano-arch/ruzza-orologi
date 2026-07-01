import { useMemo, useState } from 'react'
import { newProducts, productStats, type CommerceProduct } from '../data/commerce'
import ProductCard from './ProductCard'
import { Reveal } from './Reveal'

type NewCategory = 'Tutte' | 'Orologi' | 'Borse' | 'Gioielli' | 'Ruzza Watch'

const categories: NewCategory[] = ['Tutte', 'Orologi', 'Borse', 'Gioielli', 'Ruzza Watch']

const categoryLabel: Record<CommerceProduct['category'], Exclude<NewCategory, 'Tutte'> | 'Profumi'> = {
  orologi: 'Orologi',
  'luxury-bags': 'Borse',
  gioielli: 'Gioielli',
  'ruzza-watch': 'Ruzza Watch',
  profumi: 'Profumi',
}

function matchesCategory(product: CommerceProduct, category: NewCategory) {
  return category === 'Tutte' || categoryLabel[product.category] === category
}

export default function NovitaPage() {
  const [category, setCategory] = useState<NewCategory>('Tutte')
  const products = useMemo(
    () => newProducts.filter((product) => matchesCategory(product, category)),
    [category, newProducts],
  )
  const stats = productStats(products)

  return (
    <main>
      <section id="novita" className="relative bg-ink-900 pb-[14vh] pt-[18vh]">
        <div className="mx-auto max-w-editorial px-6 md:px-10">
          <div className="mb-10 flex min-w-0 flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between md:gap-8">
            <div className="min-w-0">
              <Reveal delay={0.06}>
                <h1 className="chrome display text-[clamp(3rem,9vw,7rem)]">Novità</h1>
              </Reveal>
              <p className="mt-5 max-w-[32rem] font-sans text-sm font-light leading-relaxed text-bone-muted sm:text-base md:text-lg">
                Ultimi arrivi e pezzi appena selezionati dalla boutique: orologi, borse, gioielli e Ruzza Watch.
              </p>
            </div>
            <p className="data text-[0.62rem] uppercase leading-relaxed tracking-[0.14em] text-bone-faint md:text-[0.68rem]">
              {stats.total} pezzi · {stats.brands} Maison · {stats.available} disponibili
            </p>
          </div>

          <div className="-mx-6 mb-10 flex gap-2 overflow-x-auto px-6 pb-3 md:mx-0 md:gap-3 md:px-0">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`shrink-0 border px-4 py-3 font-sans text-[0.62rem] uppercase tracking-wide transition-colors md:px-5 md:text-[0.68rem] ${
                  category === item
                    ? 'border-malachite-bright bg-malachite/20 text-bone'
                    : 'border-white/10 text-bone-muted hover:text-bone'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} dense priority={index < 4} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
