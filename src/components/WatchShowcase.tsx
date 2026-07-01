import { useMemo, useRef } from 'react'
import { sizedImage, imageSrcSet } from '../lib/img'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import {
  cleanProductTitle,
  formatCommercePrice,
  watchProducts,
  type CommerceProduct,
} from '../data/commerce'
import { productHref } from '../lib/routing'

type Pick = { tier: string; product: CommerceProduct }

/**
 * Trio del GIORNO: un orologio costoso, uno medio, uno accessibile — NON fissi,
 * ruotano ogni giorno nel catalogo (deterministico per data, stabile entro la
 * giornata). Così la vetrina "di punta" cambia ogni giorno da sé.
 */
function dailyTrio(products: CommerceProduct[]): Pick[] {
  const priced = products
    .filter((w) => !w.onRequest && w.price > 0 && w.featuredImage)
    .sort((a, b) => a.price - b.price)
  if (priced.length < 3) return priced.map((product) => ({ tier: '', product }))
  const third = Math.floor(priced.length / 3)
  // step grandi (e diversi per fascia) → ogni giorno salta a un orologio ben
  // diverso, spesso di un'altra maison, e nel tempo passa per tutto il catalogo.
  const bands: { tier: string; list: CommerceProduct[]; step: number }[] = [
    { tier: "L'icona", list: priced.slice(third * 2), step: 5 }, // costoso
    { tier: 'Il classico', list: priced.slice(third, third * 2), step: 8 }, // medio
    { tier: "L'accessibile", list: priced.slice(0, third), step: 11 }, // economico
  ]
  const day = Math.floor(Date.now() / 86_400_000)
  return bands.map(({ tier, list, step }) => ({
    tier,
    product: list[(((day * step) % list.length) + list.length) % list.length],
  }))
}

function Slide({
  prog,
  index,
  total,
  pick,
}: {
  prog: MotionValue<number>
  index: number
  total: number
  pick: Pick
}) {
  const seg = 1 / total
  const s = index * seg
  const e = (index + 1) * seg
  const first = index === 0
  const last = index === total - 1
  const { product, tier } = pick

  // Wipe-in da sinistra: la slide si svela coprendo la precedente (z crescente).
  const clip = useTransform(
    prog,
    first ? [0, 1] : [s - seg * 0.45, s - seg * 0.02],
    first ? ['inset(0 0 0 0)', 'inset(0 0 0 0)'] : ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
  )
  // Ken-Burns: zoom lento e continuo mentre la slide è in scena.
  const scale = useTransform(prog, [s - seg, e + seg * 0.3], [1.22, 1.04])
  // Il nome si rivela un attimo dopo l'immagine (wipe sinistra→destra).
  const nameClip = useTransform(
    prog,
    [s + seg * 0.06, s + seg * 0.34],
    ['inset(0 100% 0 0)', 'inset(0 0 0 0)'],
  )
  const textY = useTransform(prog, [s, s + seg * 0.22], [48, 0])
  const textOpacity = useTransform(
    prog,
    [s, s + seg * 0.14, e - seg * 0.04, e + seg * 0.02],
    last ? [0.25, 1, 1, 1] : [0.25, 1, 1, 0.2],
  )

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip, zIndex: index + 1 }}>
      <motion.img
        src={sizedImage(product.featuredImage, 1600)}
        srcSet={imageSrcSet(product.featuredImage, [800, 1200, 1600, 2000, 2560])}
        sizes="100vw"
        alt={product.altText || cleanProductTitle(product.title)}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ scale }}
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/55" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/85 via-transparent to-transparent" />

      <motion.div className="absolute inset-x-0 bottom-0" style={{ y: textY, opacity: textOpacity }}>
        <div className="mx-auto max-w-editorial px-6 pb-[15vh] md:px-10 md:pb-[13vh]">
          <p className="data mb-5 text-[0.7rem] uppercase tracking-[0.3em] text-malachite-bright">
            {tier ? `${tier} · ${product.brand}` : product.brand}
          </p>
          <motion.h3
            className="display text-bone text-[clamp(2.6rem,9vw,7rem)] leading-[0.9]"
            style={{ clipPath: nameClip }}
          >
            {cleanProductTitle(product.title)}
          </motion.h3>
          <div className="mt-7 flex flex-wrap items-center gap-6">
            <span className="data text-[clamp(1.05rem,2vw,1.45rem)] text-champagne">
              {formatCommercePrice(product)}
            </span>
            <a href={productHref(product.handle)} className="btn-line">
              Scopri il segnatempo
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Tick({ prog, index, total }: { prog: MotionValue<number>; index: number; total: number }) {
  const seg = 1 / total
  const fill = useTransform(prog, [index * seg, (index + 0.5) * seg], ['10%', '100%'])
  const opacity = useTransform(
    prog,
    [index * seg - 0.02, index * seg + 0.02, (index + 1) * seg - 0.02, (index + 1) * seg + 0.02],
    [0.35, 1, 1, index === total - 1 ? 1 : 0.35],
  )
  return (
    <div className="h-px w-10 overflow-hidden bg-bone/20">
      <motion.div className="h-full bg-malachite-bright" style={{ width: fill, opacity }} />
    </div>
  )
}

export default function WatchShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const trio = useMemo(() => dailyTrio(watchProducts), [watchProducts])
  const total = trio.length
  if (!total) return null

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  // Senza animazione: griglia statica delle tre selezioni del giorno.
  if (reduce) {
    return (
      <section id="selezione-giorno" className="bg-ink py-[12vh]">
        <div className="mx-auto max-w-editorial px-6 md:px-10">
          <p className="label mb-3 text-malachite-bright">La selezione del giorno</p>
          <h2 className="chrome display mb-12 text-[clamp(2.2rem,7vw,5rem)]">Tre icone, oggi</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {trio.map(({ tier, product }) => (
              <a key={product.id} href={productHref(product.handle)} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
                  <img
                    src={sizedImage(product.featuredImage, 700)}
                    srcSet={imageSrcSet(product.featuredImage, [400, 600, 800, 1000])}
                    sizes="(max-width: 768px) 90vw, 33vw"
                    alt={product.altText || cleanProductTitle(product.title)}
                    className="h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <p className="data mt-4 text-[0.7rem] uppercase tracking-[0.28em] text-malachite-bright">
                  {tier ? `${tier} · ${product.brand}` : product.brand}
                </p>
                <h3 className="font-display text-2xl text-bone">{cleanProductTitle(product.title)}</h3>
                <p className="data mt-1 text-champagne">{formatCommercePrice(product)}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="selezione-giorno" ref={ref} className="relative bg-ink" style={{ height: `${total * 120}vh` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        {trio.map((pick, i) => (
          <Slide key={pick.product.id} prog={scrollYProgress} index={i} total={total} pick={pick} />
        ))}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
          <div className="mx-auto max-w-editorial px-6 pt-[13vh] md:px-10">
            <p className="label text-malachite-bright">La selezione del giorno</p>
            <p className="data mt-2 text-[0.7rem] uppercase tracking-[0.26em] capitalize text-bone-faint">
              {today}
            </p>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          {trio.map((pick, i) => (
            <Tick key={pick.product.id} prog={scrollYProgress} index={i} total={total} />
          ))}
        </div>
      </div>
    </section>
  )
}
