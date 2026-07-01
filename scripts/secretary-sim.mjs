// Simulatore Segretaria WhatsApp Ruzza — prova il cervello con conversazioni reali, SENZA WhatsApp.
// Uso:  ANTHROPIC_API_KEY=sk-... node scripts/secretary-sim.mjs
//       (catalogo letto dal vivo dal sito di test; override con RUZZA_BASE=...)
import { selectCatalog } from '../functions/_secretary/brain.js'
import { handleMessage } from '../functions/_secretary/pipeline.js'
import { getChannelById, shouldKeepProductForChannel } from '../functions/_secretary/channels.js'

const BASE = process.env.RUZZA_BASE || 'https://ruzza-test.megwebstudio.com'
const KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.SECRETARY_MODEL || 'claude-sonnet-5'

if (!KEY) {
  console.error('\n  Manca ANTHROPIC_API_KEY. Mettila in ambiente e rilancia:')
  console.error('  ANTHROPIC_API_KEY=sk-ant-... node scripts/secretary-sim.mjs\n')
  process.exit(2)
}

async function loadCatalog(channel) {
  const out = []
  for (const store of channel.stores || ['orologi', 'ruzza-watch']) {
    for (let page = 1; page <= 6; page++) {
      const r = await fetch(`${BASE}/api/shopify-products?store=${store}&limit=250&page=${page}`)
      if (!r.ok) break
      const j = await r.json(); const a = j.products || []
      for (const p of a) {
        const v = (p.variants || [])[0] || {}
        out.push({
          title: p.title,
          brand: p.vendor || '',
          category: p.product_type || store,
          productType: p.product_type || '',
          tags: Array.isArray(p.tags) ? p.tags.join(' ') : p.tags || '',
          price: v.price != null ? String(v.price).replace(/\.00$/, '') : null,
          available: (p.variants || []).some((x) => x.available),
          handle: p.handle,
        })
      }
      if (a.length < 250) break
    }
  }
  return out.filter((product) => shouldKeepProductForChannel(product, channel))
}

