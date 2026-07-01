// Central business contact details — Ruzza Orologi S.r.l., Milano.
import { shopifyUrl } from './shopify'

export const PHONE_DISPLAY = '+39 331 9689707'
export const PHONE_TEL = '+393319689707'
export const WHATSAPP_NUMBER = '393319689707'
export const WHATSAPP = `https://wa.me/${WHATSAPP_NUMBER}`
export const VALUATION_WHATSAPP =
  `https://api.whatsapp.com/send?phone=+${WHATSAPP_NUMBER}&text=Buongiorno,%20sono%20interessato%20a%20vendere%20il%20mio%20orologio`

// Numero WhatsApp dedicato a borse + gioielli (store ruzzabags.com).
// Gli orologi e tutto il resto restano sul numero principale.
export const WHATSAPP_BAGS_NUMBER = '393203863817'

// Categorie servite dal canale "borse/gioielli".
const BAGS_WHATSAPP_CATEGORIES = new Set(['luxury-bags', 'gioielli'])

export function whatsappNumberForCategory(category?: string): string {
  return category && BAGS_WHATSAPP_CATEGORIES.has(category) ? WHATSAPP_BAGS_NUMBER : WHATSAPP_NUMBER
}

export function whatsappHrefForCategory(category?: string): string {
  return `https://wa.me/${whatsappNumberForCategory(category)}`
}

export function whatsappContactHref(category: string | undefined, text: string): string {
  return `https://api.whatsapp.com/send?phone=+${whatsappNumberForCategory(category)}&text=${encodeURIComponent(text)}`
}

export const EMAIL = 'labottegadeltempo@yahoo.com'
export const TELEGRAM = 'https://t.me/lorenzoruzza'
export const SHOPIFY_NEWSLETTER_ACTION = shopifyUrl('/contact#ContactFooter')
export const VALUATION_FORM = shopifyUrl('/pages/contact')
export const PRIVACY_POLICY = shopifyUrl('/pages/privacy-policy')

export const ADDRESS = 'Via Cesare Battisti 8 · 20122 Milano'
export const LEGAL_NAME = 'Ruzza Orologi S.r.l.'
export const VAT = '11049590968' // Partita IVA — verificata su ruzzaorologi.com

export const SOCIAL = {
  instagram: 'https://www.instagram.com/ruzzaorologi/',
  facebook: 'https://www.facebook.com/ruzzaorologi/',
  telegram: TELEGRAM,
}
