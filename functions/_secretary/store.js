// Ruzza — Segretaria: storage su Cloudflare KV (conversazioni, lead, stati).
// Binding atteso nel progetto Pages: SECRETARY_KV.

const CONV_PREFIX = 'conv:'
// Retention PII: le conversazioni contengono dati personali (nome, telefono, testo). Scadono da sole
// se inattive (default 180 giorni; il TTL si rinnova ad ogni nuovo messaggio). Cancellabili anche a mano.
const DEFAULT_CONV_TTL = 180 * 24 * 3600

export function emptyConversation(phone, channel = null) {
  return {
    phone,
    channelId: channel?.id || 'orologi',
    channelLabel: channel?.label || 'Orologi',
    channelOwner: channel?.owner || 'Team orologi',
    channelPriority: channel?.priority || 'MEDIA',
    name: '',
    messages: [],
    state: 'AI_ATTIVA',
    intent: 'generica',
    lead: {},
    escalate: false,
    lastReview: null,
    createdAt: null,
    updatedAt: null,
  }
}

export async function getConversation(kv, phone, channelId = 'orologi') {
  if (!kv) return null
  const keyed = await kv.get(conversationKey(phone, channelId), 'json')
  if (keyed) return keyed
  // Compatibilità con la prima versione a numero singolo: conv:<phone>.
  if (channelId === 'orologi') return (await kv.get(CONV_PREFIX + phone, 'json')) || null
  return null
}

export async function saveConversation(kv, conv, ts, ttlSeconds = DEFAULT_CONV_TTL) {
  if (!kv) return
  conv.updatedAt = ts || conv.updatedAt
  if (!conv.createdAt) conv.createdAt = conv.updatedAt
  // Cap dello storico in KV: evita che conv.messages cresca all'infinito e sfori il limite del valore.
  if (Array.isArray(conv.messages) && conv.messages.length > 60) conv.messages = conv.messages.slice(-60)
  const opts = ttlSeconds ? { expirationTtl: ttlSeconds } : undefined
  await kv.put(conversationKey(conv.phone, conv.channelId || 'orologi'), JSON.stringify(conv), opts)
}

// Cancellazione conversazione (diritto all'oblio / pulizia dal cockpit).
export async function deleteConversation(kv, phone, channelId = 'orologi') {
  if (!kv) return false
  await kv.delete(conversationKey(phone, channelId))
  // Ripulisce anche l'eventuale chiave legacy a numero singolo.
  if (channelId === 'orologi') await kv.delete(CONV_PREFIX + phone)
  return true
}

// Idempotenza: Meta ritenta i webhook -> non processare due volte lo stesso messaggio (wamid).
export async function alreadySeen(kv, id) {
  if (!kv || !id) return false
  return (await kv.get('seen:' + id)) != null
}
export async function markSeen(kv, id, ttl = 3600) {
  if (!kv || !id) return
  await kv.put('seen:' + id, '1', { expirationTtl: ttl })
}

// Azione dal cockpit: cambia lo stato di una conversazione (passa a umano / gestito / riapri).
export async function setConversationState(kv, phone, channelId, state) {
  if (!kv) return null
  const conv = await getConversation(kv, phone, channelId)
  if (!conv) return null
  conv.state = state
  await saveConversation(kv, conv, new Date().toISOString())
  return conv
}

export async function listConversations(kv, max = 300) {
  if (!kv) return []
  const out = []
  let cursor
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await kv.list({ prefix: CONV_PREFIX, cursor })
    for (const k of res.keys) {
      const v = await kv.get(k.name, 'json')
      if (v) out.push(v)
      if (out.length >= max) return out
    }
    if (res.list_complete) break
    cursor = res.cursor
  }
  return out
}

function conversationKey(phone, channelId = 'orologi') {
  return `${CONV_PREFIX}${channelId}:${phone}`
}

// Aggregazione per la dashboard operativa (forma stabile, consumata da /api/secretary-state).
export function summarizeForDashboard(conversations) {
  const convs = [...conversations].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  const open = convs.filter((c) => c.state !== 'CHIUSA')
  const daChiamare = open.filter((c) => c.state === 'DA_RICHIAMARE')
  const appuntamenti = open.filter((c) => c.state === 'APPUNTAMENTO')
  const daUmano = open.filter((c) => c.escalate || c.state === 'DA_VERIFICARE' || c.state === 'UMANO_IN_CARICO')
  const leadCaldi = open.filter((c) => ['acquisto', 'info_prodotto', 'disponibilita', 'appuntamento'].includes(c.intent) && c.lead && (c.lead.product || c.lead.budget))

  const scores = convs.map((c) => c.lastReview?.score).filter((n) => typeof n === 'number')
  const qualita = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const priorita = [...daChiamare, ...daUmano, ...leadCaldi]
    .filter((c, i, arr) => arr.findIndex((x) => x.phone === c.phone && x.channelId === c.channelId) === i)
    .slice(0, 12)
    .map((c) => ({
      priorita: c.escalate || c.state === 'DA_VERIFICARE' ? 'ALTA' : 'MEDIA',
      nome: c.name || c.phone,
      telefono: c.phone,
      canale: c.channelLabel || c.channelId || 'Orologi',
      channelId: c.channelId || 'orologi',
      owner: c.channelOwner || 'Team',
      prodotto: c.lead?.product || '',
      motivo: c.state,
      budget: c.lead?.budget || '',
      quando: c.lead?.callback_when || '',
      stato: c.state,
    }))

  const dossier = convs.slice(0, 20).map((c) => ({
    nome: c.name || c.phone,
    telefono: c.phone,
    canale: c.channelLabel || c.channelId || 'Orologi',
    channelId: c.channelId || 'orologi',
    owner: c.channelOwner || 'Team',
    stato: c.state,
    ultimo: c.updatedAt,
    prodotto: c.lead?.product || '',
    escalate: !!c.escalate,
    sintesi: (c.messages || []).slice(-1)[0]?.text || '',
    messages: (c.messages || []).slice(-40).map((m) => ({ role: m.role, text: m.text, ts: m.ts })),
    qualita: c.lastReview?.score ?? null,
    issues: c.lastReview?.issues || [],
  }))

  return {
    counts: {
      conversazioni: convs.length,
      aperte: open.length,
      leadCaldi: leadCaldi.length,
      daChiamare: daChiamare.length,
      appuntamenti: appuntamenti.length,
      daUmano: daUmano.length,
      qualita,
    },
    channels: summarizeChannels(convs),
    priorita,
    dossier,
    generatedAt: convs[0]?.updatedAt || null,
  }
}

function summarizeChannels(conversations) {
  const map = new Map()
  for (const conv of conversations) {
    const id = conv.channelId || 'orologi'
    const item =
      map.get(id) ||
      {
        id,
        label: conv.channelLabel || id,
        owner: conv.channelOwner || 'Team',
        conversations: 0,
        open: 0,
        urgent: 0,
        human: 0,
        calls: 0,
      }
    item.conversations += 1
    if (conv.state !== 'CHIUSA') item.open += 1
    if (conv.escalate || conv.state === 'DA_VERIFICARE') item.urgent += 1
    if (conv.state === 'UMANO_IN_CARICO') item.human += 1
    if (conv.state === 'DA_RICHIAMARE') item.calls += 1
    map.set(id, item)
  }
  return Array.from(map.values())
}
