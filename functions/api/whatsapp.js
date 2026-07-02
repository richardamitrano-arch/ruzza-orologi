// Ruzza — Webhook WhatsApp Cloud API (coesistenza col team). GET = verifica Meta. POST = messaggi in entrata.
// Env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_TOKEN(+per-canale), phone_number_id per-canale, ANTHROPIC_API_KEY, KV SECRETARY_KV.
//   Sicurezza:     WHATSAPP_APP_SECRET (firma HMAC — OBBLIGATORIO: senza, il webhook rifiuta = fail-closed).
//   Comportamento: SECRETARY_ACTIVE_HOURS ("19:00-10:00"), SECRETARY_TZ ("Europe/Rome"), SECRETARY_PAUSED,
//                  SECRETARY_MODEL, SECRETARY_SUPERVISOR_MODEL, SECRETARY_CATALOG_TTL, SECRETARY_SITE_ORIGIN (obbligatorio),
//                  SECRETARY_RATE_CAP (default 25/ora per mittente), SECRETARY_GRAPH_VERSION.
import { handleMessage } from '../_secretary/pipeline.js'
import { emptyConversation, getConversation, saveConversation, alreadySeen, markSeen, acquireLock, releaseLock } from '../_secretary/store.js'
import { resolveIncomingChannel, shouldKeepProductForChannel } from '../_secretary/channels.js'

const GRAPH = (env) => `https://graph.facebook.com/${env.SECRETARY_GRAPH_VERSION || 'v21.0'}`

// --- Verifica webhook (Meta chiama in GET con hub.challenge) ---
export function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token && env.WHATSAPP_VERIFY_TOKEN && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200 })
  }
  return new Response('forbidden', { status: 403 })
}

// --- Messaggi in entrata ---
export async function onRequestPost(context) {
  const { request, env } = context
  const raw = await request.text()
  // FAIL-CLOSED: senza secret NON verificabile → rifiuta (mai processare webhook non firmati in produzione).
  if (!env.WHATSAPP_APP_SECRET) {
    console.error('[secretary] WHATSAPP_APP_SECRET mancante → webhook rifiutato (fail-closed).')
    return new Response('webhook not configured', { status: 503 })
  }
  const ok = await verifySignature(raw, request.headers.get('x-hub-signature-256'), env.WHATSAPP_APP_SECRET)
  if (!ok) return new Response('invalid signature', { status: 401 })

  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response('bad request', { status: 400 })
  }
  // 200 subito a Meta; il lavoro pesante gira in background.
  const run = process(payload, env).catch((e) => console.error('[secretary] errore process webhook:', e?.message || e))
  if (context.waitUntil) context.waitUntil(run)
  else await run
  return new Response('ok', { status: 200 })
}

// Firma HMAC-SHA256 del corpo grezzo, confronto a tempo costante.
async function verifySignature(raw, header, secret) {
  if (!secret || !header) return false
  const expected = header.startsWith('sha256=') ? header.slice(7) : header
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw))
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  if (hex.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

// Finestra di attivazione (default 19:00-10:00 Europe/Rome). Fuori finestra -> raccogli e basta.
function isActiveNow(env, date = new Date()) {
  const spec = String(env.SECRETARY_ACTIVE_HOURS || '19:00-10:00').trim()
  const tz = env.SECRETARY_TZ || 'Europe/Rome'
  const m = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/.exec(spec)
  if (!m) return true
  const startMin = Number(m[1]) * 60 + Number(m[2])
  const endMin = Number(m[3]) * 60 + Number(m[4])
  if (startMin === endMin) return true
  let cur
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(date)
    const hh = Number(parts.find((p) => p.type === 'hour').value) % 24
    const mm = Number(parts.find((p) => p.type === 'minute').value)
    cur = hh * 60 + mm
  } catch {
    return true
  }
  return startMin < endMin ? cur >= startMin && cur < endMin : cur >= startMin || cur < endMin
}

