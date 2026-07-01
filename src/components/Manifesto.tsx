import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { watchProducts } from '../data/commerce'
import { sizedImage, imageSrcSet } from '../lib/img'

type Beat = { k: string; a: string; b: string; body?: string }
const BEATS: Beat[] = [
  { k: '', a: 'Il tempo non si possiede.', b: 'Si custodisce.' },
  { k: '', a: 'Ogni orologio ha vissuto', b: 'una vita prima di te.' },
  {
    k: '',
    a: 'A Milano, custodiamo',
    b: 'il valore del tempo.',
  },
]

const BACKDROP_POSITIONS = ['52% 45%', '50% 52%', '48% 45%']

function BeatLayer({
  prog,
  index,
  total,
  beat,
}: {
  prog: MotionValue<number>
  index: number
  total: number
  beat: Beat
}) {
  const seg = 1 / total
  const s = index * seg
  const e = (index + 1) * seg
  const last = index === total - 1
  const opacity = useTransform(
    prog,
    last ? [s - 0.05, s + 0.07, 1] : [s - 0.02, s + 0.07, e - 0.05, e + 0.01],
    last ? [0, 1, 1] : [0, 1, 1, 0],
  )
  const y = useTransform(prog, [s, s + 0.12], [44, 0])

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      style={{ opacity }}
    >
      {beat.k && (
        <motion.p className="label mb-8 text-malachite-bright" style={{ y }}>
          {beat.k}
        </motion.p>
      )}
      <motion.p
        className="display text-bone text-[clamp(2rem,5.5vw,4.8rem)] leading-[1.08]"
        style={{ y }}
      >
        {beat.a}
        <br />
        <span className="italic text-malachite-bright">{beat.b}</span>
      </motion.p>
      {beat.body && (
        <motion.p
          className="mx-auto mt-10 max-w-md font-sans text-[0.95rem] font-light leading-relaxed text-bone-muted"
          style={{ y }}
        >
          {beat.body}
        </motion.p>
      )}
    </motion.div>
  )
}

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.18, 1.32])
  const railWidth = useTransform(scrollYProgress, [0, 1], ['8%', '100%'])
  const highValueBackdrop = watchProducts
    .filter((watch) => watch.price >= 500000 && watch.featuredImage)
    .sort((a, b) => b.price - a.price)
    .slice(0, 3)

  return (
    <section ref={ref} className="relative bg-ink" style={{ height: '300vh' }}>
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-45 blur-[1.5px] saturate-[0.82]"
          style={{ y: bgY, scale: bgScale }}
        >
          <div className="absolute inset-0 grid grid-cols-3">
            {highValueBackdrop.map((watch, index) => (
              <div key={watch.id} className="relative overflow-hidden border-x border-white/[0.03]">
                <img
                  src={sizedImage(watch.featuredImage, 500)}
                  srcSet={imageSrcSet(watch.featuredImage, [300, 500, 700])}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: BACKDROP_POSITIONS[index] }}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-ink/30" />
              </div>
            ))}
          </div>
        </motion.div>
        <div className="absolute inset-0 bg-ink/74" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_62%_at_50%_48%,rgba(10,11,12,0.22),rgba(10,11,12,0.84)_72%,rgba(10,11,12,0.96)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" />

        {BEATS.map((beat, i) => (
          <BeatLayer key={i} prog={scrollYProgress} index={i} total={BEATS.length} beat={beat} />
        ))}

        <div className="absolute bottom-12 left-1/2 w-40 -translate-x-1/2">
          <motion.div className="tick-rail" style={{ width: railWidth }} />
        </div>
      </div>
    </section>
  )
}
