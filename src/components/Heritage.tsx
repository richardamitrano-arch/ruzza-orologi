import { motion } from 'framer-motion'
import { useParallax } from '../lib/useParallax'
import { Reveal } from './Reveal'

const pillars = [
  {
    t: 'Autenticità certificata',
    d: 'Ogni esemplare è verificato prima della vendita. Certificati Chrono24 dal 2017, a garanzia di originalità e condizioni.',
  },
  {
    t: 'Selezione, non catalogo',
    d: 'Non vendiamo tutto. Scegliamo i riferimenti che hanno senso collezionistico — full set, dial rari, condizioni eccezionali.',
  },
  {
    t: 'Assistenza senza pari',
    d: 'Controllo qualità pre-vendita e servizio post-vendita dedicato. Un rapporto, non una transazione.',
  },
]

export default function Heritage() {
  const head = useParallax(50)
  return (
    <section id="maison" className="relative bg-ink-800 py-[14vh]">
      <div className="mx-auto max-w-editorial px-6 md:px-10">
        <div ref={head.ref} className="mx-auto max-w-3xl text-center">
          <motion.div style={{ y: head.y }}>
            <Reveal delay={0.06}>
              <h2 className="display text-bone text-[clamp(2.4rem,5.8vw,4.6rem)] leading-[1.04]">
                Da una bottega milanese
                <br />
                <span className="italic text-malachite-bright">a un punto di riferimento.</span>
              </h2>
            </Reveal>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-20">
          <Reveal delay={0.06}>
            <p className="font-sans text-[0.98rem] font-light leading-relaxed text-bone-muted">
              Lorenzo Ruzza apre nel 2017 una piccola boutique nel centro di Milano. In pochi anni, la
              cura maniacale per l'autenticità e per il cliente trasforma Ruzza Orologi in uno dei nomi
              più riconosciuti del mercato dell'alta orologeria di lusso in Italia.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] italic leading-snug text-bone">
              “Compriamo e vendiamo solo ciò di cui ci fideremmo noi stessi.”
            </p>
          </Reveal>
        </div>

        <div className="mt-[10vh] grid gap-px overflow-hidden border border-white/10 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08} className="bg-ink-800">
              <div className="h-full p-10">
                <div className="tick-rail w-16 opacity-60" />
                <h3 className="mt-7 font-display text-2xl text-bone">{p.t}</h3>
                <p className="mt-4 font-sans text-sm font-light leading-relaxed text-bone-muted">
                  {p.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