// Cap per mittente/ora (anti-abuso e costo LLM). true = limite superato.
async function rateLimited(env, phone) {
  const kv = env.SECRETARY_KV
  if (!kv) return false
  const cap = Number(env.SECRETARY_RATE_CAP || 25)
  const k = `rl:${phone}:${new Date().toISOString().slice(0, 13)}`
  try {
    const n = Number(await kv.get(k)) || 0
    if (n >= cap) return true
    await kv.put(k, String(n + 1), { expirationTtl: 3900 })
  } catch {
    return false
  }
  return false
}

// Cap GLOBALE giornaliero sui turni LLM (backstop di costo: uno sciame di numeri diversi
// aggira il cap per-mittente, questo no). Oltre il cap → raccogli-e-basta, zero LLM.
async function llmBudgetExceeded(env) {
  const kv = env.SECRETARY_KV
  if (!kv) return false
  const cap = Number(env.SECRETARY_DAILY_CAP || 400)
  const k = `rl:global:${new Date().toISOString().slice(0, 10)}`
  try {
    const n = Number(await kv.get(k)) || 0
    if (n >= cap) {
      console.error(`[secretary] cap LLM giornaliero raggiunto (${cap}) → solo raccolta.`)
      return true
    }
    await kv.put(k, String(n + 1), { expirationTtl: 90000 })
  } catch {
    return false
  }
  return false
}

const within24h = (msg) => Date.now() - (msg?.timestamp ? Number(msg.timestamp) * 1000 : Date.now()) <= 24 * 3600 * 1000

