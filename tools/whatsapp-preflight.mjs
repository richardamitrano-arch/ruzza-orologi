#!/usr/bin/env node
// Preflight per collegare i numeri WhatsApp della segretaria.
// Uso:  (riempi .env.secretary)  →  node tools/whatsapp-preflight.mjs
// Legge le env (o .env.secretary), verifica variabili globali e, per ogni canale, che
// phone_number_id + token rispondano sulla Graph API di Meta (numero valido e usabile).
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { getChannels } from '../functions/_secretary/channels.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

// mini loader .env (KEY=VALUE), non sovrascrive env già presenti
for (const name of ['.env.secretary', '.env.secretary.local']) {
  const p = join(root, name)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

const env = process.env
const GRAPH = `https://graph.facebook.com/${env.SECRETARY_GRAPH_VERSION || 'v21.0'}`
const ok = (b) => (b ? '✅' : '❌')
let problems = 0

console.log('\n=== Preflight segretaria WhatsApp ===\n')

console.log('Variabili globali:')
for (const k of ['ANTHROPIC_API_KEY', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET', 'SECRETARY_DASHBOARD_TOKEN', 'SECRETARY_SITE_ORIGIN']) {
  const set = !!env[k]
  if (!set) problems++
  console.log(`  ${ok(set)} ${k}${set ? '' : ' — mancante'}`)
}
console.log('  ℹ️  KV binding SECRETARY_KV: da creare e bindare su Cloudflare (non verificabile da qui)')
console.log('  ℹ️  Webhook Meta → https://<dominio>/api/whatsapp  (verify token = WHATSAPP_VERIFY_TOKEN)')

console.log('\nCanali / numeri (verifica su Graph API):')
const channels = getChannels(env)
for (const ch of channels) {
  if (!ch.phoneNumberId || !ch.token) {
    problems++
    const miss = [!ch.phoneNumberId && 'phone_number_id', !ch.token && 'token'].filter(Boolean).join(' + ')
    console.log(`  ❌ ${ch.label} (${ch.id}) — manca ${miss}  [env: ${ch.envPrefix}_PHONE_NUMBER_ID / WHATSAPP_TOKEN]`)
    continue
  }
  try {
    const r = await fetch(`${GRAPH}/${ch.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`, {
      headers: { authorization: `Bearer ${ch.token}` },
    })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j.id) {
      console.log(`  ✅ ${ch.label} (${ch.id}) → ${j.display_phone_number || '?'} · ${j.verified_name || 'senza nome'} · qualità ${j.quality_rating || 'n/d'} · verifica ${j.code_verification_status || 'n/d'}`)
    } else {
      problems++
      console.log(`  ❌ ${ch.label} (${ch.id}) → Graph ${r.status}: ${(j.error?.message || JSON.stringify(j)).slice(0, 140)}`)
    }
  } catch (e) {
    problems++
    console.log(`  ❌ ${ch.label} (${ch.id}) → errore rete: ${e.message}`)
  }
}

console.log(`\n${problems === 0 ? '✅ PRONTO: variabili e numeri rispondono. Puoi configurare il webhook e accendere (prima con SECRETARY_PAUSED=true).' : `⚠️  ${problems} cose da sistemare prima del collegamento.`}\n`)
process.exit(problems === 0 ? 0 : 1)
