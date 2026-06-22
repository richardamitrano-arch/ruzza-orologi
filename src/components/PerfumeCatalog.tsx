const PRESTIGE = 'https://ruzzawatch.com/pages/lorenzo-ruzza-prestigious'

const heroBottles = [
  {
    name: 'Turchese',
    tone: 'g-turchese',
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/azzurro.png?v=1781708034',
  },
  {
    name: 'Lapislazzuli',
    tone: 'g-lapis',
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/lapis.png?v=1781708036',
  },
  {
    name: 'Onice',
    tone: 'g-onice',
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/black.png?v=1781708038',
  },
]

const fragrances = [
  {
    name: 'Turchese',
    title: 'Prestigious Turchese',
    tone: 't-turchese',
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/prestigious-turchese.png?v=1781623366',
    notes: [
      ['Testa', 'Incenso, limone, lampone, zenzero'],
      ['Cuore', 'Rosa, vaniglia, caramello, amyris'],
      ['Fondo', 'Ambra grigia, cuoio, oud, patchouli, cypriol'],
    ],
  },
  {
    name: 'Lapislazzuli',
    title: 'Prestigious Lapislazzuli',
    tone: 't-lapis',
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/prestigious-lapislazzuli.png?v=1781623365',
    notes: [
      ['Testa', 'Bergamotto, pepe rosa, arancio dolce, zafferano'],
      ['Cuore', 'Patchouli, oud, rosa bulgara, cuoio, lavanda'],
      ['Fondo', 'Ambra grigia, sandalo, legno di cedro'],
    ],
  },
  {
    name: 'Onice',
    title: 'Prestigious Onice',
    tone: 't-onice',
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/prestigious-onice.png?v=1781623365',
    notes: [
      ['Testa', 'Limone, bergamotto'],
      ['Cuore', 'Fiori bianchi, fiori freschi, rosa, violetta, caramello'],
      ['Fondo', 'Ambra grigia, muschio di quercia, sandalo, cuoio, cashmere'],
    ],
  },
]

const showcases = [
  {
    name: 'Turchese',
    title: 'Luminoso e solare',
    text: 'Agrumi, frutta e fondo ambrato: il quadrante turchese porta una firma fresca, calda, mediterranea.',
    tags: ['Limone', 'Lampone', 'Vaniglia', 'Oud', 'Ambra grigia'],
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/elixir_turchese.png?v=1781708521',
  },
  {
    name: 'Lapislazzuli',
    title: 'Intenso e speziato',
    text: 'Zafferano, pepe rosa, oud e rosa bulgara disegnano una scia profonda, elegante, magnetica.',
    tags: ['Bergamotto', 'Zafferano', 'Oud', 'Rosa bulgara', 'Sandalo'],
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/elixir_lapislazzuli.png?v=1781708522',
    reverse: true,
  },
  {
    name: 'Onice',
    title: 'Elegante e avvolgente',
    text: 'Fiori bianchi, rosa e violetta si appoggiano su muschio, cuoio e legni: total black, firma sofisticata.',
    tags: ['Bergamotto', 'Fiori bianchi', 'Violetta', 'Cuoio', 'Cashmere'],
    image: 'https://cdn.shopify.com/s/files/1/0913/7137/2884/files/elixir_onice.png?v=1781708567',
  },
]

const steps = [
  ['I', 'Compila il modulo', 'Inserisci i dati e l’indirizzo dove vuoi ricevere i campioni.'],
  ['II', 'Prepariamo il cofanetto', 'I tre campioncini Prestigious vengono confezionati e affidati al corriere.'],
  ['III', 'Li provi a casa', 'Indossali, lasciali evolvere e scegli quale firma senti più tua.'],
]

