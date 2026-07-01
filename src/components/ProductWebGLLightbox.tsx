import { useEffect, useMemo, useRef } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { imageSrcSet, sizedImage } from '../lib/img'
import type { CommerceProduct } from '../data/commerce'

type GalleryImage = CommerceProduct['images'][number]

type ProductWebGLLightboxProps = {
  images: GalleryImage[]
  selectedIndex: number
  title: string
  eyebrow: string
  onClose: () => void
  onSelect: (index: number) => void
}

function clampIndex(index: number, length: number) {
  if (!length) return 0
  return Math.min(Math.max(index, 0), length - 1)
}

function GallerySlide({
  image,
  index,
  total,
  progress,
  title,
}: {
  image: GalleryImage
  index: number
  total: number
  progress: MotionValue<number>
  title: string
}) {
  const lastIndex = Math.max(total - 1, 1)
  const point = index / lastIndex
  const previousPoint = Math.max(0, (index - 1) / lastIndex)
  const nextPoint = Math.min(1, (index + 1) / lastIndex)

  const clipPath = useTransform(
    progress,
    index === 0 ? [0, 1] : [previousPoint, point],
    index === 0 ? ['inset(0 0 0 0)', 'inset(0 0 0 0)'] : ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
  )
  const scale = useTransform(progress, [previousPoint, point, nextPoint], [1.13, 1.035, 1.01])
  const x = useTransform(progress, [previousPoint, point, nextPoint], ['5%', '0%', '-3%'])
  const opacity = useTransform(
    progress,
    [Math.max(0, point - 0.08), point, Math.min(1, point + 0.18)],
    index === total - 1 ? [0.9, 1, 1] : [0.9, 1, 0.92],
  )

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden bg-ink"
      style={{
        clipPath,
        zIndex: index + 1,
        backgroundImage: image.src ? `url(${sizedImage(image.src, 120)})` : undefined,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
      data-product-scroll-slide={index + 1}
    >
      <motion.img
        src={sizedImage(image.src, 2200)}
        srcSet={imageSrcSet(image.src, [900, 1400, 1800, 2200, 2600])}
        sizes="100vw"
        alt={image.alt || title}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ scale, x, opacity }}
        loading="eager"
        decoding="async"
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/34 via-transparent to-ink/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/34 via-transparent to-transparent" />
    </motion.div>
  )
}

function GalleryTick({ progress, index, total }: { progress: MotionValue<number>; index: number; total: number }) {
  const lastIndex = Math.max(total - 1, 1)
  const point = index / lastIndex
  const previousPoint = Math.max(0, (index - 1) / lastIndex)
  const nextPoint = Math.min(1, (index + 1) / lastIndex)
  const width = useTransform(progress, [previousPoint, point], ['10%', '100%'])
  const opacity = useTransform(progress, [previousPoint, point, nextPoint], [0.32, 1, index === total - 1 ? 1 : 0.34])

  return (
    <div className="h-px min-w-8 flex-1 overflow-hidden bg-bone/18">
      <motion.div className="h-full bg-champagne" style={{ width, opacity }} />
    </div>
  )
}

