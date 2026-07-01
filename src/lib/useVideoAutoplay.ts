import { useEffect, useRef } from 'react'

/**
 * Autoplay muto a prova di mobile (iOS/Android), ottimizzato per il caricamento.
 * - forza la proprietà DOM `muted` (il prop di React è inaffidabile) + playsInline;
 * - parte SUBITO solo se il video è già a schermo (l'hero in cima): nessun ritardo;
 * - i video sotto la piega NON partono al mount, così non vengono scaricati al
 *   primo caricamento: l'IntersectionObserver li avvia appena ci si avvicina
 *   (rootMargin) e li mette in pausa quando escono, risparmiando banda e batteria.
 * Niente "tap to play": play() su video muto è sempre consentito.
 */
export function useVideoAutoplay() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    video.muted = true
    video.setAttribute('muted', '')
    video.playsInline = true

    const tryPlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }

    const isInViewport = () => {
      const r = video.getBoundingClientRect()
      return r.top < window.innerHeight && r.bottom > 0
    }

    // Solo i video già visibili partono subito; gli altri aspettano l'observer.
    if (isInViewport()) tryPlay()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) tryPlay()
          else video.pause()
        }
      },
      { threshold: 0.2, rootMargin: '300px 0px' },
    )
    observer.observe(video)

    return () => observer.disconnect()
  }, [])

  return ref
}
