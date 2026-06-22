import { useState, type FormEvent } from 'react'
import { Reveal } from './Reveal'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setDone(true)
  }

  return (
    <section className="marble-section marble-section-dark relative overflow-hidden bg-ink-900 py-[16vh]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[50vh] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(28,122,90,0.18),transparent_70%)]" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal delay={0.06}>
          <h2 className="chrome display text-[clamp(2.6rem,8vw,6.5rem)] leading-[1.02]">
            Entra nel Cerchio
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-7 max-w-xl font-sans text-[0.98rem] font-light leading-relaxed text-bone-muted">
            I pezzi più rari non arrivano mai a catalogo. Lascia la tua email e sarai tra i primi a
            riceverli — prima del mercato.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          {done ? (
            <p className="mx-auto mt-12 max-w-md font-display text-2xl italic text-bone">
              Benvenuto nel Cerchio. Ti scriveremo presto.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mx-auto mt-12 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <label htmlFor="nl-email" className="sr-only">
                La tua email
              </label>
              <input
                id="nl-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua@email.com"
                className="w-full flex-1 border border-bone/25 bg-transparent px-5 py-4 font-sans text-sm text-bone placeholder:text-bone-faint focus:border-malachite-bright focus:outline-none"
              />
              <button type="submit" className="btn-solid justify-center disabled:opacity-40" disabled={!valid}>
                Iscriviti
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
