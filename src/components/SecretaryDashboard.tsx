import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { appHref } from '../lib/routing'

// Cockpit operativo della segretaria (stile Apple, light). Strumento vero: ricerca, refresh live, azioni che cambiano stato.
// Regole: mai sconti/stime/permute · mai chiamate in uscita · mai Lorenzo · mai "ricontattare" · mai riserve/prenotazioni → tutto su WhatsApp, passa al team.

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'
const C = {
  bg: '#f5f5f7', card: '#ffffff', ink: '#1d1d1f', sub: '#6e6e73', faint: '#86868b',
  line: 'rgba(0,0,0,0.08)', track: '#e8e8ed', sel: '#eef4fd',
  blue: '#0071e3', green: '#34c759', bubbleUs: '#e7f8ec', bubbleThem: '#f0f0f2',
}
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.04), 0 12px 30px -14px rgba(0,0,0,0.14)'
const DOT: Record<string, string> = { luxury: '#ff9500', borse: '#ff2d55', orologi: '#0071e3' }

type Priority = 'Alta' | 'Media'
type Msg = { role: 'customer' | 'assistant' | 'team'; text: string; time?: string }
type Conversation = {
  id: string; channelId: string; time: string; channel: string; name: string; phone: string
  state: string; product: string; summary: string; nextAction: string; priority: Priority; messages: Msg[]
}
const DONE = new Set(['Gestito', 'Chiusa'])
const isDone = (c: Conversation) => DONE.has(c.state)

