// Ruzza — configurazione multi-numero WhatsApp.
// Un solo sistema, tre reparti: luxury/VIP, borse, orologi.

const DEFAULT_CHANNELS = [
  {
    id: 'luxury',
    label: 'Luxury',
    title: 'Luxury / clienti alta priorita',
    owner: 'Lorenzo',
    tone: 'molto selettivo, diretto, da concierge luxury',
    stores: ['orologi', 'ruzza-watch'],
    catalogMode: 'luxury',
    priority: 'ALTA',
    envPrefix: 'WHATSAPP_LUXURY',
  },
  {
    id: 'borse',
    label: 'Luxury Bags',
    title: 'Borse',
    owner: 'Team borse',
    tone: 'commerciale, preciso su condizioni, colore, disponibilita e alternative',
    stores: ['orologi'],
    catalogMode: 'bags',
    priority: 'MEDIA',
    envPrefix: 'WHATSAPP_BAGS',
  },
  {
    id: 'orologi',
    label: 'Orologi',
    title: 'Orologi generico',
    owner: 'Team orologi',
    tone: 'professionale, tecnico ma semplice, orientato a modello, disponibilità e risposta su WhatsApp',
    stores: ['orologi', 'ruzza-watch'],
    catalogMode: 'watches',
    priority: 'MEDIA',
    envPrefix: 'WHATSAPP_WATCHES',
  },
]

export const CHANNEL_IDS = DEFAULT_CHANNELS.map((channel) => channel.id)

const SHIPPING_POLICY = [
  'Spedizioni: non promettere costi o tempi certi se non confermati dal team.',
  'Dire che la spedizione assicurata/gestita con cura e la modalita vengono confermate dal team in base a valore, destinazione e prodotto.',
  'Per pezzi importanti proporre ritiro in boutique a Milano o contatto diretto del team.',
  'Non promettere consegna in 24/48 ore, non promettere spedizione gratuita, non promettere corrieri specifici.',
]

const OPERATIONS_POLICY = [
  'Pagamenti: non mandare link di pagamento e non confermare modalita definitive senza umano.',
  'Disponibilita: dire solo quello che risulta dal catalogo; se serve conferma, passare al team.',
  'Autenticita/condizioni: rispondere in modo rassicurante ma senza certificare dettagli non presenti in scheda.',
  'Permute, valutazioni, sconti, trattative: sempre passaggio umano.',
  'Indirizzo showroom: Via Cesare Battisti 8, 20122 Milano, se serve appuntamento.',
]

export function getChannels(env = {}) {
  const configured = parseChannelsJson(env.SECRETARY_CHANNELS)
  const base = configured?.length ? configured : DEFAULT_CHANNELS
  return base.map((channel) => withEnv(channel, env))
}

export function getChannelById(env, id) {
  const channels = getChannels(env)
  return channels.find((channel) => channel.id === id) || channels.find((channel) => channel.id === 'orologi') || channels[0]
}

export function resolveIncomingChannel(value = {}, env = {}) {
  const channels = getChannels(env)
  const metadata = value.metadata || {}
  const phoneNumberId = String(metadata.phone_number_id || '')
  const displayNumber = digitsOnly(metadata.display_phone_number || '')

  const byPhoneId = channels.find((channel) => channel.phoneNumberId && channel.phoneNumberId === phoneNumberId)
  if (byPhoneId) return { ...byPhoneId, matched: true }

  const byDisplay = channels.find((channel) => channel.businessNumber && digitsOnly(channel.businessNumber) === displayNumber)
  if (byDisplay) return { ...byDisplay, matched: true }

  // Numero in arrivo NON riconosciuto (es. 4° numero aggiunto in Meta ma non configurato):
  // NON rispondere dal numero sbagliato → matched:false, il webhook raccoglie e passa al team.
  const fallback = channels.find((channel) => channel.id === 'orologi') || channels[0]
  return { ...fallback, matched: false }
}

export function channelPolicy(channel) {
  return [
    `CANALE WHATSAPP: ${channel.label} (${channel.title || channel.id}).`,
    `RESPONSABILE PREDEFINITO: ${channel.owner || 'Team'}.`,
    `TONO CANALE: ${channel.tone || 'professionale, caldo, asciutto'}.`,
    channel.shopPhone
      ? `TELEFONO NEGOZIO (solo chiamate IN ENTRATA): ${channel.shopPhone}. È il cliente a chiamare questo numero negli orari di apertura; NOI non chiamiamo mai il cliente.`
      : `TELEFONO: nessun numero da dare e NOI non chiamiamo mai il cliente — resta su WhatsApp.`,
    ...channelSpecificRules(channel),
    ...SHIPPING_POLICY,
    ...OPERATIONS_POLICY,
  ].join('\n- ')
}

export function shouldKeepProductForChannel(product, channel) {
  const mode = channel?.catalogMode || 'watches'
  const haystack = norm(`${product.title} ${product.brand || ''} ${product.category || ''} ${product.productType || ''} ${product.tags || ''} ${product.handle || ''}`)
  const isBag = /\b(borsa|borse|luxury bag|handbag|kelly|birkin|chanel|hermes|gucci|dior|prada|louis vuitton|saint laurent|celine|fendi|bottega|valentino)\b/i.test(haystack)
  const isWatch = /\b(orolog|watch|rolex|patek|audemars|richard mille|omega|cartier|panerai|daytona|datejust|submariner|royal oak|nautilus|ruzza watch)\b/i.test(haystack)

  if (mode === 'bags') return isBag
  if (mode === 'luxury') return !isBag || /patek|richard mille|audemars|rolex|nautilus|daytona|royal oak|complicat|alta/i.test(haystack)
  return isWatch || !isBag
}

function parseChannelsJson(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function withEnv(channel, env) {
  const prefix = channel.envPrefix || `WHATSAPP_${String(channel.id || '').toUpperCase()}`
  return {
    ...channel,
    phoneNumberId: channel.phoneNumberId || env[`${prefix}_PHONE_NUMBER_ID`] || legacyPhoneId(channel, env),
    token: channel.token || env[`${prefix}_TOKEN`] || env.WHATSAPP_TOKEN || '',
    businessNumber: channel.businessNumber || env[`${prefix}_BUSINESS_NUMBER`] || legacyBusinessNumber(channel, env),
    shopPhone: channel.shopPhone || env[`${prefix}_SHOP_PHONE`] || env.SECRETARY_SHOP_PHONE || '',
  }
}

function legacyPhoneId(channel, env) {
  return channel.id === 'orologi' ? env.WHATSAPP_PHONE_NUMBER_ID || '' : ''
}

function legacyBusinessNumber(channel, env) {
  return channel.id === 'orologi' ? env.WHATSAPP_BUSINESS_NUMBER || '' : ''
}

function channelSpecificRules(channel) {
  if (channel.id === 'borse') {
    return [
      'Nel canale borse concentrarsi su marca, modello, colore, condizioni, disponibilita, prezzo e alternative simili.',
      'Non valutare borse del cliente: raccogli foto/info e passa al team.',
    ]
  }
  if (channel.id === 'luxury') {
    return [
      'Nel canale luxury trattare ogni conversazione come priorita alta e preparare handoff pulito a Lorenzo.',
      'Per cifre alte, clienti tesi, trattative, permute o richieste speciali: passare a umano.',
    ]
  }
  return [
    'Nel canale orologi concentrarsi su modello, referenza, anno, condizioni, disponibilita, prezzo e appuntamento.',
    'Non valutare orologi del cliente: raccogli foto/info e passa al team.',
  ]
}

function digitsOnly(value) {
  return String(value || '').replace(/\D+/g, '')
}

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