export default function ProductWebGLLightbox({
  images,
  selectedIndex,
  title,
  eyebrow,
  onClose,
  onSelect,
}: ProductWebGLLightboxProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const total = images.length
  const imageKey = useMemo(() => images.map((image) => image.src).join('|'), [images])
  const { scrollYProgress } = useScroll({ container: scrollRef })
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.04, 0.18, 0.76, 1], [1, 1, 0.72, 0.42, 0])
  const scrollHintY = useTransform(scrollYProgress, [0, 0.18, 1], [0, -8, -12])

  function scrollToImage(index: number, behavior: ScrollBehavior = 'smooth') {
    const scroller = scrollRef.current
    if (!scroller || total < 2) {
      onSelect(clampIndex(index, total))
      return
    }
    const nextIndex = clampIndex(index, total)
    const maxScroll = scroller.scrollHeight - scroller.clientHeight
    onSelect(nextIndex)
    scroller.scrollTo({
      top: maxScroll * (nextIndex / Math.max(total - 1, 1)),
      behavior,
    })
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => scrollToImage(selectedIndex, 'auto'))
    return () => window.cancelAnimationFrame(frame)
  }, [imageKey])

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (total < 2) return
    const nextIndex = clampIndex(Math.round(value * (total - 1)), total)
    if (nextIndex !== selectedIndex) onSelect(nextIndex)
  })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        scrollToImage(selectedIndex + 1)
      }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        scrollToImage(selectedIndex - 1)
      }
      if (event.key === 'Home') {
        event.preventDefault()
        scrollToImage(0)
      }
      if (event.key === 'End') {
        event.preventDefault()
        scrollToImage(total - 1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedIndex, total])

  if (reduce) {
    return (
      <div className="fixed inset-0 z-[90] overflow-y-auto bg-ink" data-product-lightbox data-product-scroll-lightbox>
        <div className="sticky top-0 z-20 flex items-start justify-between gap-5 px-5 py-5 md:px-10 md:py-8">
          <div className="pointer-events-none max-w-[62rem]">
            <p className="label text-malachite-bright">{eyebrow}</p>
            <p className="mt-2 font-display text-[clamp(1.45rem,4vw,3.8rem)] leading-none text-bone">{title}</p>
          </div>
          <button
            type="button"
            className="grid h-11 w-11 shrink-0 place-items-center border border-white/20 bg-ink/55 font-sans text-2xl leading-none text-bone backdrop-blur-md transition-colors hover:border-champagne hover:text-champagne"
            onClick={onClose}
            aria-label="Chiudi galleria"
            data-product-lightbox-close
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="grid gap-3 px-4 pb-8 md:px-8">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              className="overflow-hidden bg-ink-800"
              onClick={() => onSelect(index)}
              data-product-scroll-slide={index + 1}
            >
              <img
                src={sizedImage(image.src, 1600)}
                srcSet={imageSrcSet(image.src, [800, 1200, 1600, 2200])}
                sizes="100vw"
                alt={image.alt || title}
                className="h-auto w-full"
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="fixed inset-0 z-[90] overflow-y-auto overscroll-contain bg-ink [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-product-lightbox
      data-product-scroll-lightbox
      data-product-lightbox-stage
    >
      <div className="relative" style={{ height: `${Math.max(total, 1) * 112}svh` }}>
        <div className="sticky top-0 h-[100svh] overflow-hidden bg-ink">
          {images.map((image, index) => (
            <GallerySlide
              key={image.src}
              image={image}
              index={index}
              total={total}
              progress={scrollYProgress}
              title={title}
            />
          ))}

          {total > 1 && (
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-[7.4rem] z-30 flex justify-center px-5 md:bottom-[8.8rem]"
              style={{ opacity: scrollHintOpacity, y: scrollHintY }}
              data-product-scroll-hint
            >
              <div className="inline-flex items-center gap-3 border border-white/14 bg-ink/42 px-3.5 py-2 text-bone-muted backdrop-blur-md">
                <span className="data text-[0.58rem] uppercase tracking-[0.18em] text-bone">Scroll in basso</span>
                <span className="relative h-5 w-px overflow-hidden bg-bone/20" aria-hidden="true">
                  <motion.span
                    className="absolute left-0 top-0 h-2 w-px bg-champagne"
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </span>
                <span className="hidden text-[0.68rem] text-bone-faint sm:inline">per cambiare foto</span>
              </div>
            </motion.div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
            <div className="flex items-start justify-between gap-5 px-5 py-5 md:px-10 md:py-8">
              <div className="max-w-[62rem]">
                <p className="label text-malachite-bright">{eyebrow}</p>
                <p className="mt-2 font-display text-[clamp(1.45rem,4vw,3.8rem)] leading-none text-bone">{title}</p>
              </div>
              <button
                type="button"
                className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center border border-white/20 bg-ink/55 font-sans text-2xl leading-none text-bone backdrop-blur-md transition-colors hover:border-champagne hover:text-champagne"
                onClick={onClose}
                aria-label="Chiudi galleria"
                data-product-lightbox-close
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-30 px-5 pb-5 md:px-10 md:pb-8">
            <div className="mx-auto max-w-editorial">
              <div className="mb-4 flex items-center gap-3">
                <p className="data min-w-12 text-[0.62rem] uppercase tracking-[0.18em] text-bone-faint">
                  {String(selectedIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </p>
                <div className="flex flex-1 gap-2">
                  {images.map((image, index) => (
                    <GalleryTick key={image.src} progress={scrollYProgress} index={index} total={total} />
                  ))}
                </div>
              </div>

              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-product-lightbox-filmstrip>
                {images.map((image, index) => {
                  const selected = index === selectedIndex
                  return (
                    <button
                      key={image.src}
                      type="button"
                      className={`relative h-16 w-12 shrink-0 snap-start overflow-hidden border bg-ink-800 transition-colors md:h-20 md:w-16 ${
                        selected ? 'border-champagne' : 'border-white/10 hover:border-bone-muted'
                      }`}
                      onClick={() => scrollToImage(index)}
                      aria-label={`Mostra immagine ${index + 1} di ${total}`}
                      aria-pressed={selected}
                      data-product-lightbox-thumb={index + 1}
                    >
                      <img
                        src={sizedImage(image.src, 180)}
                        sizes="80px"
                        alt=""
                        className={`h-full w-full object-cover transition duration-500 ${selected ? 'opacity-100' : 'opacity-52 hover:opacity-100'}`}
                        loading={index < 5 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
