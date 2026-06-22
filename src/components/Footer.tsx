import {
  WHATSAPP,
  PHONE_TEL,
  PHONE_DISPLAY,
  EMAIL,
  TELEGRAM,
  ADDRESS,
  VAT,
  CONTACT_FORM,
  COLLECTIONS,
  SOCIAL,
} from '../lib/contact'
import { appHref, isInternalHref } from '../lib/routing'

const cols = [
  {
    title: 'Collezioni',
    links: [
      { label: 'Ruzza Watch', href: '/#ruzza-watch-video' },
      { label: 'Orologi', href: '/orologi' },
      { label: 'Luxury Bags', href: '/#luxury-bags-film' },
      { label: 'Profumi', href: '/#prestigious-video' },
    ],
  },
  {
    title: 'Maison orologi',
    links: [
      { label: 'Rolex', href: COLLECTIONS.rolex },
      { label: 'Patek Philippe', href: COLLECTIONS.patek },
      { label: 'Audemars Piguet', href: COLLECTIONS.ap },
      { label: 'Novità', href: COLLECTIONS.novita },
    ],
  },
  {
    title: 'Maison',
    links: [
      { label: 'La nostra storia', href: '/#maison' },
      { label: 'Valutazione', href: '/#valutazione' },
      { label: 'Luxury Bags', href: COLLECTIONS.bags },
      { label: 'T-Shirt', href: COLLECTIONS.tshirt },
    ],
  },
  {
    title: 'Contatti',
    links: [
      { label: 'WhatsApp', href: WHATSAPP },
      { label: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
      { label: 'Email', href: `mailto:${EMAIL}` },
      { label: 'Vendi il tuo orologio', href: CONTACT_FORM },
      { label: 'Privacy Policy', href: 'https://ruzzaorologi.com/pages/privacy-policy' },
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
    <footer className="marble-section marble-section-dark border-t border-white/10 bg-ink-900 pt-[10vh]">
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

        <p className="border-t border-white/5 py-8 font-sans text-[0.65rem] leading-relaxed text-bone-faint/70">
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
