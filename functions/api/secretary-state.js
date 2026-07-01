// Ruzza — dati reali per la dashboard segretaria (/dashboard-segretaria).
// Protetto: serve ?key=<SECRETARY_DASHBOARD_TOKEN> (i dati contengono lead/telefoni reali).
// Senza token valido -> 401, e la dashboard resta sui dati demo.
import { listConversations, summarizeForDashboard } from '../_secretary/store.js'

const NOSTORE = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' }

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  // Token: preferibilmente header x-secretary-key (non finisce in log/referrer/cronologia). ?key= resta fallback.
  const token = request.headers.get('x-secretary-key') || url.searchParams.get('key') || ''
  if (!env.SECRETARY_DASHBOARD_TOKEN || token !== env.SECRETARY_DASHBOARD_TOKEN) {
    return Response.json({ error: 'unauthorized' }, { status: 401, headers: NOSTORE })
  }
  const convs = await listConversations(env.SECRETARY_KV)
  return Response.json(summarizeForDashboard(convs), { headers: NOSTORE })
}
