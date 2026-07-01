import { Reveal } from './Reveal'
import { EMAIL, VALUATION_FORM, VALUATION_WHATSAPP } from '../lib/contact'

export default function Valuation() {
  return (
    <section id="valutazione" className="relative overflow-hidden bg-ink py-[16vh]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh] bg-[radial-gradient(80%_100%_at_50%_120%,rgba(28,122,90,0.22),transparent_70%)]" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <Reveal delay={0.06}>
          <h2 className="chrome display text-[clamp(2.6rem,7vw,6rem)] leading-[1.02]">
            Quanto vale
            <br />
            <span className="italic">il tuo orologio?</span>
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-8 max-w-xl font-sans text-[0.98rem] font-light leading-relaxed text-bone-muted">
            Valutazione gratuita e senza impegno. Inviaci numero seriale, anno
            d'acquisto, condizioni e corredo: ti rispondiamo con una proposta
            riservata, di norma in giornata.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href={VALUATION_WHATSAPP} target="_blank" rel="noreferrer" className="btn-solid">
              Scrivici su WhatsApp
            </a>
            <a href={VALUATION_FORM} target="_blank" rel="noreferrer" className="btn-line">
              Compila il modulo
            </a>
            <a href={`mailto:${EMAIL}?subject=Valutazione%20orologio`} className="btn-line">
              Scrivici via email
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
