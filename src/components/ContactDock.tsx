import { useEffect, useState } from 'react'
import { PHONE_TEL, PHONE_DISPLAY, EMAIL, TELEGRAM, whatsappHrefForCategory } from '../lib/contact'

const buildChannels = (whatsappHref: string) => [
  {
    label: 'WhatsApp',
    sub: 'Assistenza diretta',
    href: whatsappHref,
    icon: (
      <path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1112 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 00-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5 0 1.4-.6 1.6-1.1s.2-1 .1-1.1z" />
    ),
  },
  {
    label: 'Telefono',
    sub: PHONE_DISPLAY,
    href: `tel:${PHONE_TEL}`,
    icon: (
      <path d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .7-.2 1l-2.2 2.2z" />
    ),
  },
  {
    label: 'Email',
    sub: EMAIL,
    href: `mailto:${EMAIL}`,
    icon: (
      <path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm9 7L4 7v1l8 5 8-5V7l-8 5z" />
    ),
  },
  {
    label: 'Telegram',
    sub: 'Canale ufficiale',
    href: TELEGRAM,
    icon: <path d="M21.9 4.3l-3 14.1c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L7.5 12 3 10.6c-1-.3-1-1 .2-1.5l17.2-6.6c.8-.3 1.5.2 1.5 1.8z" />,
  },
]

type ContactDockProps = {
  compact?: boolean
  category?: string
}

export default function ContactDock({ compact = false, category }: ContactDockProps) {
  const [open, setOpen] = useState(false)
  const channels = buildChannels(whatsappHrefForCategory(category))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="fixed bottom-4 right-4 z-[55] flex flex-col items-end gap-3 md:bottom-7 md:right-7">
      {/* Panel */}
      {open && (
        <div className="w-[min(86vw,320px)] overflow-hidden border border-white/12 bg-ink-800/95 backdrop-blur-md shadow-2xl">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="font-display text-xl text-bone">Come possiamo aiutarti?</p>
            <p className="mt-1 font-sans text-xs font-light text-bone-muted">
              Acquisto, vendita o valutazione — rispondiamo a breve.
            </p>
          </div>
          <ul>
            {channels.map((c) => (
              <li key={c.label} className="border-b border-white/5 last:border-0">
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-malachite/20 text-malachite-bright">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                      {c.icon}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-sans text-sm text-bone">{c.label}</span>
                    <span className="block truncate font-sans text-xs font-light text-bone-muted">
                      {c.sub}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Chiudi assistenza' : 'Ti serve aiuto?'}
        className={`flex items-center gap-3 rounded-full bg-malachite text-bone shadow-xl transition-all duration-300 ease-expo hover:bg-malachite-bright ${
          compact ? 'px-3 py-3 md:px-5' : 'px-5 py-3'
        }`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
          {open ? (
            <path d="M6.4 5L5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
          ) : (
            <path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2z" />
          )}
        </svg>
        <span className={`font-sans text-[0.72rem] uppercase tracking-wide ${compact ? 'hidden md:inline' : ''}`}>
          {open ? 'Chiudi' : 'Ti serve aiuto?'}
        </span>
      </button>
    </div>
  )
}
