// Azioni del cockpit segretaria (protette da SECRETARY_DASHBOARD_TOKEN).
// POST { phone, channelId, action }  action ∈ human | done | reopen | delete
// Token: preferibilmente header x-secretary-key (non finisce nei log). ?key= resta come fallback.
import { setConversationState, deleteConversation } from '../_secretary/store.js'

const ACTIONS = { human: 'UMANO_IN_CARICO', done: 'CHIUSA', reopen: 'AI_ATTIVA' }
const NOSTORE = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url)
  const token = request.headers.get('x-secretary-key') || url.searchParams.get('key') || ''
  if (!env.SECRETARY_DASHBOARD_TOKEN || token !== env.SECRETARY_DASHBOARD_TOKEN) {
    return Response.json({ error: 'unauthorized' }, { status: 401, headers: NOSTORE })
  }
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 })
  }
  if (!body?.phone) {
    return Response.json({ error: 'invalid phone' }, { status: 400, headers: NOSTORE })
  }
  // Cancellazione conversazione (diritto all'oblio).
  if (body.action === 'delete') {
    const ok = await deleteConversation(env.SECRETARY_KV, body.phone, body.channelId || 'orologi')
    return Response.json({ ok, deleted: true }, { headers: NOSTORE })
  }
  const state = ACTIONS[body.action]
  if (!state) {
    return Response.json({ error: 'invalid action' }, { status: 400, headers: NOSTORE })
  }
  const conv = await setConversationState(env.SECRETARY_KV, body.phone, body.channelId || 'orologi', state)
  return Response.json({ ok: !!conv, state }, { headers: NOSTORE })
}