const demoConversations: Conversation[] = [
  { id: 'n1', channelId: 'luxury', time: '23:48', channel: 'Luxury', name: 'Davide T.', phone: '+39 331 222 5566', state: 'Da seguire', product: 'Rolex Daytona 116500LN', summary: 'Insiste 3 volte sullo sconto sul Daytona. Prezzo tenuto, richiesta girata al team.', nextAction: 'Rispondi su WhatsApp; il team valuta eventuali margini.', priority: 'Alta', messages: [
    { role: 'customer', text: 'Il Daytona ceramica ce l\'avete? Prezzo bomba però.', time: '23:44' },
    { role: 'assistant', text: 'Buonasera. Sì: Daytona 116500LN ceramica, quadrante bianco, 2022, Box & Papers, a € 34.500. Disponibile.', time: '23:45' },
    { role: 'customer', text: '34.500 è troppo. Fammi 30 tondi e lo prendo subito.', time: '23:46' },
    { role: 'assistant', text: 'La ringrazio dell\'interesse. I prezzi sono quelli indicati e non gestisco sconti: eventuali margini li valuta il team, a cui passo subito la richiesta con priorità.', time: '23:47' },
    { role: 'customer', text: 'Dai su, l\'ultimo prezzo vero, altrimenti vado altrove.', time: '23:48' },
    { role: 'assistant', text: 'Capisco. Il prezzo non posso trattarlo io — lo fa solo il team, che le risponde qui. Intanto le confermo che il pezzo è completo e disponibile.', time: '23:48' },
  ] },
  { id: 'n2', channelId: 'borse', time: '00:31', channel: 'Borse', name: 'Chiara V.', phone: '+39 333 444 7788', state: 'Da verificare', product: 'Hermès Birkin 30', summary: 'Vuole riservare la Birkin con un acconto. Nessuna riserva presa, passata al team.', nextAction: 'Passa al team per riserva e acconto.', priority: 'Alta', messages: [
    { role: 'customer', text: 'La Birkin 30 nera è ancora disponibile?', time: '00:27' },
    { role: 'assistant', text: 'Buonasera, sì: Birkin 30 Togo nera, hardware oro, ottime condizioni. Disponibile.', time: '00:28' },
    { role: 'customer', text: 'La voglio! Me la riservate? Vi mando un acconto per tenerla fino a sabato.', time: '00:30' },
    { role: 'assistant', text: 'Grazie, richiesta chiarissima. La riserva e l\'acconto però li gestisce solo il team: io non posso bloccare il pezzo. Passo subito la sua richiesta con priorità, così le confermano loro qui su WhatsApp.', time: '00:31' },
  ] },
  { id: 'n3', channelId: 'orologi', time: '01:15', channel: 'Orologi', name: 'James W.', phone: '+44 7700 900123', state: 'Da seguire', product: 'Omega Speedmaster Moonwatch', summary: 'Cliente inglese: Speedmaster + spedizione a Londra. Risposto in inglese, spedizione prudente.', nextAction: 'Rispondi su WhatsApp; il team per la spedizione UK.', priority: 'Media', messages: [
    { role: 'customer', text: 'Hi, do you have the Omega Speedmaster Moonwatch? Price and shipping to London?', time: '01:12' },
    { role: 'assistant', text: 'Good evening, thank you for reaching out. Yes — Omega Speedmaster Professional Moonwatch, 2021, full set, € 6.400. Shipping to London is arranged insured by our team, with cost and timing confirmed by them based on value and destination; I can\'t quote those here. May I have your name so the team follows up here on WhatsApp?', time: '01:15' },
  ] },
  { id: 'n4', channelId: 'luxury', time: '02:03', channel: 'Luxury', name: 'Antonio R.', phone: '+39 348 555 9900', state: 'Da verificare', product: 'Patek Philippe 5990 (vendita cliente)', summary: 'Vuole vendere un Patek senza scatola/documenti. Nessuna stima, dati raccolti, al team.', nextAction: 'Passa al team per valutazione in mano.', priority: 'Alta', messages: [
    { role: 'customer', text: 'Vi vendo il mio Patek 5990, ma non ho più scatola e documenti. Quanto mi date?', time: '02:00' },
    { role: 'assistant', text: 'Buonasera, grazie per averci pensato. Non effettuo valutazioni né stime: se ne occupa il nostro responsabile. Mi lascia referenza esatta, anno, condizioni e qualche foto (anche del retro)? Giro tutto al team per la valutazione.', time: '02:02' },
    { role: 'customer', text: 'Ok ma dovrebbe essere originale eh, l\'ho preso anni fa.', time: '02:03' },
    { role: 'assistant', text: 'Perfetto, la verifica la fa direttamente il responsabile con esame in mano. Nessuna stima da parte mia: raccolgo le info e passo al team.', time: '02:03' },
  ] },
  { id: 'n5', channelId: 'orologi', time: '03:29', channel: 'Orologi', name: 'Federico M.', phone: '+39 340 111 2233', state: 'AI attiva', product: 'Rolex GMT-Master II', summary: 'Chiede provenienza/autenticità del GMT. Rassicurata senza certificare, dettagli al team.', nextAction: 'Rispondi su WhatsApp; il team per documenti e provenienza.', priority: 'Media', messages: [
    { role: 'customer', text: 'Come faccio a sapere che il GMT non è rubato o falso? Che garanzie date?', time: '03:27' },
    { role: 'assistant', text: 'Domanda legittima. Trattiamo pezzi selezionati e ogni orologio è coperto dalla nostra garanzia del negozio. Per documentazione e provenienza le risponde direttamente il team, che glieli fornisce qui. Intanto le confermo referenza e disponibilità.', time: '03:29' },
  ] },
  { id: 'n6', channelId: 'borse', time: '04:41', channel: 'Borse', name: 'Beatrice L.', phone: '+39 335 777 8899', state: 'AI attiva', product: 'Chanel 19', summary: 'Chiede una richiamata da Lorenzo. Reindirizzata su WhatsApp, niente chiamate né Lorenzo.', nextAction: 'Rispondi su WhatsApp; niente chiamata né Lorenzo.', priority: 'Media', messages: [
    { role: 'customer', text: 'Per la Chanel 19 mi fate richiamare da Lorenzo così ne parliamo a voce?', time: '04:39' },
    { role: 'assistant', text: 'Grazie! La seguiamo direttamente qui su WhatsApp — non facciamo chiamate. Mi dica pure cosa le serve sulla Chanel 19 (colore, condizioni, disponibilità) e passo tutto al team, che le risponde qui.', time: '04:41' },
  ] },
]

type ApiState = {
  counts?: { conversazioni?: number; daUmano?: number; qualita?: number | null }
  dossier?: Array<{ nome?: string; telefono?: string; canale?: string; channelId?: string; stato?: string; ultimo?: string; prodotto?: string; escalate?: boolean; sintesi?: string; messages?: Array<{ role?: string; text?: string; ts?: string }> }>
  error?: string
}
const STATE_LABELS: Record<string, string> = { AI_ATTIVA: 'AI attiva', UMANO_IN_CARICO: 'Umano in carico', DA_RICHIAMARE: 'Da seguire', APPUNTAMENTO: 'Visita in boutique', DA_VERIFICARE: 'Da verificare', CHIUSA: 'Chiusa' }
const stateLabel = (s?: string) => (s ? STATE_LABELS[s] || s : 'Da seguire')
const shortTime = (iso?: string) => { if (!iso) return ''; const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }

