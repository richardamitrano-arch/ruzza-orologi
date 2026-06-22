import { useEffect, useMemo, useRef, useState } from 'react'

import {
  cleanProductTitle,
  formatCommercePrice,
  luxuryBagProducts,
  perfumeProducts,
  ruzzaWatchProducts,
  watchProducts,
  type CommerceProduct,
} from '../data/commerce'

const CATEGORY_LABEL: Record<CommerceProduct['category'], string> = {
  'ruzza-watch': 'Ruzza Watch',
  orologi: 'Orologi',
  'luxury-bags': 'Borse',
  profumi: 'Profumi',
}

const RESULT_LIMIT = 48

export default function SearchOverlay() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const allProducts = useMemo(
    () => [...watchProducts, ...ruzzaWatchProducts, ...luxuryBagProducts, ...perfumeProducts],
    [],
  )

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('ruzza:open-search', onOpen)
    return () => window.removeEventListener('ruzza:open-search', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const tokens = q.split(/\s+/)
    return allProducts
      .filter((product) => {
        const haystack = `${cleanProductTitle(product.title)} ${product.brand} ${product.sku} ${
          CATEGORY_LABEL[product.category]
        } ${product.tags.join(' ')}`.toLowerCase()
        return tokens.every((token) => haystack.includes(token))
      })
      .slice(0, RESULT_LIMIT)
  }, [query, allProducts])

  if (!open) return null

  const trimmed = query.trim()

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Cerca">
      <div className="mx-auto flex h-full w-full max-w-editorial flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Search bar */}
        <div className="flex items-center gap-4 border-b border-white/15 pb-4">
          <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 shrink-0 text-bone-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca un orologio, un brand, una borsa…"
            className="min-w-0 flex-1 bg-transparent font-display text-2xl text-bone placeholder:text-bone-faint focus:outline-none md:text-4xl"
          />
          <button
            type="button"
            onClick={close}
            className="data shrink-0 border border-white/15 px-3 py-2 text-[0.62rem] uppercase tracking-wide text-bone-muted transition-colors hover:border-champagne/40 hover:text-bone"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="mt-6 flex-1 overflow-y-auto">
          {trimmed === '' ? (
            <p className="data text-[0.7rem] uppercase tracking-[0.16em] text-bone-faint">
              Digita per cercare tra {allProducts.length} pezzi · orologi, Ruzza Watch, borse, profumi
            </p>
          ) : results.length === 0 ? (
            <p className="font-display text-xl text-bone-muted">
              Nessun risultato per “{trimmed}”.
            </p>
          ) : (
            <>
              <p className="data text-[0.7rem] uppercase tracking-[0.16em] text-bone-faint">
                {results.length}
                {results.length === RESULT_LIMIT ? '+' : ''} risultati
              </p>
              <ul className="mt-4 grid gap-2 pb-6 sm:grid-cols-2">
                {results.map((product) => (
                  <li key={product.id}>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-4 border border-white/10 p-3 transition-colors hover:border-champagne/40 hover:bg-white/5"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden bg-ink-800">
                        {product.featuredImage ? (
                          <img
                            src={product.featuredImage}
                            alt={product.altText || cleanProductTitle(product.title)}
                            className="h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="label text-malachite-bright">
                          {product.brand} · {CATEGORY_LABEL[product.category]}
                        </p>
                        <p className="mt-1 truncate font-display text-base text-bone">
                          {cleanProductTitle(product.title)}
                        </p>
                      </div>
                      <p className="data shrink-0 text-sm text-champagne">{formatCommercePrice(product)}</p>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
