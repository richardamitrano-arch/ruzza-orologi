# Collegare i numeri WhatsApp alla Segretaria — runbook

Il codice è già pronto (multi-numero, routing per `phone_number_id`, webhook `/api/whatsapp`, coesistenza,
cockpit su `/dashboard-segretaria`). Questo è il processo per accendere. Ordine consigliato.

## 0. Prima di tutto — chi controlla i numeri
Dai siti pubblici risultano **2 numeri**:
- **+39 331 968 9707** → store ruzza-orologi (**tuo**) — canale *orologi*.
- **+39 320 386 3817** → ruzzawatch.com **e** ruzzabags.com (condiviso, store gestiti da altri) — canali *watch/borse*.
- *Luxury*: numero da confermare con Lorenzo (dedicato? o = orologi?).

➡️ **Serve sapere di chi è il Meta/Business Manager (WABA) di ciascun numero.** Un numero lo colleghi solo se
hai (o Lorenzo ha) accesso al suo Business Manager. Il `320…3817` sta su store non tuoi → verificare con Lorenzo.

## 1. Meta Business Manager
1. `business.facebook.com` → **Business Manager** di Lorenzo/Ruzza (quello che possiede i numeri).
2. **WhatsApp Accounts (WABA)**: idealmente i numeri sotto **UN** WABA (così basta un token).
3. **Aggiungi i numeri** al WABA (Add phone number) e completa la **verifica** di ognuno.
   - ⚠️ **Coesistenza**: un numero sulla Cloud API **non** può restare anche sull'app WhatsApp Business
     "normale" del telefono, salvo la modalità *coexistence* (recente, limitata). Decidere per ogni numero:
     dedicarlo all'agente **oppure** usare coexistence per far continuare Lorenzo a scrivere a mano.
4. Per ogni numero copia il **Phone number ID** (te lo dà Meta, è diverso dal numero).

## 2. App Meta + token + secret
1. `developers.facebook.com` → l'**app** collegata al WABA (prodotto *WhatsApp*).
2. **System User** (in Business Settings) con permessi `whatsapp_business_messaging` + `whatsapp_business_management`
   → genera un **token long-lived** = `WHATSAPP_TOKEN` (uno solo per tutti i numeri dello stesso Business).
3. **App Secret** (Impostazioni app → Basic) = `WHATSAPP_APP_SECRET` (firma webhook).
4. Scegli una stringa qualsiasi per `WHATSAPP_VERIFY_TOKEN` (la reinserisci al punto 4).

## 2-bis. Dove trovo ogni valore in Meta (per estrapolarli)
| Variabile | Dove sta in Meta |
|---|---|
| **phone_number_id** (uno per numero) | App (developers.facebook.com) → **WhatsApp → API Setup**: menu "From", sotto il numero c'è **"Phone number ID"** (è l'ID, non il numero). Lì c'è anche il **WABA ID** |
| **WHATSAPP_TOKEN** | Business Settings → **Utenti di sistema** → Genera token → app + permessi `whatsapp_business_messaging`,`whatsapp_business_management` (long-lived). Per test veloce: **token temporaneo 24h** in API Setup |
| **WHATSAPP_APP_SECRET** | App → **Impostazioni → Di base → Chiave segreta (App secret)** → Mostra |
| **WHATSAPP_VERIFY_TOKEN** | **lo inventi tu** (stringa qualsiasi), poi identica nel webhook |
| **SECRETARY_DASHBOARD_TOKEN** | **lo inventi tu** (stringa lunga a caso) |
| **ANTHROPIC_API_KEY** | già disponibile (`~/.ruzza_anthropic_key`) |
| **SECRETARY_SITE_ORIGIN** | dominio del sito |

⚠️ Puoi estrarre phone_number_id/token solo dei numeri in un Business/App **a cui hai accesso**. Il `393319689707` (tuo) sì; il `393203863817` (ruzzawatch/ruzzabags) solo se hai accesso a quel Business — altrimenti li passa chi lo gestisce.

## 3. Variabili
1. `cp .env.secretary.example .env.secretary` e riempi (token, i `*_PHONE_NUMBER_ID`, secret, verify, dashboard token, site origin).
2. **Preflight**: `node tools/whatsapp-preflight.mjs` → deve diventare tutto ✅ (verifica numeri/token sulla Graph API).
3. Le stesse chiavi vanno poi su **Cloudflare Pages → Settings → Environment variables**, + KV namespace bindato come **`SECRETARY_KV`**.

## 4. Webhook Meta
1. Nell'app Meta → WhatsApp → **Configuration → Webhook**.
2. Callback URL: `https://<dominio>/api/whatsapp` · Verify token: `WHATSAPP_VERIFY_TOKEN`.
3. **Subscribe** al campo **`messages`** (e, se usi coesistenza, ai campi echo/`smb_message_echoes`).

## 5. Accensione sicura → verifica → live
1. Primo deploy con **`SECRETARY_PAUSED=true`**: **raccoglie e basta** — salva i messaggi in dashboard, **zero AI e zero invii** (accensione sicura a costo zero). ⚠️ **`WHATSAPP_APP_SECRET` è obbligatorio**: senza, il webhook rifiuta tutto (fail-closed).
2. Manda un messaggio di test al numero → guarda che compaia nel cockpit (`/dashboard-segretaria?key=<SECRETARY_DASHBOARD_TOKEN>`).
3. Controlla i log Cloudflare (niente errori, firma HMAC ok, routing sul canale giusto).
4. Quando sei sicuro: togli `SECRETARY_PAUSED` → la segretaria risponde (solo nella finestra **19:00–10:00**, di giorno raccoglie e basta).

## Promemoria regole (già nel codice)
Mai sconti/stime/permute · mai chiamate in uscita (solo in entrata) · mai appuntamenti/incontri con Lorenzo ·
mai "ricontattare" · **mai riserve/prenotazioni** → tutto raccolto e passato al team, si continua su WhatsApp.
Prezzi €0/€1 = "su richiesta". Se il team scrive a mano (coesistenza) → stato UMANO_IN_CARICO, la segretaria tace.

## Test senza Meta (già disponibile)
`ANTHROPIC_API_KEY=… node scripts/secretary-sim.mjs` → 23 scenari (trattative, sconti, riserve, provenienza, multilingua).
