import { useEffect, useRef } from 'react'
import { mediaPath } from '../lib/routing'

export const HERO_VH = 500
const FRAME_COUNT = 135
// Il loader si sblocca dopo questi primi frame (non tutti i 135): il resto continua
// a precaricarsi in sottofondo mentre sei sul 1° hero. Evita lo splash "appeso"
// 12-30s su mobile (scaricare 14MB prima di mostrare la pagina). Lo scrub disegna
// comunque i frame man mano che arrivano.
const READY_THRESHOLD = 24
// Scroll-scrubbed hero film — export Picsart 4K (16:9). Il canvas cover-fitta:
// riempie desktop (16:9) e mobile (center-crop) senza barre.
// Frame in WebP a PIENA risoluzione 1920×1080 (stessa qualità del JPEG, ~30% in meno
// di peso) → si possono precaricare TUTTI senza perdere nitidezza, su desktop e mobile.
const HERO_DIR = 'hero-picsart-webp'
const frameSrc = (frame: number) => mediaPath(`/media/${HERO_DIR}/f_${String(frame).padStart(3, '0')}.webp`)
// Se un frame resta "appeso" (né load né error) non blocca il loader: dopo questo
// tempo lo si conta comunque come risolto (la barra non si pianta al 99%).
const FRAME_TIMEOUT_MS = 15000
const BACKGROUND_BATCH_SIZE = 8
const BACKGROUND_BATCH_DELAY_MS = 120

type Hero2Prog = { loaded: number; total: number }
type Win = Window & { __ruzzaHero2Ready?: boolean; __ruzzaHero2Prog?: Hero2Prog }

