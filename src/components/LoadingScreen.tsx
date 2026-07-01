import { useEffect, useState } from 'react'

/**
 * Preloader brandizzato. DUE regole ferree:
 *  1) La barra è ONESTA: barra e chiusura sono guidate dallo STESSO valore `progress`.
 *     Il loader si chiude ESATTAMENTE quando progress raggiunge 1 → la barra non può
 *     mai "mentire" (sparire prima del 100% o restare indietro).
 *  2) NON blocca lo scroll. Niente `overflow:hidden` su html/body: l'overlay opaco
 *     copre comunque la pagina, ma se per qualunque motivo il loader tardasse, lo
 *     scroll NON resta mai intrappolato (era questa la causa del "non scorre in fondo").
 *
 * progress = readiness reale del primo viewport (poster/video hero). Il secondo
 * hero si precarica in background: non deve bloccare la prima impressione.
 */
const MAX_MS = 4500
const MIN_MS = 650

type Win = Window & {
  __ruzzaHeroReady?: boolean
}

export default function LoadingScreen() {
  const [ready, setReady] = useState(false)
  const [gone, setGone] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const win = window as Win
    let done = false
    let progressFrac = 0
    const startedAt = performance.now()

    const finish = () => {
      if (done) return
      const elapsed = performance.now() - startedAt
      const finishNow = () => {
        done = true
        setProgress(1)
        setReady(true)
      }
      if (elapsed < MIN_MS) window.setTimeout(finishNow, MIN_MS - elapsed)
      else finishNow()
    }

    const recompute = () => {
      setProgress((prev) => (progressFrac > prev ? progressFrac : prev))
      if (progressFrac >= 0.999) finish()
    }

    const onHero1Prog = (e: Event) => {
      const rs = (e as CustomEvent).detail
      if (typeof rs === 'number') progressFrac = Math.max(progressFrac, Math.min(1, rs / 4))
      recompute()
    }
    const onHero1Ready = () => {
      progressFrac = 1
      recompute()
    }
    window.addEventListener('ruzza:hero-progress', onHero1Prog)
    if (win.__ruzzaHeroReady) onHero1Ready()
    else window.addEventListener('ruzza:hero-ready', onHero1Ready)

    recompute()

    const maxT = window.setTimeout(finish, MAX_MS)

    return () => {
      window.clearTimeout(maxT)
      window.removeEventListener('ruzza:hero-progress', onHero1Prog)
      window.removeEventListener('ruzza:hero-ready', onHero1Ready)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    // sicurezza assoluta: qualunque lock di scroll altrove non resta mai appeso
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    const t = window.setTimeout(() => setGone(true), 550)
    return () => window.clearTimeout(t)
  }, [ready])

  if (gone) return null

  return (
    <div
      aria-hidden
      className={`loader pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-ink transition-[opacity,transform,filter] duration-[550ms] ease-expo ${
        ready ? 'scale-[1.05] opacity-0 blur-[8px]' : 'opacity-100'
      }`}
    >
      <div className="loader-vignette pointer-events-none absolute inset-0" />
      <p className="loader-word chrome display leading-none text-[clamp(3rem,17vw,9.5rem)]">RUZZA</p>
      <p className="data mt-5 text-[0.6rem] uppercase tracking-[0.42em] text-bone-muted loader-sub">
        Alta Orologeria · Milano
      </p>
      <span className="mt-10 block h-px w-40 overflow-hidden bg-white/12">
        <span
          className="block h-full bg-malachite-bright"
          style={{ width: `${Math.round(progress * 100)}%`, transition: 'width 220ms ease-out' }}
        />
      </span>
    </div>
  )
}
