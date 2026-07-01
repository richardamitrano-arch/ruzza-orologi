// Ruzza — Pipeline a due agenti: SEGRETARIA -> RESPONSABILE COMUNICAZIONI -> esito.
// Unico punto d'ingresso usato sia dal webhook WhatsApp sia dal simulatore.
import { decideReply, selectCatalog, guardrails } from './brain.js'
import { reviewReply } from './supervisor.js'
import { channelPolicy } from './channels.js'

export async function handleMessage({ message, history = [], catalog = [], state = 'AI_ATTIVA', apiKey, models = {}, now, channel = null }) {
  // 1) La segretaria decide la risposta + estrae i dati (già passata dai guardrail dentro decideReply).
  const secretary = await decideReply({
    message,
    history,
    catalog,
    state,
    apiKey,
    model: models.secretary,
    now,
    channel,
    channelPolicy: channel ? channelPolicy(channel) : '',
  })

  // 2) Il responsabile comunicazioni revisiona. Se cade (429/timeout/down): fail-safe — NON perdere il turno,
  //    usa la risposta della segretaria (già filtrata dai guardrail) e segnala per verifica umana.
  const relevant = selectCatalog(message, catalog)
  let review
  let supervisorFailed = false
  try {
    review = await reviewReply({
      customerMessage: message,
      secretaryReply: secretary.reply,
      intent: secretary.intent,
      state: secretary.state,
      catalog: relevant,
      channel,
      apiKey,
      model: models.supervisor,
    })
  } catch (e) {
    supervisorFailed = true
    review = { approved: true, quality_score: null, issues: ['supervisore_non_disponibile'], corrected_reply: '', escalate_to_lorenzo: true, reason: String(e?.message || e).slice(0, 200) }
  }

  // 3) Se il supervisore propone una correzione, si parte da quella…
  let finalReply = secretary.reply
  let corrected = false
  if (!review.approved && review.corrected_reply) {
    finalReply = review.corrected_reply
    corrected = true
  }

  // …MA la correzione del supervisore ripassa SEMPRE dai guardrail deterministici: mai bypassarli
  //    (un corrected_reply avvelenato via injection verrebbe comunque redatto qui).
  const guarded = guardrails({
    reply: finalReply,
    intent: secretary.intent,
    state: secretary.state,
    needs_human: secretary.needs_human,
    lead: secretary.lead || {},
    quality_flags: [...(secretary.quality_flags || []), ...(corrected ? ['supervisore_corretto'] : [])],
  })

  let finalState = guarded.state
  let needsHuman = guarded.needs_human
  // Se il supervisore NON approva (o è caduto): il turno va verificato da un umano.
  if (!review.approved || supervisorFailed) {
    needsHuman = true
    if (finalState === 'AI_ATTIVA') finalState = 'DA_VERIFICARE'
  }

  return {
    reply: guarded.reply,
    state: finalState,
    intent: secretary.intent,
    needs_human: needsHuman,
    lead: { ...(secretary.lead || {}), channel: channel?.label || secretary.lead?.channel || '' },
    quality_flags: guarded.quality_flags || [],
    escalate_to_lorenzo: Boolean(review.escalate_to_lorenzo || needsHuman),
    supervisor: {
      approved: review.approved,
      score: review.quality_score,
      issues: review.issues || [],
      reason: review.reason || '',
      corrected,
      failed: supervisorFailed,
    },
  }
}
