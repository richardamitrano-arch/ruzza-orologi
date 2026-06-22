import { useEffect, useRef } from 'react'
import { mediaPath } from '../lib/routing'

export const HERO_VH = 650
const FRAME_COUNT = 135
// Scroll-scrubbed hero film — Picsart 4K export (16:9). The canvas cover-fits,
// so it fills desktop (16:9) and mobile (center-crop) cleanly, no bars.
const HERO_DIR = 'hero-picsart'
const frameSrc = (frame: number) => mediaPath(`/media/${HERO_DIR}/f_${String(frame).padStart(3, '0')}.jpg`)

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
    let activeFrame = 1
    let lastDrawnFrame = 0
    let lastPreloadedFrame = 0
    let lastCanvasWidth = 0
    let lastCanvasHeight = 0
    let playRaf = 0

    const getImage = (frame: number) => {
      const cached = images.get(frame)
      if (cached) return cached

      const image = new Image()
      image.decoding = 'async'
      image.src = frameSrc(frame)
      image.onload = () => {
        if (frame === activeFrame) {
          drawFrame(frame)
        }
      }
      images.set(frame, image)
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

    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    const cancelPlayback = () => {
      if (playRaf) {
        cancelAnimationFrame(playRaf)
        playRaf = 0
      }
    }

    const playFilm = () => {
      cancelPlayback()
      activeFrame = 1
      drawFrame(1)

      const startY = section.getBoundingClientRect().top + window.scrollY
      const endY = startY + Math.max(0, section.offsetHeight - window.innerHeight)
      const distance = endY - startY

      window.scrollTo({ top: startY, behavior: 'auto' })
      syncToScroll()

      if (distance <= 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const duration = window.innerWidth < 768 ? 7600 : 8600
      const started = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration)
        window.scrollTo(0, startY + distance * easeInOutCubic(progress))
        syncToScroll()
        if (progress < 1) {
          playRaf = requestAnimationFrame(step)
        } else {
          playRaf = 0
        }
      }
      playRaf = requestAnimationFrame(step)
    }

    const resetToStart = () => {
      cancelPlayback()
      activeFrame = 1
      drawFrame(1)
      syncToScroll()
    }

    getImage(1)
    preloadAround(1)
    drawFrame(1)
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
    window.addEventListener('ruzza:play-watch-film', playFilm)
    window.addEventListener('ruzza:reset-watch-film', resetToStart)
    window.addEventListener('wheel', cancelPlayback, { passive: true })
    window.addEventListener('touchstart', cancelPlayback, { passive: true })
    return () => {
      cancelPlayback()
      stopLoop()
      observer.disconnect()
      window.removeEventListener('resize', syncToScroll)
      window.removeEventListener('ruzza:play-watch-film', playFilm)
      window.removeEventListener('ruzza:reset-watch-film', resetToStart)
      window.removeEventListener('wheel', cancelPlayback)
      window.removeEventListener('touchstart', cancelPlayback)
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
          src={mediaPath(`/media/${HERO_DIR}/f_001.jpg`)}
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