export default function PerfumeCatalog() {
  return (
    <section id="profumi" className="lrx lrx-lit">
      <div className="lrx-canvas" aria-hidden="true" />
      <div className="lrx-orb o1" aria-hidden="true" />
      <div className="lrx-orb o2" aria-hidden="true" />
      <div className="lrx-orb o3" aria-hidden="true" />

      <div className="lrx-hero">
        <div className="lrx-wrap">
          <p className="lrx-eyebrow lrx-rev lrx-in">Dal 1 luglio - Collezione Prestigious</p>
          <p className="lrx-brand lrx-rev lrx-in">Lorenzo Ruzza</p>
          <h2 className="lrx-serif">
            <span className="lrx-word">Tre</span> <span className="lrx-word">profumi.</span>
            <br />
            <em>Provali gratis.</em>
          </h2>
          <p className="lrx-lead lrx-rev lrx-in">
            Tre Elixir Prestigious: <strong>Turchese</strong>, <strong>Lapislazzuli</strong> e <strong>Onice</strong>.
            Un set campione, spedizione inclusa, senza obbligo d’acquisto.
          </p>
          <div className="lrx-trust lrx-rev lrx-in">
            <span className="lrx-chip">✓ Spedizione inclusa</span>
            <span className="lrx-chip">✓ 3 fragranze nel set</span>
            <span className="lrx-chip">✓ Nessun obbligo d’acquisto</span>
          </div>

          <div className="lrx-trio lrx-rev lrx-in">
            {heroBottles.map((bottle) => (
              <a key={bottle.name} href={PRESTIGE} target="_blank" rel="noreferrer" className={`lrx-trio-item ${bottle.tone}`}>
                <span className="lrx-trio-glow" />
                <img src={bottle.image} alt={`Prestigious ${bottle.name}`} loading="lazy" decoding="async" />
                <span className="lrx-trio-label">{bottle.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="lrx-manifesto">
        <div className="lrx-wrap">
          <p className="lrx-rev lrx-in">
            Ci sono profumi che si indossano, e profumi che <em>si raccontano</em>. Prestigious nasce come flacone da custodire,
            fragranza da riconoscere, oggetto da esporre.
          </p>
          <div className="lrx-rule lrx-rev lrx-in" />
        </div>
      </div>

      <div className="lrx-section">
        <div className="lrx-wrap">
          <div className="lrx-sec-head lrx-rev lrx-in">
            <p className="lrx-eyebrow">La collezione</p>
            <h2 className="lrx-serif">Tre caratteri, <em>un’unica firma</em></h2>
            <p>Tre interpretazioni della stessa visione, custodite in un flacone che cita l’orologeria di lusso.</p>
          </div>

          <div className="lrx-grid">
            {fragrances.map((fragrance) => (
              <a key={fragrance.name} href={PRESTIGE} target="_blank" rel="noreferrer" className="lrx-card lrx-rev lrx-in">
                <div className={`lrx-card-top ${fragrance.tone}`}>
                  <span className="lrx-halo" />
                  <img src={fragrance.image} alt={fragrance.title} loading="lazy" decoding="async" />
                </div>
                <div className="lrx-card-body">
                  <p className="lrx-variant">{fragrance.name}</p>
                  <h3 className="lrx-serif">{fragrance.title}</h3>
                  <div className="lrx-notes">
                    {fragrance.notes.map(([label, value]) => (
                      <div key={label} className="lrx-note-row">
                        <span className="lrx-note-lbl">{label}</span>
                        <span className="lrx-note-val">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="lrx-section lrx-cofanetto">
        <div className="lrx-wrap">
          <div className="lrx-sec-head lrx-rev lrx-in">
            <p className="lrx-eyebrow">Il cofanetto</p>
            <h2 className="lrx-serif">Tre pietre, <em>tre anime</em></h2>
            <p>Ogni Elixir riposa in un astuccio coordinato: prima pezzo da esposizione, poi firma sulla pelle.</p>
          </div>

          <div className="lrx-showcase">
            {showcases.map((item) => (
              <div key={item.name} className={`lrx-show-row lrx-rev lrx-in ${item.reverse ? 'rev' : ''}`}>
                <div className="lrx-show-media">
                  <img src={item.image} alt={`Lorenzo Ruzza Prestigious ${item.name} - astuccio e flacone`} loading="lazy" decoding="async" />
                </div>
                <div className="lrx-show-text">
                  <p className="lrx-variant">{item.name}</p>
                  <h3 className="lrx-serif">{item.title}</h3>
                  <p>{item.text}</p>
                  <div className="lrx-show-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="lrx-show-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lrx-quote">
        <div className="lrx-wrap">
          <div className="lrx-quote-inner lrx-rev lrx-in">
            <div className="lrx-mark">“</div>
            <p className="lrx-serif">Tre creazioni, un solo invito: lascia che siano loro a parlarti.</p>
            <div className="lrx-sign">Lorenzo Ruzza - Collezione Prestigious</div>
            <div className="lrx-divider" />
          </div>
        </div>
      </div>

      <div className="lrx-section lrx-how">
        <div className="lrx-wrap">
          <div className="lrx-sec-head lrx-rev lrx-in">
            <p className="lrx-eyebrow">Semplice</p>
            <h2 className="lrx-serif">Come ricevere <em>il tuo set</em></h2>
          </div>
          <div className="lrx-steps">
            {steps.map(([num, title, text]) => (
              <div key={num} className="lrx-step lrx-rev lrx-in">
                <div className="lrx-num">{num}</div>
                <h4>{title}</h4>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lrx-closer">
        <div className="lrx-wrap">
          <p className="lrx-eyebrow lrx-rev lrx-in">Ultimo passo</p>
          <h2 className="lrx-serif lrx-rev lrx-in">
            Dove te li <em>spediamo?</em>
          </h2>
          <p className="lrx-rev lrx-in">Apri la pagina Prestigious e completa la richiesta: i campioni viaggiano gratis fino alla tua porta.</p>
          <a href={PRESTIGE} target="_blank" rel="noreferrer" className="lrx-cta lrx-rev lrx-in">
            Richiedi i campioni
          </a>
        </div>
      </div>
    </section>
  )
}
