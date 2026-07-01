import { useEffect, useState, type FocusEvent, type MouseEvent } from 'react'

import { WHATSAPP } from '../lib/contact'
import { bagBrands, cleanProductTitle, formatCommercePrice, jewelryBrands, newProducts, type CommerceProduct } from '../data/commerce'
import { sizedImage } from '../lib/img'
import { appHref, appPath, productHref } from '../lib/routing'
import { shopifyUrl } from '../lib/shopify'

type NavLink = {
  label: string
  href: string
  bagBrand?: string
  jewelryBrand?: string
  children?: NavLink[]
  preview?: 'novita'
}

export default function Nav() {
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const navNewWatches = newProducts.filter((product) => product.category === 'orologi').slice(0, 3)
  const navNewBags = newProducts.filter((product) => product.category === 'luxury-bags').slice(0, 3)
  const links: NavLink[] = [
    { label: 'Ruzza Watch', href: '/#ruzza-watch-video' },
    { label: 'Orologi', href: '/orologi' },
    { label: 'Novità', href: '/novita', preview: 'novita' },
    {
      label: 'Luxury Bags',
      href: '/#luxury-bags-film',
      bagBrand: 'Tutti',
      children: [
        { label: 'Tutte', href: '/borse', bagBrand: 'Tutti' },
        ...bagBrands.map((brand) => ({
          label: `${brand.name} · ${brand.count}`,
          href: `/borse?brand=${encodeURIComponent(brand.name)}`,
          bagBrand: brand.name,
        })),
      ],
    },
    {
      label: 'Gioielli',
      href: '/gioielli',
      jewelryBrand: 'Tutti',
      children: [
        { label: 'Tutti', href: '/gioielli', jewelryBrand: 'Tutti' },
        ...jewelryBrands.map((brand) => ({
          label: `${brand.name} · ${brand.count}`,
          href: `/gioielli?brand=${encodeURIComponent(brand.name)}`,
          jewelryBrand: brand.name,
        })),
      ],
    },
    { label: 'Profumi', href: '/#prestigious-video' },
    { label: 'Vendi', href: '/#valutazione' },
  ]
  const accountHref = shopifyUrl('/account/login')

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > window.innerHeight * 0.6)
      // Auto-hide: si nasconde scrollando giù, riappare scrollando su.
      if (y > last && y > 90) setHidden(true)
      else if (y < last - 4) setHidden(false)
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, link: NavLink) => {
    const { href, bagBrand, jewelryBrand } = link
    if (bagBrand) {
      window.dispatchEvent(new CustomEvent('ruzza:set-bag-brand', { detail: bagBrand }))
    }
    if (jewelryBrand) {
      window.dispatchEvent(new CustomEvent('ruzza:set-jewelry-brand', { detail: jewelryBrand }))
    }

    if (href.startsWith('/') && !href.startsWith('/#')) {
      event.preventDefault()
      window.history.pushState(null, '', appHref(href))
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    if (href.startsWith('/#') && appPath() === '/') {
      const target = document.getElementById(href.slice(2))
      if (target) {
        event.preventDefault()
        window.history.pushState(null, '', appHref(href))
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY,
          behavior: 'smooth',
        })
      }
    }
    setOpen(false)
    setActiveMenu(null)
  }

  const handleMenuBlur = (event: FocusEvent<HTMLLIElement>, label: string) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setActiveMenu((current) => (current === label ? null : current))
  }

  const menuStateClass = (label: string) =>
    activeMenu === label ? 'visible mt-3 opacity-100' : 'invisible mt-5 opacity-0'

  const renderNewPreviewItem = (product: CommerceProduct) => (
    <a
      key={product.id}
      href={productHref(product.handle)}
      className="group/item grid grid-cols-[56px_1fr] gap-3 border border-white/10 bg-white/[0.015] p-2 transition-colors hover:border-champagne/45 hover:bg-white/[0.055]"
    >
      <div className="relative aspect-square overflow-hidden bg-ink-800">
        {product.featuredImage ? (
          <img
            src={sizedImage(product.featuredImage, 220)}
            alt={product.altText || cleanProductTitle(product.title)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover/item:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="data truncate text-[0.56rem] uppercase tracking-[0.14em] text-malachite-bright">
          {product.brand}
        </p>
        <p className="mt-1 line-clamp-2 font-sans text-[0.76rem] leading-snug text-bone">
          {cleanProductTitle(product.title)}
        </p>
        <p className="data mt-1 text-[0.62rem] text-champagne">{formatCommercePrice(product)}</p>
      </div>
    </a>
  )

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-expo ${
        hidden && !open ? '-translate-y-full' : 'translate-y-0'
      } ${solid ? 'bg-ink/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'}`}
    >
      <nav className="mx-auto flex max-w-editorial items-center justify-between px-6 py-5 md:px-10">
        <a
          href={appHref('/')}
          aria-label="Ruzza Milano"
          className="font-display text-xl tracking-wide text-bone md:text-2xl"
        >
          RUZZA
          <span className="ml-2 align-middle text-[0.6rem] font-sans uppercase tracking-label text-bone-muted">
            Milano
          </span>
        </a>

        <ul className="hidden items-center gap-6 lg:flex xl:gap-9">
          {links.map((l) => (
            <li
              key={l.label}
              className={l.children || l.preview ? 'group relative' : undefined}
              onMouseEnter={l.children || l.preview ? () => setActiveMenu(l.label) : undefined}
              onMouseLeave={l.children || l.preview ? () => setActiveMenu((current) => (current === l.label ? null : current)) : undefined}
              onFocus={l.children || l.preview ? () => setActiveMenu(l.label) : undefined}
              onBlur={l.children || l.preview ? (event) => handleMenuBlur(event, l.label) : undefined}
              data-nav-menu={l.preview || (l.children ? l.label : undefined)}
            >
              <a
                href={appHref(l.href)}
                onClick={(event) => handleLinkClick(event, l)}
                className="font-sans text-[0.72rem] uppercase tracking-wide text-bone/80 transition-colors duration-300 hover:text-bone"
              >
                {l.label}
              </a>
              {l.preview === 'novita' && (
                <div className={`${menuStateClass(l.label)} absolute left-1/2 top-full w-[720px] max-w-[calc(100vw-48px)] -translate-x-1/2 border border-white/10 bg-ink/95 p-5 shadow-2xl backdrop-blur-md transition-all duration-300`}>
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                    <p className="label text-bone-faint">Ultimi arrivi</p>
                    <a
                      href={appHref('/novita')}
                      onClick={(event) => handleLinkClick(event, { label: 'Novità', href: '/novita' })}
                      className="data text-[0.6rem] uppercase tracking-[0.16em] text-champagne transition-colors hover:text-bone"
                    >
                      Tutte le novità
                    </a>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="data mb-3 text-[0.62rem] uppercase tracking-[0.16em] text-bone-faint">
                        Orologi
                      </p>
                      <div className="grid gap-2">{navNewWatches.map(renderNewPreviewItem)}</div>
                    </div>
                    <div>
                      <p className="data mb-3 text-[0.62rem] uppercase tracking-[0.16em] text-bone-faint">
                        Luxury Bags
                      </p>
                      <div className="grid gap-2">{navNewBags.map(renderNewPreviewItem)}</div>
                    </div>
                  </div>
                </div>
              )}
              {l.children && (
                <div className={`${menuStateClass(l.label)} absolute left-1/2 top-full w-64 -translate-x-1/2 border border-white/10 bg-ink/95 p-2 shadow-2xl backdrop-blur-md transition-all duration-300`}>
                  {l.children.map((child) => (
                    <a
                      key={child.label}
                      href={appHref(child.href)}
                      onClick={(event) => handleLinkClick(event, child)}
                      className="block px-4 py-3 font-sans text-xs uppercase tracking-wide text-bone-muted transition-colors hover:bg-white/5 hover:text-bone"
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1 md:gap-3">
          <button
            type="button"
            aria-label="Cerca"
            onClick={() => window.dispatchEvent(new Event('ruzza:open-search'))}
            className="flex h-11 w-11 items-center justify-center text-bone/80 transition-colors hover:text-bone"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" strokeLinecap="round" />
            </svg>
          </button>

          <a
            href={accountHref}
            aria-label="Accedi al tuo account"
            title="Accedi"
            className="flex h-11 w-11 items-center justify-center text-bone/80 transition-colors hover:text-bone"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
            </svg>
          </a>

          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hidden btn-line lg:inline-flex">
            Valutazione
          </a>

          {/* Mobile toggle */}
          <button
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
          <span className={`h-px w-6 bg-bone transition-transform duration-300 ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
            <span className={`h-px w-6 bg-bone transition-transform duration-300 ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div className="border-t border-white/10 bg-ink/95 px-6 py-6 lg:hidden">
          <ul className="flex flex-col gap-5">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={appHref(l.href)}
                  onClick={(event) => handleLinkClick(event, l)}
                  className="font-display text-2xl text-bone"
                >
                  {l.label}
                </a>
                {l.children && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {l.children.map((child) => (
                      <a
                        key={child.label}
                        href={appHref(child.href)}
                        onClick={(event) => handleLinkClick(event, child)}
                        className="border border-white/10 px-3 py-2 font-sans text-[0.65rem] uppercase tracking-wide text-bone-muted"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li>
              <a href={accountHref} className="font-display text-2xl text-bone">
                Accedi
              </a>
            </li>
            <li className="pt-2">
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="btn-solid w-full justify-center">
                Valutazione gratuita
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