async function process(payload, env) {
  const changes = (payload?.entry || []).flatMap((e) => e.changes || [])
  for (const change of changes) {
    const value = change.value || {}
    const field = change.field || ''
    const channel = resolveIncomingChannel(value, env)
    const contacts = value.contacts || []
    const nameOf = (wa) => contacts.find((c) => c.wa_id === wa)?.profile?.name || ''

    // Stati di consegna asincroni: se un invio è FALLITO, marca la conv per il team.
    for (const st of value.statuses || []) {
      if (st.status !== 'failed') continue
      const phone = st.recipient_id
      if (!phone) continue
      try {
        const conv = await getConversation(env.SECRETARY_KV, phone, channel.id)
        if (conv) {
          conv.escalate = true
          conv.lastDeliveryError = st.errors?.[0]?.title || st.errors?.[0]?.message || 'failed'
          await saveConversation(env.SECRETARY_KV, conv, isoNow())
        }
      } catch (e) {
        console.error('[secretary] statuses handling error:', e?.message || e)
      }
      console.error('[secretary] consegna WA FALLITA a', phone, JSON.stringify(st.errors?.[0] || {}).slice(0, 200))
    }

    // Coesistenza: messaggi del TEAM (Business App) sullo stesso numero -> umano in carico.
    const echoes = value.message_echoes || value.smb_message_echoes || []
    const teamMsgs = [
      ...echoes,
      ...(value.messages || []).filter((m) => m.from && (m.from === channel.businessNumber || m.from === env.WHATSAPP_BUSINESS_NUMBER)),
    ]
    if (field.includes('echo') || teamMsgs.length) {
      for (const m of teamMsgs) {
        const phone = m.to || m.recipient_id || m.from
        if (!phone) continue
        try {
          const conv = (await getConversation(env.SECRETARY_KV, phone, channel.id)) || emptyConversation(phone, channel)
          conv.state = 'UMANO_IN_CARICO'
          conv.channelId = channel.id
          conv.channelLabel = channel.label
          conv.channelOwner = channel.owner
          conv.channelPriority = channel.priority
          conv.messages.push({ role: 'team', text: textOf(m), ts: tsOf(m) })
          await saveConversation(env.SECRETARY_KV, conv, isoNow())
        } catch (e) {
          console.error('[secretary] echo team error:', e?.message || e)
        }
      }
      continue
    }

    // Messaggi dei CLIENTI.
    const active = isActiveNow(env)
    const paused = env.SECRETARY_PAUSED === 'true'
    for (const msg of value.messages || []) {
      const phone = msg.from
      if (!phone) continue
      // Idempotenza: scarta i webhook già visti.
      try {
        if (msg.id && (await alreadySeen(env.SECRETARY_KV, msg.id))) continue
      } catch { /* se KV non raggiungibile, prosegui (meglio doppio che perso) */ }

      // Lock per-conversazione: due messaggi ravvicinati dello stesso numero si ACCODANO
      // (niente lost-update sul conv, niente doppia risposta LLM con stato stantio).
      const lockKey = `${channel.id}:${phone}`
      await acquireLock(env.SECRETARY_KV, lockKey)
      try {
        // Ri-check dentro il lock: l'altro turno potrebbe aver già processato questo wamid.
        try {
          if (msg.id && (await alreadySeen(env.SECRETARY_KV, msg.id))) continue
        } catch { /* come sopra */ }

        const conv = (await getConversation(env.SECRETARY_KV, phone, channel.id)) || emptyConversation(phone, channel)
        if (!conv.name) conv.name = nameOf(phone)
        conv.channelId = channel.id
        conv.channelLabel = channel.label
        conv.channelOwner = channel.owner
        conv.channelPriority = channel.priority
        // Numero non riconosciuto: non sappiamo con che numero/token rispondere → raccogli e passa al team.
        if (channel.matched === false) conv.escalate = true

        // NON testuali (foto/audio/doc): non perderli mai.
        if (msg.type !== 'text') {
          conv.messages.push({ role: 'customer', text: `[${msg.type} ricevuto]`, ts: tsOf(msg), kind: msg.type })
          if (conv.state === 'AI_ATTIVA') conv.state = 'DA_VERIFICARE'
          conv.escalate = true
          if (active && !paused && conv.state !== 'UMANO_IN_CARICO' && within24h(msg) && channel.matched !== false) {
            const ack = 'Ho ricevuto il materiale, grazie. Lo giro al team che le risponde a breve.'
            const sent = await sendText(env, channel, phone, ack)
            if (sent.ok) conv.messages.push({ role: 'assistant', text: ack, ts: isoNow() })
            else conv.lastError = sent
          }
          await saveConversation(env.SECRETARY_KV, conv, isoNow())
          if (msg.id) await markSeen(env.SECRETARY_KV, msg.id)
          continue
        }

        const text = msg.text?.body || ''
        conv.messages.push({ role: 'customer', text, ts: tsOf(msg) })

        // Team in carico → muta. / Numero sconosciuto → raccogli. / Fuori orario → raccogli. / In pausa → raccogli (zero LLM). / Rate-limit o budget giornaliero → raccogli.
        const collectOnly =
          conv.state === 'UMANO_IN_CARICO' || channel.matched === false || !active || paused || (await rateLimited(env, phone)) || (await llmBudgetExceeded(env))
        if (collectOnly) {
          await saveConversation(env.SECRETARY_KV, conv, isoNow())
          if (msg.id) await markSeen(env.SECRETARY_KV, msg.id)
          continue
        }

        const catalog = await fetchCatalog(env, channel)
        const result = await handleMessage({
          message: text,
          history: conv.messages.slice(0, -1).slice(-12),
          catalog,
          state: conv.state,
          apiKey: env.ANTHROPIC_API_KEY,
          models: { secretary: env.SECRETARY_MODEL, supervisor: env.SECRETARY_SUPERVISOR_MODEL },
          now: isoNow(),
          channel,
        })

        conv.state = result.state
        conv.intent = result.intent
        conv.lead = { ...conv.lead, ...result.lead }
        conv.escalate = result.escalate_to_lorenzo
        conv.lastReview = result.supervisor

        if (result.reply) {
          // Re-check stato in KV: il team (echo) o il cockpit ("passa a umano"/"gestito") potrebbero aver preso la chat mentre elaboravamo.
          let taken = false
          try {
            const fresh = await getConversation(env.SECRETARY_KV, phone, channel.id)
            if (fresh && (fresh.state === 'UMANO_IN_CARICO' || fresh.state === 'CHIUSA')) taken = true
          } catch { /* ignora */ }

          if (taken) {
            conv.state = 'UMANO_IN_CARICO'
          } else if (!within24h(msg)) {
            // Fuori finestra 24h Meta: niente free-form → passa al team (no template in v1).
            conv.escalate = true
            conv.lastError = { where: 'window24h' }
          } else {
            const sent = await sendText(env, channel, phone, result.reply)
            if (sent.ok) {
              conv.messages.push({ role: 'assistant', text: result.reply, ts: isoNow() })
            } else {
              conv.escalate = true
              conv.state = 'DA_VERIFICARE'
              conv.lastError = { where: 'send', ...sent }
            }
          }
        }
        await saveConversation(env.SECRETARY_KV, conv, isoNow())
        if (msg.id) await markSeen(env.SECRETARY_KV, msg.id) // commit-after-success: marca visto SOLO a fine turno riuscito
      } catch (e) {
        // Errore (LLM/KV/catalogo): NON marchiamo visto → Meta ritenterà, il messaggio non è perso.
        console.error('[secretary] errore su messaggio, non marco visto (retry Meta):', e?.message || e)
      } finally {
        await releaseLock(env.SECRETARY_KV, lockKey)
      }
    }
  }
}

