# Deploy della Segretaria su Cloudflare Pages — runbook

> ✅ **STATO 2026-07-05 — FASE A GIÀ ESEGUITA E VERIFICATA LIVE (da Claude via wrangler).**
> Progetto Pages **`ruzza-segretaria`** · URL **https://ruzza-segretaria.pages.dev** · KV `SECRETARY_KV` bindato ·
> segreti `ANTHROPIC_API_KEY` + `SECRETARY_DASHBOARD_TOKEN` impostati (cifrati) · `SECRETARY_PAUSED=true`.
> Verificato: catalogo→prodotti veri, cockpit `secretary-state` col token→200/KV, webhook fail-closed (GET 403 / POST 503).
> **Cockpit:** `https://ruzza-segretaria.pages.dev/dashboard-segretaria?key=<SECRETARY_DASHBOARD_TOKEN>`
> (il token è in `~/.ruzza_secretary_dashboard_token`). **Resta solo la FASE B** (numeri WhatsApp, sotto).
> Per aggiornare il deploy dopo modifiche: `npm run build:cloudflare && npx wrangler pages deploy --commit-dirty=true`.



La segretaria è fatta di **Cloudflare Pages Functions** (`functions/api/*`). Questo è il pezzo che le fa
"girare" davvero: GitHub `main` è solo il backup del codice, non esegue niente. Qui la mettiamo online.

> **Ordine generale del go-live:**
> **FASE A** (questa guida, la puoi fare ORA, senza Meta) → deploy + cockpit live + catalogo che risponde.
> **FASE B** (quando hai i dati Meta) → colleghi i numeri WhatsApp seguendo `COLLEGA_NUMERI_WHATSAPP.md`.
>
> La Segretaria **non tocca il sito clienti** (`ruzzaorologi.com`): vive su un suo URL `*.pages.dev`.

---

## Cosa ti serve prima di iniziare
- Un account **Cloudflare** (gratis va bene) — token/login tuo (io non gestisco password).
- Il repo è già su GitHub: `github.com/richardamitrano-arch/ruzza-orologi`.
- La **chiave Anthropic** (già in `~/.ruzza_anthropic_key`) con qualche euro di credito.
- Nient'altro per la Fase A. (I token WhatsApp servono solo in Fase B.)

---

# FASE A — Deploy (senza Meta)

## A1. Crea il progetto Cloudflare Pages (collegato a GitHub)
1. `dash.cloudflare.com` → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Autorizza GitHub e scegli il repo **`ruzza-orologi`**, branch di produzione **`main`**.
3. **Build settings** (esatti):
   | Campo | Valore |
   |---|---|
   | Framework preset | *None* |
   | Build command | `npm run build:cloudflare` |
   | Build output directory | `dist-cloudflare` |
   | Root directory | *(lascia vuoto / `/`)* |
4. **Variabili d'ambiente di build** (Settings → build): aggiungi `NODE_VERSION` = `20`.
5. **Save and Deploy.** Il primo build gira `npm install` + build. Alla fine ottieni un URL tipo
   **`https://ruzza-orologi-xxx.pages.dev`** → **segnatelo**, è il tuo `SECRETARY_SITE_ORIGIN`.

> Le functions in `functions/` vengono compilate **da sole** (Cloudflare le rileva); `_routes.json`
> instrada `/api/*` alle functions. Non devi configurare nulla a mano.