// Conversazioni di prova + verifiche attese (il cuore della prova del 100%).
const CASES = [
  {
    name: 'Orologi — info prodotto (deve usare il catalogo, niente invenzioni)',
    channelId: 'orologi',
    state: 'AI_ATTIVA',
    message: 'Buonasera, avete il Rolex Daytona? Quanto costa?',
    check: (r, cat) => {
      const hit = selectCatalog('Rolex Daytona', cat)[0]
      const ok = r.intent === 'info_prodotto' || r.intent === 'acquisto' || r.intent === 'disponibilita'
      return { pass: ok && r.reply.length > 0, note: hit ? `catalogo: ${hit.title} € ${hit.price}` : 'nessun Daytona a catalogo' }
    },
  },
  {
    name: 'Orologi — richiesta SCONTO (deve rifiutare, niente sconti)',
    channelId: 'orologi',
    state: 'AI_ATTIVA',
    message: 'Mi fate uno sconto sul Submariner? Quanto mi lasciate?',
    check: (r) => {
      const gaveDiscount = /\b(sconto del|ti faccio|ti lascio|posso fare)\b.*\d/i.test(r.reply)
      return { pass: !gaveDiscount, note: gaveDiscount ? 'HA OFFERTO SCONTO' : 'nessuno sconto offerto' }
    },
  },
  {
    name: 'Luxury — VALUTAZIONE vendita (deve passare a umano, niente stime)',
    channelId: 'luxury',
    state: 'AI_ATTIVA',
    message: 'Vorrei vendervi il mio Patek Nautilus, quanto vale? quanto mi date?',
    check: (r) => {
      const estimated = /€\s?\d{3,}|\b\d{4,}\s?euro/i.test(r.reply)
      return { pass: r.needs_human === true && !estimated, note: `needs_human=${r.needs_human} intent=${r.intent}${estimated ? ' — HA STIMATO UN PREZZO!' : ''}` }
    },
  },
  {
    name: 'Orologi — appuntamento in showroom',
    channelId: 'orologi',
    state: 'AI_ATTIVA',
    message: 'Posso passare domani pomeriggio a vedere un Nautilus? Mi chiamo Marco, 333 1234567',
    check: (r) => {
      const callsPhone = /\b(la|lo|ti)\s*(richiam|richiamer|richiameremo|richiamiamo)|\brichiamar|per telefono|telefonicament|al telefono|contatter\w*\s+al\s+numero|ricontatt\w*/i.test(r.reply)
      const lorenzoApp = /appuntament\w*\s+con\s+lorenzo|incontr\w*\s+con\s+lorenzo/i.test(r.reply)
      return { pass: r.reply.length > 0 && (r.lead?.name || '').toLowerCase().includes('marco') && !callsPhone && !lorenzoApp, note: `phoneCall=${callsPhone} lorenzoApp=${lorenzoApp} state=${r.state}` }
    },
  },
  {
    name: 'Orologi — stato UMANO_IN_CARICO (deve restare muta)',
    channelId: 'orologi',
    state: 'UMANO_IN_CARICO',
    message: 'Allora ci vediamo domani alle 15',
    check: (r) => ({ pass: r.reply === '' && r.state === 'UMANO_IN_CARICO', note: `reply="${r.reply}"` }),
  },
  {
    name: 'Borse — spedizione (prudente, no promesse operative)',
    channelId: 'borse',
    state: 'AI_ATTIVA',
    message: 'La Kelly la spedite a Roma? Quanto costa la spedizione e quando arriva?',
    check: (r) => {
      const unsafe = /gratis|gratuita|24\/?48|domani|garantit|costa\s+€?\s*\d/i.test(r.reply)
      return { pass: r.reply.length > 0 && !unsafe, note: unsafe ? 'promessa operativa rischiosa' : 'spedizione gestita con policy prudente' }
    },
  },
  {
    name: 'Prezzo senza prodotto (chiede quale modello, non inventa)',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Quanto costa?',
    check: (r) => ({ pass: r.reply.length > 0 && !/€\s?\d{3,}/.test(r.reply), note: r.reply.slice(0, 90) }),
  },
  {
    name: 'Pagamento rate/Bitcoin/PayPal (niente conferme, niente link)',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Posso pagare a rate? Accettate Bitcoin o PayPal?',
    check: (r) => {
      const confirms = /\b(accettiamo|sì,?\s*(certo|puoi|può)|nessun problema)\b[^.]{0,30}\b(rate|bitcoin|paypal|cripto)/i.test(r.reply)
      const link = /https?:\/\/|link di pagamento/i.test(r.reply)
      return { pass: r.reply.length > 0 && !confirms && !link, note: confirms || link ? 'HA CONFERMATO/LINK' : 'prudente, rimanda al team' }
    },
  },
  {
    name: 'Spedizione gratis + consegna garantita domani (NON promettere)',
    channelId: 'borse', state: 'AI_ATTIVA',
    message: 'Me la spedite gratis oggi con consegna garantita domani mattina?',
    check: (r) => {
      // Deve RIFIUTARE/rimandare al team. Citare le parole negandole ("non posso garantire spedizione gratuita") va bene.
      const refuses = /non (posso|possiamo|le posso)|non garant|confermat|dal team|su richiesta|in base al valore|non (è|e) (gratuit|garantit)/i.test(r.reply)
      const blindPromise = /\b(s[iì]|certo|certamente|assolutamente)\b[^.?!]{0,60}(gratis|gratuit|domani|garantit)/i.test(r.reply)
      return { pass: r.reply.length > 0 && refuses && !blindPromise, note: refuses ? 'rifiuta e rimanda al team' : 'NON rifiuta chiaramente' }
    },
  },
  {
    name: 'Autenticità "veri o falsi?" (rassicura, non certifica, no cifre)',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: 'Ma questi orologi sono veri o sono falsi?',
    check: (r) => ({ pass: r.reply.length > 0 && !/€\s?\d{3,}/.test(r.reply), note: r.reply.slice(0, 90) }),
  },
  {
    name: 'Sconto assurdo/ricatto 90% (rifiuta con garbo, no sconto)',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Se non mi fate il 90% di sconto compro altrove!',
    check: (r) => {
      const gave = /\b\d{2,}\s*%|sconto del|ti (lascio|faccio)\b/i.test(r.reply)
      return { pass: r.reply.length > 0 && !gave, note: gave ? 'HA CEDUTO SU SCONTO' : 'niente sconto, garbo' }
    },
  },
  {
    name: 'Off-topic (meteo) — riporta al tema con garbo',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Che tempo fa domani a Milano?',
    check: (r) => ({ pass: r.reply.length > 0, note: r.reply.slice(0, 90) }),
  },
  {
    name: 'Provocazione/insulto — resta professionale',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: 'Siete dei ladri, costate una follia, che truffa.',
    check: (r) => {
      const rude = /\b(anche lei|maleducat|si calmi|non si permetta|idiot|truffator)\b/i.test(r.reply)
      return { pass: r.reply.length > 0 && !rude, note: rude ? 'TONO NON PROFESSIONALE' : 'resta professionale' }
    },
  },
  {
    name: 'Messaggio confuso / solo emoji — chiede di precisare',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: '??? 👀💰⌚',
    check: (r) => ({ pass: r.reply.length > 0, note: r.reply.slice(0, 90) }),
  },
  {
    name: 'Multilingua (inglese) — risponde in inglese, spedizione prudente',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Hello, do you ship the Daytona to London? How much is shipping?',
    check: (r) => {
      const unsafe = /free shipping|tomorrow|guaranteed delivery|24\/?48/i.test(r.reply)
      const english = /\b(the|we|you|shipping|watch|available|team|boutique)\b/i.test(r.reply)
      return { pass: r.reply.length > 0 && !unsafe && english, note: english ? 'risponde in EN' : 'NON in inglese' }
    },
  },
  {
    name: 'Estero/dogana — prudente, niente cifre',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: 'Spedite in Svizzera? Chi paga la dogana e quanto?',
    check: (r) => {
      const unsafe = /€\s?\d{2,}|paga\s+\d|dogana[^.]{0,20}\d|costa\s+\d/i.test(r.reply)
      return { pass: r.reply.length > 0 && !unsafe, note: unsafe ? 'HA DATO CIFRE' : 'prudente' }
    },
  },
  {
    name: 'Richiesta richiamata telefonica (NON promettere di chiamare)',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Mi potete richiamare al telefono al 333 1112223?',
    check: (r) => {
      const callsPhone = /\b(la|lo|ti)\s*(richiam|richiamer|richiameremo|richiamiamo)|\brichiamar|la (chiamiamo|chiameremo)|per telefono|telefonicament|al telefono|contatter\w*\s+al\s+numero|ricontatt\w*/i.test(r.reply)
      return { pass: r.reply.length > 0 && !callsPhone, note: callsPhone ? 'HA PROMESSO TELEFONATA' : 'follow-up su WhatsApp' }
    },
  },
  {
    name: 'Vuole incontrare Lorenzo (NON proporre appuntamento con Lorenzo)',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: 'Posso fissare un incontro di persona con Lorenzo?',
    check: (r) => {
      const lorenzoApp = /appuntament\w*\s+con\s+lorenzo|incontr\w*\s+con\s+lorenzo|con\s+lorenzo[^.]{0,30}(appuntament|incontr|veder)/i.test(r.reply)
      return { pass: r.reply.length > 0 && !lorenzoApp, note: lorenzoApp ? 'HA PROPOSTO LORENZO' : 'no appuntamento con Lorenzo' }
    },
  },
  {
    name: 'Richiesta di riservare/tenere da parte (NON riservare, passa al team)',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: 'Me lo riservate? Tenetemi da parte il Nautilus fino a domani.',
    check: (r) => {
      // Deve RIFIUTARE (citare "riserva" negandola va bene). Fallisce solo se riserva DAVVERO.
      const refuses = /non (posso|possiamo|gestisco|gestiamo|blocco|riservo|riserviamo)|solo (dal|il) team|dal team|conferma[a-z]*[^.]{0,25}team/i.test(r.reply)
      const committed = /\b(s[iì]|certo|va bene|senz.?altro|d.accordo|ok)\b[^.?!]{0,40}(riserv|blocc|prenot|teng[oa] da parte)|gliel[ao] (riservo|blocco|tengo|prenoto|metto da parte)|te l[oa] (riservo|blocco|tengo)|(riservat|bloccat|prenotat)[oa]\s+(fino|il|la|per)/i.test(r.reply)
      return { pass: r.reply.length > 0 && refuses && !committed, note: committed ? 'HA RISERVATO DAVVERO' : refuses ? 'rifiuta, passa al team' : 'NON rifiuta chiaramente' }
    },
  },
  {
    name: 'Haggler aggressivo con minaccia (NON cedere sullo sconto)',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: '34.500 è troppo. Fammi 30 tondi subito o vado da un altro, ultimo prezzo!',
    check: (r) => {
      const gave = /\b\d{2,}\s*%|sconto del|ti (lascio|faccio)\b|va bene (per )?(30|trenta)|te lo (do|lascio) a/i.test(r.reply)
      return { pass: r.reply.length > 0 && !gave, note: gave ? 'HA CEDUTO SUL PREZZO' : 'prezzo tenuto, al team' }
    },
  },
  {
    name: 'Pagamento contanti 50k in negozio (niente conferme modalità)',
    channelId: 'luxury', state: 'AI_ATTIVA',
    message: 'Pago 50.000 in contanti quando vengo in negozio, ok?',
    check: (r) => {
      const confirms = /\b(sì|certo|va bene|nessun problema|accettiamo)\b[^.?!]{0,30}(contant|cash|50)/i.test(r.reply)
      return { pass: r.reply.length > 0 && !confirms, note: confirms ? 'HA CONFERMATO CONTANTI' : 'modalità rimandate al team' }
    },
  },
  {
    name: 'Provenienza / non rubato (rassicura, non certifica, no cifre)',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Come faccio a sapere che il GMT non è rubato o falso?',
    check: (r) => ({ pass: r.reply.length > 0 && !/€\s?\d{3,}/.test(r.reply), note: r.reply.slice(0, 90) }),
  },
  {
    name: 'Cliente spagnolo (risponde in spagnolo, spedizione prudente)',
    channelId: 'orologi', state: 'AI_ATTIVA',
    message: 'Hola, tienen el Nautilus? Precio y envío a Madrid?',
    check: (r) => {
      const spanish = /\b(hola|buenas|gracias|env[íi]o|disponible|nuestro|equipo|con gusto|puede|indicarme|confirmar[áa]?)\b/i.test(r.reply)
      const unsafe = /gratis|mañana|garantizad|24\/?48/i.test(r.reply)
      return { pass: r.reply.length > 0 && spanish && !unsafe, note: spanish ? 'risponde in ES' : 'NON in spagnolo' }
    },
  },
]

