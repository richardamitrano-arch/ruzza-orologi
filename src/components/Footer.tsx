import type { MouseEvent } from 'react'
import {
  WHATSAPP,
  PHONE_TEL,
  PHONE_DISPLAY,
  EMAIL,
  TELEGRAM,
  ADDRESS,
  VAT,
  SOCIAL,
  PRIVACY_POLICY,
} from '../lib/contact'
import { appHref, isInternalHref } from '../lib/routing'
import { shopifyUrl } from '../lib/shopify'

const watchBrandHref = (brand: string) => `/orologi?brand=${encodeURIComponent(brand)}`

const navigateInsideApp = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith('/') || href.startsWith('/#')) return

  event.preventDefault()
  window.history.pushState(null, '', appHref(href))
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'auto' })
}

const cols = [
  {
    title: 'Collezioni',
    links: [
      { label: 'Ruzza Watch', href: '/#ruzza-watch-video' },
      { label: 'Orologi', href: '/orologi' },
      { label: 'Novità', href: '/novita' },
      { label: 'Luxury Bags', href: '/borse' },
      { label: 'Gioielli', href: '/gioielli' },
      { label: 'Profumi', href: '/#prestigious-video' },
    ],
  },
  {
    title: 'Maison orologi',
    links: [
      { label: 'Rolex', href: watchBrandHref('Rolex') },
      { label: 'Patek Philippe', href: watchBrandHref('Patek Philippe') },
      { label: 'Audemars Piguet', href: watchBrandHref('Audemars Piguet') },
      { label: 'Tutti gli orologi', href: '/orologi' },
    ],
  },
  {
    title: 'Maison',
    links: [
      { label: 'La nostra storia', href: '/#maison' },
      { label: 'Valutazione', href: '/#valutazione' },
      { label: 'Luxury Bags', href: '/borse' },
      { label: 'Gioielli', href: '/gioielli' },
      { label: 'Profumi', href: '/#prestigious-video' },
    ],
  },
  {
    title: 'Contatti',
    links: [
      { label: 'WhatsApp', href: WHATSAPP },
      { label: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
      { label: EMAIL, href: `mailto:${EMAIL}` },
      { label: 'Area clienti / Accedi', href: shopifyUrl('/account/login') },
      { label: 'Vendi il tuo orologio', href: '/#valutazione' },
      { label: 'Privacy Policy', href: PRIVACY_POLICY },
    ],
  },
]

const socials = [
  { label: 'Instagram', href: SOCIAL.instagram },
  { label: 'Facebook', href: SOCIAL.facebook },
  { label: 'Telegram', href: TELEGRAM },
]

export default function Footer() {
  return (
    <footer className="marble-section marble-section-dark border-t border-white/10 bg-ink-900 pb-28 pt-[10vh] md:pb-0">
      <div className="mx-auto max-w-editorial px-6 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl tracking-wide text-bone">RUZZA</p>
            <p className="mt-3 max-w-xs font-sans text-sm font-light leading-relaxed text-bone-muted">
              Alta orologeria nel cuore di Milano. Acquisto, vendita e permuta di orologi di lusso dal
              2017.
            </p>
            <p className="mt-6 font-sans text-sm font-light text-bone-muted">{ADDRESS}</p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <p className="label mb-6 text-bone-faint">{c.title}</p>
              <ul className="flex flex-col gap-4">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={isInternalHref(l.href) ? appHref(l.href) : l.href}
                      onClick={(event) => navigateInsideApp(event, l.href)}
                      target={/^(#|\/|tel|mailto)/.test(l.href) ? undefined : '_blank'}
                      rel={/^(#|\/|tel|mailto)/.test(l.href) ? undefined : 'noreferrer'}
                      className="font-sans text-sm font-light text-bone/80 transition-colors duration-300 hover:text-bone"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-[10vh] flex flex-col gap-6 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
          <p className="font-sans text-xs text-bone-faint">
            © {new Date().getFullYear()} Ruzza Orologi S.r.l. · P.IVA {VAT} · Milano
          </p>
          <div className="flex items-center gap-6">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="font-sans text-xs uppercase tracking-wide text-bone-faint transition-colors duration-300 hover:text-bone"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <p className="border-t border-white/5 py-8 font-sans text-[0.65rem] leading-relaxed text-bone-faint">
          La commercializzazione e/o l'offerta in vendita tramite il sito www.ruzzaorologi.com o presso
          qualsivoglia spazio fisico del prodotto RUZZA WATCH nella variante di colore denominata
          "Tiffany" né qualsiasi riferimento a "TIFFANY" e/o in color "Tiffany" e/o simile, è da
          intendersi quale iniziativa autonoma di Ruzza Orologi S.r.l., estranea a Tiffany and Company
          che non è in alcun modo responsabile della sua qualità e di eventuali difetti.
        </p>
      </div>
    </footer>
  )
}