// Invia testo via Cloud API. Ritorna {ok, status?, error?} — MAI ingoiare gli errori di Meta.
async function sendText(env, channel, to, body) {
  const token = channel.token || env.WHATSAPP_TOKEN
  const phoneNumberId = channel.phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    console.error('[secretary] invio saltato: token/phone_number_id mancante per canale', channel.id)
    return { ok: false, error: 'config-mancante' }
  }
  try {
    const r = await fetch(`${GRAPH(env)}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      console.error(`[secretary] invio WA FALLITO ${r.status} canale ${channel.id}: ${t.slice(0, 200)}`)
      return { ok: false, status: r.status, error: t.slice(0, 200) }
    }
    return { ok: true }
  } catch (e) {
    console.error('[secretary] invio WA errore rete:', e?.message || e)
    return { ok: false, error: String(e?.message || e) }
  }
}

async function fetchCatalog(env, channel) {
  const kv = env.SECRETARY_KV
  const cacheKey = `catalog:${channel.id || 'orologi'}`
  if (kv) {
    try {
      const cached = await kv.get(cacheKey, 'json')
      if (cached) return cached
    } catch { /* ignora, prova a rifare il fetch */ }
  }
  const base = env.SECRETARY_SITE_ORIGIN
  if (!base) {
    console.error('[secretary] SECRETARY_SITE_ORIGIN non impostato → catalogo vuoto (nessun dominio di fallback).')
    return []
  }
  const out = []
  let complete = true
  for (const store of channel.stores || ['orologi', 'ruzza-watch']) {
    for (let page = 1; page <= 6; page++) {
      let r
      try {
        r = await fetch(`${base}/api/shopify-products?store=${store}&limit=250&page=${page}`)
      } catch (e) {
        complete = false
        console.error('[secretary] catalogo fetch errore rete:', store, page, e?.message || e)
        break
      }
      if (!r.ok) {
        complete = false
        console.error('[secretary] catalogo', store, 'pagina', page, '→ status', r.status)
        break
      }
      // 200 con corpo NON valido (HTML d'errore, JSON malformato, shape inattesa) = recupero NON completo:
      // niente cache, altrimenti si serve un catalogo vuoto "avvelenato" per tutto il TTL.
      const j = await r.json().catch(() => null)
      if (!j || !Array.isArray(j.products)) {
        complete = false
        console.error('[secretary] catalogo', store, 'pagina', page, '→ risposta non valida (no products[])')
        break
      }
      const a = j.products
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
  const filtered = out.filter((product) => shouldKeepProductForChannel(product, channel))
  // Cache SOLO se il recupero è COMPLETO (evita di cachare un catalogo parziale/avvelenato). Anche vuoto va cachato se completo.
  if (kv && complete) {
    try {
      await kv.put(cacheKey, JSON.stringify(filtered), { expirationTtl: Number(env.SECRETARY_CATALOG_TTL || 600) })
    } catch { /* ignora */ }
  }
  return filtered
}

function textOf(m) {
  return m?.text?.body || m?.message?.text?.body || ''
}
function tsOf(m) {
  return m?.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : isoNow()
}
function isoNow() {
  return new Date().toISOString()
}