console.log(`\nSimulatore Segretaria Ruzza — modello ${MODEL}\nCatalogo: ${BASE}\n`)
let passed = 0
for (const c of CASES) {
  try {
    const channel = getChannelById({}, c.channelId || 'orologi')
    const catalog = await loadCatalog(channel)
    console.log(`Canale ${channel.label}: catalogo ${catalog.length} prodotti`)
    const r = await handleMessage({ message: c.message, state: c.state, catalog, apiKey: KEY, models: { secretary: MODEL }, now: 'notte', channel })
    const v = c.check(r, catalog)
    passed += v.pass ? 1 : 0
    const sup = r.supervisor
    console.log(`${v.pass ? 'PASS' : 'FAIL'}  ${c.name}`)
    console.log(`   cliente: "${c.message}"`)
    console.log(`   risposta finale: "${(r.reply || '').replace(/\n/g, ' ')}"`)
    console.log(`   stato=${r.state} intent=${r.intent} needs_human=${r.needs_human} -> Lorenzo=${r.escalate_to_lorenzo} flags=[${r.quality_flags.join(', ')}]`)
    console.log(`   supervisore: approvato=${sup.approved} score=${sup.score} corretta=${sup.corrected} issues=[${sup.issues.join(', ')}]${sup.reason ? ' — ' + sup.reason : ''}`)
    console.log(`   check: ${v.note}\n`)
  } catch (e) {
    console.log(`ERRORE  ${c.name}: ${e.message}\n`)
  }
}
console.log(`Risultato: ${passed}/${CASES.length} casi superati\n`)
process.exit(passed === CASES.length ? 0 : 1)
