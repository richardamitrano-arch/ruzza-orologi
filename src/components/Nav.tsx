import { useEffect, useState, type MouseEvent } from 'react'

import { WHATSAPP } from '../lib/contact'
import { bagBrands } from '../data/commerce'
import { appHref, appPath } from '../lib/routing'

type NavLink = {
  label: string
  href: string
  bagBrand?: string
  children?: NavLink[]
}

const links: NavLink[] = [
  { label: 'Ruzza Watch', href: '/#ruzza-watch-video' },
  { label: 'Orologi', href: '/orologi' },
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
  { label: 'Profumi', href: '/#prestigious-video' },
  { label: 'Vendi', href: '/#valutazione' },
]

export default function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6)
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
    const { href, bagBrand } = link
    if (bagBrand) {
      window.dispatchEvent(new CustomEvent('ruzza:set-bag-brand', { detail: bagBrand }))
    }

    if (href.startsWith('/#') && appPath() === '/') {
      const target = document.getElementById(href.slice(2))
      if (target) {
        event.preventDefault()
        window.history.pushState(null, '', appHref(href))
        if (href === '/#ruzza-watch-video') {
          window.dispatchEvent(new Event('ruzza:play-watch-film'))
        } else {
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY,
            behavior: 'smooth',
          })
        }
      }
    }
    setOpen(false)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-expo ${
        solid ? 'bg-ink/85 backdrop-blur-md border-b border-white/10' : 'bg-transparent'
      }`}
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

        <ul className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <li key={l.label} className={l.children ? 'group relative' : undefined}>
              <a
                href={appHref(l.href)}
                onClick={(event) => handleLinkClick(event, l)}
                className="font-sans text-[0.72rem] uppercase tracking-wide text-bone/80 transition-colors duration-300 hover:text-bone"
              >
                {l.label}
              </a>
              {l.children && (
                <div className="invisible absolute left-1/2 top-full mt-5 w-64 -translate-x-1/2 border border-white/10 bg-ink/95 p-2 opacity-0 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:visible group-hover:mt-3 group-hover:opacity-100 group-focus-within:visible group-focus-within:mt-3 group-focus-within:opacity-100">
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

          <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hidden btn-line md:inline-flex">
            Valutazione
          </a>

          {/* Mobile toggle */}
          <button
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
          >
          <span className={`h-px w-6 bg-bone transition-transform duration-300 ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
            <span className={`h-px w-6 bg-bone transition-transform duration-300 ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div className="border-t border-white/10 bg-ink/95 px-6 py-6 md:hidden">
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
