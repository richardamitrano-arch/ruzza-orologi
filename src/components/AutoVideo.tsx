import { useEffect, useRef, useState } from 'react'

/**
 * Video full-bleed con autoplay muto a prova di mobile, SENZA mai il glifo play iOS
 * e con caricamento DIFFERITO (più veloce su mobile, qualità video invariata).
 *
 * Anti-glifo: niente `poster`/`controls`; sotto c'è un <img> col PRIMO FRAME; il
 * <video> sta sopra ma a opacity 0 finché non riproduce davvero (`onPlaying`).
 *
 * Caricamento (la velocità su mobile viene dal differire i film, non l'hero):
 *  - hero (`eager`): carica SUBITO, ma è coperto dal LoadingScreen che ASPETTA il
 *    video → alla dissolvenza l'hero è già pronto e parte (niente "pop-in");
 *  - film (sotto la piega): il video si monta/scarica SOLO quando ci si avvicina
 *    (IntersectionObserver) → ~7.6MB non scaricati al primo load. Qualità invariata.
 * Play forzato: canplay/loadeddata, ingresso in viewport, primo touch/click.
 */
type Props = {
  src: string
  mobileSrc?: string
  firstFrame: string
  className?: string
  ariaLabel?: string
  eager?: boolean
}

export default function AutoVideo({ src, mobileSrc, firstFrame, className = '', ariaLabel, eager = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [playing, setPlaying] = useState(false)
  // su mobile usa la versione leggera del video (stessa risoluzione, file più piccolo)
  const [isMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  )
  const effectiveSrc = isMobile && mobileSrc ? mobileSrc : src
  // hero (eager): carica SUBITO — è mascherato dal LoadingScreen, che aspetta il
  //   video → alla dissolvenza l'hero è già pronto e parte (niente "pop-in").
  // film (non-eager): differito → monta/scarica solo all'avvicinarsi.
  const [shouldLoad, setShouldLoad] = useState(eager)

  useEffect(() => {
    if (eager) return
    const node = imgRef.current
    if (!node) {
      setShouldLoad(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [eager])

  // Play forzato quando il video è montato
  useEffect(() => {
    if (!shouldLoad) return
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.setAttribute('muted', '')
    video.playsInline = true

    const tryPlay = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    // segnala al LoadingScreen che l'hero è DAVVERO pronto (sta partendo o è
    // bufferizzato a sufficienza) → il loader sparisce sul caricamento reale, non prima.
    const signalReady = () => {
      if (!eager) return
      ;(window as unknown as { __ruzzaHeroReady?: boolean }).__ruzzaHeroReady = true
      window.dispatchEvent(new Event('ruzza:hero-ready'))
    }
    // progresso REALE del caricamento hero (readyState 0..4) → la barra del loader
    // si riempie col caricamento vero e arriva al 100% quando l'hero è pronto.
    const signalProgress = () => {
      if (!eager) return
      window.dispatchEvent(new CustomEvent('ruzza:hero-progress', { detail: video.readyState }))
    }
    const onPlaying = () => {
      setPlaying(true)
      signalReady()
    }
    const onCanThrough = () => {
      signalProgress()
      signalReady()
    }
    const onFirstInteract = () => tryPlay()

    video.addEventListener('loadedmetadata', signalProgress)
    video.addEventListener('loadeddata', tryPlay)
    video.addEventListener('loadeddata', signalProgress)
    video.addEventListener('progress', signalProgress)
    video.addEventListener('timeupdate', signalProgress)
    video.addEventListener('canplay', tryPlay)
    video.addEventListener('canplay', signalProgress)
    video.addEventListener('canplaythrough', onCanThrough)
    video.addEventListener('playing', onPlaying)
    // Hero pronto appena il PRIMO frame è mostrabile (loadeddata/canplay) o se il
    // video va in errore/stallo: così il loader non resta appeso fino a 30s su iOS
    // in Risparmio Energetico (autoplay bloccato → 'playing' non scatta mai). Il
    // poster <img> è già visibile sotto, quindi "pronto" qui è sicuro.
    const onShowable = () => signalReady()
    video.addEventListener('loadeddata', onShowable)
    video.addEventListener('canplay', onShowable)
    video.addEventListener('error', onShowable)
    video.addEventListener('stalled', onShowable)
    window.addEventListener('touchstart', onFirstInteract, { passive: true })
    window.addEventListener('click', onFirstInteract)
    signalProgress() // stato iniziale

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) tryPlay()
          else video.pause()
        }
      },
      { threshold: 0.15, rootMargin: eager ? '0px' : '300px 0px' },
    )
    observer.observe(video)
    tryPlay()

    return () => {
      observer.disconnect()
      video.removeEventListener('loadedmetadata', signalProgress)
      video.removeEventListener('loadeddata', tryPlay)
      video.removeEventListener('loadeddata', signalProgress)
      video.removeEventListener('progress', signalProgress)
      video.removeEventListener('timeupdate', signalProgress)
      video.removeEventListener('canplay', tryPlay)
      video.removeEventListener('canplay', signalProgress)
      video.removeEventListener('canplaythrough', onCanThrough)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('loadeddata', onShowable)
      video.removeEventListener('canplay', onShowable)
      video.removeEventListener('error', onShowable)
      video.removeEventListener('stalled', onShowable)
      window.removeEventListener('touchstart', onFirstInteract)
      window.removeEventListener('click', onFirstInteract)
    }
  }, [shouldLoad, eager])

  return (
    <>
      <img
        ref={imgRef}
        src={firstFrame}
        alt=""
        aria-hidden
        className={className}
        fetchPriority={eager ? 'high' : 'auto'}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      {shouldLoad && (
        <video
          ref={videoRef}
          src={effectiveSrc}
          className={`${className} transition-opacity duration-700`}
          // visibility:hidden (non solo opacity) nasconde anche il glifo play nativo di
          // iOS quando il video non sta riproducendo (es. Risparmio Energetico).
          style={{ opacity: playing ? 1 : 0, visibility: playing ? 'visible' : 'hidden' }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={ariaLabel}
        />
      )}
    </>
  )
}
