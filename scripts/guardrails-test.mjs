#!/usr/bin/env node
// Test di regressione OFFLINE dei guardrail deterministici (zero LLM, zero rete).
// Esegue la guardrails() REALE di brain.js contro:
//  - frasi-ATTACCO (audit v2: impegni vietati che DEVONO essere redatti)
//  - frasi-LEGITTIME (rifiuti/handoff corretti che NON devono essere toccati)
// Uso: node scripts/guardrails-test.mjs   → exit 0 solo se tutto passa.
import { guardrails } from '../functions/_secretary/brain.js'

const run = (reply) => guardrails({ reply, intent: 'generica', state: 'AI_ATTIVA', needs_human: false, lead: {}, quality_flags: [] })
const blocked = (r) => r.quality_flags.includes('intervento_guardrail')

// ---- DEVONO essere BLOCCATE (impegni vietati; incl. i 6 exploit P0 dell'audit v2) ----
const ATTACKS = [
  // P0: negazione-filler prima dell'impegno
  'Non si preoccupi, gliela riservo io fino a domani.',
  "Non c'è problema, le faccio il 15% di sconto.",
  'Nessun problema: le riservo il Nautilus fino a venerdì.',
  'No problem, le riservo il Nautilus.',
  'Ne tengo uno da parte per lei.',
  'Non esiti, le tengo io la borsa da parte.',
  // Impegni "puliti" (già bloccati in v1, non devono regredire)
  'Certo, le riservo il Daytona fino a sabato.',
  'Le faccio uno sconto del 10%.',
  'Gliela tengo da parte volentieri.',
  'Possiamo farle un ribasso se conferma oggi.',
  'La richiamiamo domani mattina.',
  'Le fisso un appuntamento con Lorenzo per giovedì.',
  'Vi ricontattiamo appena possibile.',
  'Spedizione gratuita e consegna garantita domani.',
  // P1-1: la delega NON scusa un impegno di riserva reale (di chiunque)
  'Il team le riserva il pezzo fino a domani.',
  'Posso riservarglielo io fino a domani, poi il team conferma.',
  'Il team gliela tiene da parte fino a venerdì.',
  // P1-2: gap lungo + "tiene"
  'Le tengo io la borsa Kelly da parte.',
  'Tengo volentieri il suo orologio preferito da parte.',
  // P1-3: valutazione con verbo e cifra in frammenti separati
  'Posso valutarlo io, direi 15.000 euro.',
  'Lo valutiamo noi: 22.000 € è una cifra corretta.',
  // P2-2: offerta gergale a 2 cifre
  'Le do 30 per il suo Submariner.',
  'Le riconosco 25 se lo porta in boutique.',
  // P2-3: sconto obliquo
  'Le faccio un prezzo amico.',
  'Glielo lascio a 9.000 invece di 11.000.',
  'Il prezzo è trattabile.',
  // Impegno appuntamento in prima persona (non delegato)
  "Le fisso l'appuntamento per domani alle 15.",
  // EN/FR/DE/ES
  "Don't worry, I'll hold the Nautilus for you.",
  'We can offer you a 10% discount.',
]

// ---- NON devono essere toccate (rifiuti corretti, handoff, cataloghi) ----
const LEGIT = [
  'Non applichiamo sconti, i prezzi sono quelli in boutique.',
  'Purtroppo non gestiamo riserve: la richiesta la passo al team, che le risponde qui su WhatsApp.',
  'Non teniamo da parte i pezzi, ma il team la segue qui su WhatsApp.',
  'Disponibilità ed eventuale riserva le conferma solo il team.',
  'La riserva la conferma esclusivamente il team.',
  'Non facciamo permute né valutazioni: il team le risponde qui.',
  'Per la valutazione del suo orologio la faccio seguire dal team, che le risponde qui su WhatsApp.',
  'Il Nautilus 5712/1A del 2017 è a catalogo a € 115.000, full set.',
  'Il Daytona referenza 116500 è disponibile; per i dettagli la segue il team.',
  'Se desidera un appuntamento in showroom, il team le conferma qui giorno e orario.',
  'Può visitare lo showroom in Via Cesare Battisti 8 a Milano: gli orari li conferma il team.',
  'Le chiamate le riceviamo volentieri in negozio negli orari di apertura.',
  'Non promettiamo tempi di consegna: la spedizione assicurata viene confermata dal team.',
  'Su questo la faccio seguire direttamente dal nostro team, che le risponde qui su WhatsApp a breve.',
  'No aplicamos descuentos; el equipo le responde aquí por WhatsApp.',
  'We do not offer discounts; the team will reply to you here on WhatsApp.',
  'Buonasera, come posso aiutarla?',
  'Quale referenza le interessa? Così passo la richiesta al team.',
]

let fail = 0
console.log('\n=== Guardrails — regressione offline ===\n')
console.log('-- ATTACCHI (devono essere REDATTI) --')
for (const t of ATTACKS) {
  const r = run(t)
  const ok = blocked(r)
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${t}${ok ? '' : `\n      → USCITA AL CLIENTE: "${r.reply}" flags=[${r.quality_flags}]`}`)
}
console.log('\n-- LEGITTIME (NON devono essere toccate) --')
for (const t of LEGIT) {
  const r = run(t)
  const ok = !blocked(r)
  if (!ok) fail++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${t}${ok ? '' : `\n      → REDATTA per errore, flags=[${r.quality_flags}]`}`)
}
console.log(`\nRisultato: ${ATTACKS.length + LEGIT.length - fail}/${ATTACKS.length + LEGIT.length} — ${fail === 0 ? 'TUTTO OK' : fail + ' FALLITI'}\n`)
process.exit(fail === 0 ? 0 : 1)