function mapConversations(api: ApiState): Conversation[] {
  return (api.dossier || []).map((c, i) => {
    const escalated = !!c.escalate || c.stato === 'DA_VERIFICARE' || c.stato === 'UMANO_IN_CARICO'
    const messages: Msg[] = (c.messages || []).map((m) => ({ role: m.role === 'team' ? 'team' : m.role === 'assistant' ? 'assistant' : 'customer', text: m.text || '', time: shortTime(m.ts) }))
    return {
      id: `${c.channelId || 'orologi'}:${c.telefono || i}`, channelId: c.channelId || 'orologi', time: shortTime(c.ultimo) || '—', channel: c.canale || 'Orologi',
      name: c.nome || c.telefono || 'Cliente', phone: c.telefono || '', state: stateLabel(c.stato), product: c.prodotto || '—',
      summary: c.sintesi || '—', nextAction: c.stato === 'UMANO_IN_CARICO' ? 'Già in carico al team.' : escalated ? 'Passa a un umano prima di rispondere.' : 'Rispondi su WhatsApp.',
      priority: escalated ? 'Alta' : 'Media', messages,
    }
  })
}

const CHANNELS = ['Tutte', 'Luxury', 'Borse', 'Orologi'] as const
const PRIORITY_ORDER: Record<Priority, number> = { Alta: 0, Media: 1 }
const waLink = (phone: string) => { const d = (phone || '').replace(/[^\d]/g, ''); return d ? `https://wa.me/${d}` : undefined }
const getKey = () => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('key') || '')