export default function HeroSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!section || !canvas || !context) return
    const targetCanvas = canvas
    const targetContext = context

    const images = new Map<number, HTMLImageElement>()
    const settled = new Set<number>()
    const timers = new Map<number, number>()
    let loadedCount = 0
    let activeFrame = 1
    let lastDrawnFrame = 0
    let lastPreloadedFrame = 0
    let lastCanvasWidth = 0
    let lastCanvasHeight = 0

    // Su mobile/touch la RAM è limitata: tenere tutti i 135 frame 1080p decodificati
    // (~1 GB) faceva "andare in pappa" lo scroll (il browser sfrattava il resto della
    // pagina). Qui teniamo solo una finestra di frame attorno a quello corrente e
    // liberiamo gli altri — si ricaricano al volo dalla cache HTTP se torni indietro.
    const lowMem = window.matchMedia('(max-width: 899px), (hover: none), (pointer: coarse)').matches
    const KEEP_WINDOW = 12

    // Progresso REALE del 2° hero: ogni frame risolto (load O error O timeout) avanza il
    // contatore e lo segnala al LoadingScreen → la barra è "a tempo" e il loader non
    // sparisce finché l'orologio scomposto NON è davvero caricato.
    const win = window as Win
    const markSettled = (frame: number) => {
      if (settled.has(frame)) return
      settled.add(frame)
      const t = timers.get(frame)
      if (t) {
        window.clearTimeout(t)
        timers.delete(frame)
      }
      loadedCount += 1
      // La barra del loader si riempie sui primi READY_THRESHOLD frame; raggiunta la
      // soglia segnala "pronto" e smette (gli altri frame caricano silenziosi).
      if (loadedCount <= READY_THRESHOLD) {
        win.__ruzzaHero2Prog = { loaded: loadedCount, total: READY_THRESHOLD }
        window.dispatchEvent(
          new CustomEvent('ruzza:hero2-progress', { detail: { loaded: loadedCount, total: READY_THRESHOLD } }),
        )
        if (loadedCount >= READY_THRESHOLD) {
          win.__ruzzaHero2Ready = true
          window.dispatchEvent(new Event('ruzza:hero2-ready'))
        }
      }
    }

    const getImage = (frame: number) => {
      const cached = images.get(frame)
      if (cached) return cached

      const image = new Image()
      image.decoding = 'async'
      image.src = frameSrc(frame)
      image.onload = () => {
        if (frame === activeFrame) drawFrame(frame)
        markSettled(frame)
      }
      image.onerror = () => markSettled(frame)
      images.set(frame, image)
      timers.set(frame, window.setTimeout(() => markSettled(frame), FRAME_TIMEOUT_MS))
      return image
    }

    const preloadAround = (frame: number) => {
      if (Math.abs(frame - lastPreloadedFrame) < 3) return
      lastPreloadedFrame = frame
      for (let offset = -3; offset <= 8; offset += 1) {
        const next = Math.min(FRAME_COUNT, Math.max(1, frame + offset))
        getImage(next)
      }
    }

    // Mobile: libera dalla memoria i frame lontani dalla finestra corrente.
    const evictFar = (frame: number) => {
      if (!lowMem) return
      images.forEach((img, f) => {
        if (Math.abs(f - frame) > KEEP_WINDOW) {
          img.onload = null
          img.onerror = null
          img.src = ''
          images.delete(f)
          const t = timers.get(f)
          if (t) {
            window.clearTimeout(t)
            timers.delete(f)
          }
        }
      })
    }

    const sizeCanvas = () => {
      const rect = targetCanvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(rect.width * dpr))
      const height = Math.max(1, Math.round(rect.height * dpr))
      const changed = width !== lastCanvasWidth || height !== lastCanvasHeight

      if (changed) {
        targetCanvas.width = width
        targetCanvas.height = height
        lastCanvasWidth = width
        lastCanvasHeight = height
      }

      return changed
    }

    function drawFrame(frame: number) {
      const image = getImage(frame)
      if (!image.complete || !image.naturalWidth) return

      const resized = sizeCanvas()
      if (!resized && frame === lastDrawnFrame) return

      const canvasRatio = targetCanvas.width / targetCanvas.height
      const imageRatio = image.naturalWidth / image.naturalHeight
      let sourceX = 0
      let sourceY = 0
      let sourceWidth = image.naturalWidth
      let sourceHeight = image.naturalHeight

      if (imageRatio > canvasRatio) {
        sourceWidth = image.naturalHeight * canvasRatio
        sourceX = (image.naturalWidth - sourceWidth) / 2
      } else {
        sourceHeight = image.naturalWidth / canvasRatio
        sourceY = (image.naturalHeight - sourceHeight) / 2
      }

      targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
      targetContext.imageSmoothingEnabled = true
      targetContext.imageSmoothingQuality = 'high'
      targetContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetCanvas.width, targetCanvas.height)
      lastDrawnFrame = frame
    }

    const syncToScroll = () => {
      const rect = section.getBoundingClientRect()
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable))
      const frame = Math.min(FRAME_COUNT, Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1))
      activeFrame = frame
      drawFrame(frame)
      preloadAround(frame)
      evictFar(frame)

      if (railRef.current) {
        railRef.current.style.width = `${Math.max(8, progress * 100)}%`
      }
    }

    let raf = 0
    let active = false
    const loop = () => {
      if (!active) {
        raf = 0
        return
      }
      syncToScroll()
      raf = requestAnimationFrame(loop)
    }

    const startLoop = () => {
      active = true
      if (!raf) {
        raf = requestAnimationFrame(loop)
      }
    }

    const stopLoop = () => {
      active = false
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }

    // Prima carico solo i frame necessari per rendere fluido l'ingresso nel secondo
    // hero. Gli altri restano full-res ma partono a piccoli batch in background:
    // stessa qualita, meno contesa col video hero e loader piu rapido.
    for (let f = 1; f <= READY_THRESHOLD; f += 1) getImage(f)

    let backgroundFrame = READY_THRESHOLD + 1
    let backgroundTimer = 0
    const preloadBackgroundBatch = () => {
      let count = 0
      while (backgroundFrame <= FRAME_COUNT && count < BACKGROUND_BATCH_SIZE) {
        getImage(backgroundFrame)
        backgroundFrame += 1
        count += 1
      }
      if (backgroundFrame <= FRAME_COUNT) {
        backgroundTimer = window.setTimeout(preloadBackgroundBatch, BACKGROUND_BATCH_DELAY_MS)
      }
    }
    // Su mobile NON precarichiamo tutti i 135 frame (sarebbe la bomba di memoria):
    // arrivano on-demand con lo scroll, tramite preloadAround.
    if (!lowMem) backgroundTimer = window.setTimeout(preloadBackgroundBatch, 1500)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          startLoop()
          syncToScroll()
        } else {
          stopLoop()
        }
      },
      { rootMargin: '120% 0px' },
    )
    observer.observe(section)

    window.addEventListener('resize', syncToScroll)
    return () => {
      stopLoop()
      observer.disconnect()
      window.removeEventListener('resize', syncToScroll)
      if (backgroundTimer) window.clearTimeout(backgroundTimer)
      timers.forEach((t) => window.clearTimeout(t))
      timers.clear()
    }
  }, [])

  return (
    <section
      id="ruzza-watch-video"
      ref={sectionRef}
      aria-label="Ruzza Watch"
      className="relative w-full bg-ink"
      style={{ height: `${HERO_VH}vh` }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        <img
          src={frameSrc(1)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/35 via-transparent to-ink/78" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_78%_at_50%_45%,transparent_42%,rgba(10,11,12,0.68)_100%)]" />

        <div className="absolute bottom-12 left-1/2 w-44 -translate-x-1/2">
          <div ref={railRef} className="tick-rail" />
        </div>
      </div>
    </section>
  )
}