## A2. Crea e collega il KV (la memoria delle conversazioni)
1. **Workers & Pages** → **KV** → **Create a namespace**: chiamalo `secretary` (il nome è libero).
2. Torna sul progetto Pages → **Settings → Bindings → Add → KV namespace**:
   - **Variable name**: `SECRETARY_KV` *(esatto, così com'è)*
   - **KV namespace**: quello appena creato
   - Environment: **Production**.

## A3. Metti le variabili d'ambiente (Settings → Variables and Secrets → Production)
Per la Fase A bastano queste. (Le `WHATSAPP_*` le aggiungi in Fase B.)

| Variabile | Valore | Note |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(la tua chiave)* | come **Secret** |
| `SECRETARY_SITE_ORIGIN` | l'URL `*.pages.dev` del punto A1 | **obbligatorio** (senza, catalogo vuoto) |
| `SECRETARY_DASHBOARD_TOKEN` | *(inventa una stringa lunga a caso)* | protegge il cockpit |
| `SECRETARY_MODEL` | `claude-sonnet-5` | opzionale (è già il default) |
| `SECRETARY_SUPERVISOR_MODEL` | `claude-haiku-4-5-20251001` | opzionale |
| `SECRETARY_PAUSED` | `true` | **sicurezza**: raccoglie, non invia |
| `SECRETARY_ACTIVE_HOURS` | `19:00-10:00` | opzionale (default) |
| `SECRETARY_TZ` | `Europe/Rome` | opzionale |
| `SECRETARY_RATE_CAP` | `25` | opzionale (cap/ora per mittente) |
| `SECRETARY_DAILY_CAP` | `400` | opzionale (tetto costi/giorno) |

Dopo aver salvato le variabili → **Deployments → Retry deployment** (le env valgono solo dopo un nuovo deploy).

## A4. Verifica Fase A (senza WhatsApp)
- **Cockpit**: apri `https://<tuo-url>.pages.dev/dashboard-segretaria?key=IL_TUO_SECRETARY_DASHBOARD_TOKEN`
  → deve caricare (con la key giusta passa da demo a **dati veri**, per ora vuoti).
- **Catalogo**: apri `https://<tuo-url>.pages.dev/api/shopify-products?store=orologi`
  → deve restituire JSON con i prodotti (è il catalogo pubblico Shopify, nessun token serve).
- **Webhook fail-closed (atteso)**: `https://<tuo-url>.pages.dev/api/whatsapp` in GET senza token → `403`;
  in POST senza `WHATSAPP_APP_SECRET` → `503`. È **giusto così** finché non fai la Fase B.

✅ Se cockpit e catalogo rispondono, la Segretaria è **deployata e viva** — manca solo collegarle WhatsApp.

---

# FASE B — Collega WhatsApp (quando hai i dati Meta)

Segui **`COLLEGA_NUMERI_WHATSAPP.md`** (setup Meta: WABA, System User token, App Secret, phone_number_id).
Poi torna qui e aggiungi le variabili WhatsApp su Cloudflare (Settings → Variables → Production):

| Variabile | Valore |
|---|---|
| `WHATSAPP_TOKEN` | token System User long-lived (Secret) |
| `WHATSAPP_APP_SECRET` | App Secret dell'app Meta (Secret) — **senza, il webhook rifiuta tutto** |
| `WHATSAPP_VERIFY_TOKEN` | stringa a tua scelta (la reinserisci in Meta) |
| `WHATSAPP_WATCHES_PHONE_NUMBER_ID` | phone_number_id del numero orologi (+39 331 968 9707) |
| `WHATSAPP_BAGS_PHONE_NUMBER_ID` | phone_number_id del numero borse (+39 320 386 3817) |
| `WHATSAPP_LUXURY_PHONE_NUMBER_ID` | se hai un numero luxury dedicato |

Poi **Retry deployment**. Quindi in Meta → App → WhatsApp → **Configuration → Webhook**:
- Callback URL: `https://<tuo-url>.pages.dev/api/whatsapp`
- Verify token: lo stesso `WHATSAPP_VERIFY_TOKEN`
- **Subscribe** al campo **`messages`**.

## Accensione sicura (obbligatoria prima dei clienti)
1. `SECRETARY_PAUSED` resta `true` → manda un messaggio di test al numero.
2. Guarda che **compaia nel cockpit** e nei **log** (Cloudflare → progetto → Deployments → Functions logs):
   niente errori, firma HMAC ok, canale giusto.
3. Solo quando sei sicuro: metti `SECRETARY_PAUSED` = `false` (o rimuovila) → **Retry deployment**.
   Ora risponde davvero — ma **solo nella finestra 19:00–10:00**; di giorno raccoglie e basta.

---

## Promemoria costi & sicurezza
- ~**1 centesimo a conversazione-turno** (Sonnet + Haiku). Tetto di sicurezza `SECRETARY_DAILY_CAP=400`.
- `.env.secretary` (i valori reali) **non è mai committato**; qui i segreti stanno solo su Cloudflare.
- Le regole ferree (no sconti/stime/permute/chiamate-in-uscita/appuntamenti-Lorenzo/ricontatto/riserve)
  sono nel codice e verificate: **47/47** test offline (`node scripts/guardrails-test.mjs`) +
  **23 scenari** col simulatore (`ANTHROPIC_API_KEY=… node scripts/secretary-sim.mjs`).

## Se qualcosa non va
- **Build fallisce**: controlla `NODE_VERSION=20`. Il build usa `package-lock.json` (npm), non pnpm.
- **Cockpit resta su demo**: manca/è sbagliato `?key=` o `SECRETARY_DASHBOARD_TOKEN`.
- **Catalogo vuoto**: `SECRETARY_SITE_ORIGIN` non impostato o URL sbagliato → poi Retry deployment.
- **Cambio env non fa effetto**: su Cloudflare Pages le variabili valgono **solo dopo un nuovo deploy**.