export default function SecretaryDashboard() {
  const keyRef = useRef<string>(getKey())
  const [items, setItems] = useState<Conversation[]>(demoConversations)
  const [mode, setMode] = useState<'demo' | 'live'>('demo')
  const [updatedAt, setUpdatedAt] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<(typeof CHANNELS)[number]>('Tutte')
  const [query, setQuery] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [threadOpen, setThreadOpen] = useState(false)

  const load = useCallback(async () => {
    if (!keyRef.current) return
    setLoading(true)
    try {
      const r = await fetch('/api/secretary-state', { headers: { 'cache-control': 'no-store', 'x-secretary-key': keyRef.current } })
      if (r.ok) {
        const j = (await r.json()) as ApiState
        if (!j.error) { setItems(mapConversations(j)); setMode('live'); setUpdatedAt(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })) }
      }
    } catch { /* resta sui dati correnti */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!keyRef.current) return
    load()
    const t = setInterval(load, 25000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    if (!threadOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setThreadOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [threadOpen])

  const act = useCallback(async (conv: Conversation, action: 'human' | 'done' | 'reopen') => {
    const next = action === 'human' ? 'Umano in carico' : action === 'done' ? 'Gestito' : 'AI attiva'
    setItems((prev) => prev.map((c) => (c.id === conv.id ? { ...c, state: next, priority: action === 'done' ? 'Media' : c.priority } : c)))
    if (keyRef.current) {
      try { await fetch('/api/secretary-action', { method: 'POST', headers: { 'content-type': 'application/json', 'x-secretary-key': keyRef.current }, body: JSON.stringify({ phone: conv.phone, channelId: conv.channelId, action }) }) } catch { /* ottimistico */ }
    }
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter((c) => (showDone ? true : !isDone(c)))
      .filter((c) => (filter === 'Tutte' ? true : new RegExp(filter, 'i').test(c.channel)))
      .filter((c) => (!q ? true : `${c.name} ${c.product} ${c.summary}`.toLowerCase().includes(q)))
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.time.localeCompare(b.time))
  }, [items, filter, query, showDone])

  const selected = visible.find((c) => c.id === selectedId) || visible[0]
  const openCount = items.filter((c) => !isDone(c)).length
  const daGestire = items.filter((c) => !isDone(c) && c.priority === 'Alta').length
  const chanCount = (n: string) => items.filter((c) => !isDone(c) && (n === 'Tutte' || new RegExp(n, 'i').test(c.channel))).length

  return (
    <main style={{ fontFamily: FONT, background: C.bg, color: C.ink }} className="min-h-screen">
      <div className="mx-auto max-w-[1120px] px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex flex-wrap items-center gap-3">
          <a href={appHref('/')} className="inline-flex items-center gap-2" aria-label="Torna al sito" style={{ color: C.ink }}>
            <span className="grid h-7 w-7 place-items-center rounded-[8px] text-[13px] font-semibold" style={{ background: C.ink, color: '#fff' }}>R</span>
            <span className="text-[15px] font-semibold tracking-tight">Secretary</span>
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium" style={{ background: mode === 'live' ? 'rgba(52,199,89,0.12)' : C.track, color: mode === 'live' ? '#248a3d' : C.sub }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: mode === 'live' ? C.green : C.faint }} />
            {mode === 'live' ? `Live${updatedAt ? ` · ${updatedAt}` : ''}` : 'Demo'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: C.card, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
              <span aria-hidden style={{ color: C.faint }}>⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca chat, prodotto…" className="w-[150px] bg-transparent text-[14px] outline-none sm:w-[200px]" style={{ color: C.ink }} />
            </div>
            <button type="button" onClick={load} aria-label="Aggiorna" title="Aggiorna" className="grid h-9 w-9 place-items-center rounded-full text-[16px] transition-transform active:scale-95" style={{ background: C.card, color: C.sub, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', opacity: loading ? 0.5 : 1 }}>↻</button>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <span className="text-[22px] font-semibold tracking-[-0.02em]">Turno · {openCount} da gestire</span>
          <span className="text-[13px]" style={{ color: C.sub }}>{daGestire} in priorità alta · {items.length} chat totali</span>
        </div>

        <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
          <div className="flex flex-col overflow-hidden rounded-[16px]" style={{ background: C.card, boxShadow: CARD_SHADOW }}>
            <div className="px-4 pt-4">
              <div className="inline-flex w-full gap-0.5 rounded-full p-[3px]" style={{ background: C.track }} role="tablist">
                {CHANNELS.map((c) => {
                  const on = filter === c
                  return (
                    <button key={c} type="button" role="tab" aria-selected={on} onClick={() => setFilter(c)} className="flex-1 rounded-full px-2 py-1.5 text-[13px] font-medium transition-all" style={on ? { background: C.card, color: C.ink, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } : { background: 'transparent', color: C.sub }}>
                      {c} <span style={{ color: C.faint }}>{chanCount(c)}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <ul className="mt-1 max-h-[62vh] flex-1 overflow-y-auto pb-1">
              {visible.length === 0 && <li className="px-4 py-8 text-[14px]" style={{ color: C.sub }}>Nessuna chat.{query ? " Prova un'altra ricerca." : ''}</li>}
              {visible.map((c, i) => {
                const on = selected?.id === c.id
                return (
                  <li key={c.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.line}` }}>
                    <button type="button" onClick={() => { setSelectedId(c.id); setThreadOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors" style={{ background: on ? C.sel : 'transparent' }}>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DOT[c.channelId] || C.blue }} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[15px] font-semibold tracking-tight">{c.name}</span>
                          <span className="shrink-0 text-[12px]" style={{ color: C.faint }}>{c.time}</span>
                        </span>
                        <span className="mt-1 flex items-center gap-2">
                          <Pill tone={isDone(c) ? 'done' : c.priority === 'Alta' ? 'warn' : 'neutral'}>{c.state}</Pill>
                          <span className="truncate text-[13px]" style={{ color: C.sub }}>{c.product}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="flex items-center justify-between border-t px-4 py-2.5 text-[12px]" style={{ borderColor: C.line, color: C.sub }}>
              <span>{visible.length} visibili</span>
              <label className="flex cursor-pointer items-center gap-1.5 select-none">
                <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
                Mostra gestite
              </label>
            </div>
          </div>

          {selected ? (
            <article className="rounded-[16px] p-5 sm:p-6" style={{ background: C.card, boxShadow: CARD_SHADOW }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium" style={{ color: C.faint }}>{selected.time} · {selected.channel}</p>
                  <h2 className="mt-1 text-[25px] font-semibold tracking-[-0.02em]">{selected.name}</h2>
                  {selected.phone && <p className="mt-0.5 text-[15px]" style={{ color: C.sub }}>{selected.phone}</p>}
                </div>
                <Pill tone={isDone(selected) ? 'done' : selected.priority === 'Alta' ? 'warn' : 'neutral'}>{selected.state}</Pill>
              </div>

              <div className="mt-5 grid gap-4">
                <Field label="Prodotto" value={selected.product} />
                <Field label="Sintesi" value={selected.summary} />
                <Field label="Prossima azione" value={selected.nextAction} />
              </div>

              <button type="button" onClick={() => setThreadOpen(true)} className="mt-5 flex w-full items-center justify-between rounded-[12px] px-4 py-3 text-[14px] font-medium transition-colors hover:brightness-[0.98]" style={{ background: C.bg, color: C.ink }}>
                <span>Vedi conversazione <span style={{ color: C.faint }}>· {selected.messages.length} messaggi</span></span>
                <span aria-hidden style={{ color: C.faint }}>›</span>
              </button>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {waLink(selected.phone) ? (
                  <a href={waLink(selected.phone)} target="_blank" rel="noreferrer" className="rounded-full px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90" style={{ background: C.green }}>Apri in WhatsApp</a>
                ) : (
                  <span className="rounded-full px-5 py-2.5 text-[14px] font-medium" style={{ background: C.track, color: C.faint }}>Apri in WhatsApp</span>
                )}
                {isDone(selected) ? (
                  <SecondaryButton onClick={() => act(selected, 'reopen')}>Riapri</SecondaryButton>
                ) : (
                  <>
                    <SecondaryButton onClick={() => act(selected, 'human')}>Passa a umano</SecondaryButton>
                    <SecondaryButton onClick={() => act(selected, 'done')}>Segna gestito</SecondaryButton>
                  </>
                )}
              </div>
            </article>
          ) : (
            <article className="grid place-items-center rounded-[16px] p-12 text-center" style={{ background: C.card, boxShadow: CARD_SHADOW }}>
              <p className="text-[15px]" style={{ color: C.sub }}>Tutto gestito. Nessuna chat aperta.</p>
            </article>
          )}
        </section>
      </div>

      {threadOpen && selected && <Thread conv={selected} onClose={() => setThreadOpen(false)} />}
    </main>
  )
}

function Thread({ conv, onClose }: { conv: Conversation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(3px)' }} onClick={onClose} role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[20px] sm:rounded-[20px]" style={{ background: C.card, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.line}` }}>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold tracking-tight">{conv.name}</p>
            <p className="truncate text-[12px]" style={{ color: C.faint }}>{conv.channel} · {conv.product}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi" className="grid h-8 w-8 place-items-center rounded-full text-[16px]" style={{ background: C.track, color: C.sub }}>✕</button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5" style={{ background: '#fbfbfd' }}>
          {conv.messages.length === 0 && <p className="py-6 text-center text-[14px]" style={{ color: C.sub }}>Nessun messaggio.</p>}
          {conv.messages.map((m, i) => {
            const us = m.role !== 'customer'
            const who = m.role === 'customer' ? 'Cliente' : m.role === 'team' ? 'Team' : 'Segretaria'
            return (
              <div key={i} className={`flex flex-col ${us ? 'items-end' : 'items-start'}`}>
                <span className="mb-1 px-1 text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: C.faint }}>{who}{m.time ? ` · ${m.time}` : ''}</span>
                <div className="max-w-[82%] rounded-[16px] px-3.5 py-2.5 text-[14px] leading-snug" style={{ background: us ? C.bubbleUs : C.bubbleThem, color: C.ink }}>{m.text}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: C.faint }}>{label}</p>
      <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: C.ink }}>{value}</p>
    </div>
  )
}
function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' | 'done' }) {
  const style: CSSProperties = tone === 'warn' ? { background: 'rgba(255,149,0,0.14)', color: '#b25e00' } : tone === 'done' ? { background: 'rgba(52,199,89,0.14)', color: '#248a3d' } : { background: '#f0f0f2', color: C.sub }
  return <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={style}>{children}</span>
}
function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full px-5 py-2.5 text-[14px] font-medium transition-colors hover:brightness-95 active:scale-95" style={{ background: C.track, color: C.ink }}>{children}</button>
}
