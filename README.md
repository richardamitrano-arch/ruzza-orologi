# Ruzza Orologi — sito

Sito vetrina React + Vite per Ruzza Orologi. Catalogo (orologi, Ruzza Watch,
luxury bags, profumi) generato da uno snapshot in `src/data/commerce.json`.

Gestore pacchetti: **npm** (un solo lockfile, `package-lock.json`).

---

## 1. Avvio locale

```bash
npm install
npm run dev
```

Apri l'URL che stampa Vite (di default `http://localhost:5173`).

## 2. Build di produzione

```bash
npm run build      # genera la cartella dist/  (+ 404.html per il routing)
npm run preview    # prova la build in locale
```

Output: **`dist/`**.

---

## 3. Deploy — plug & play (zero configurazione)

I file di deploy sono **già inclusi**: collega il repo all'host e parte da solo.

| Host | Cosa fare | Config usata |
|------|-----------|--------------|
| **Netlify** | "Add new site → Import" e basta | `netlify.toml` |
| **Vercel** | "New Project → Import" e basta | `vercel.json` |
| **Cloudflare Pages** | Build `npm run build`, output `dist` | `public/_redirects` |
| **Netlify Drop** | trascina la cartella `dist/` su app.netlify.com/drop | — |
| **GitHub Pages** | pubblica `dist/` | `404.html` |

Tutti usano: **build `npm run build`**, **output `dist`**.

**Routing già risolto:** le pagine `/orologi` e `/borse` sono rotte
client-side. Il fallback SPA è incluso (`_redirects`, `vercel.json`,
`netlify.toml`, `404.html`), quindi link diretti e refresh funzionano ovunque.

> Per il deploy si usa `npm run build` (catalogo dallo snapshot committato):
> affidabile, non dipende da scraping live. Per **aggiornare il catalogo** vedi
> sotto, poi committa e ripubblica.

---

## 4. Dove si modifica (senza toccare il resto del codice)

- **Contatti, social, indirizzo, link collezioni** → un solo file:
  [`src/lib/contact.ts`](src/lib/contact.ts)
- **Prodotti** → `src/data/commerce.json`. Per rigenerarlo dalle fonti pubbliche
  Shopify:
  ```bash
  npm run sync:commerce       # rigenera lo snapshot
  npm run build:fresh         # sync + build insieme
  ```
- **Video hero, immagini** → cartella `public/media/`

Il cliente carica/aggiorna i prodotti **da Shopify** (vedi `CLIENT_HANDOFF.md`),
non dal codice.

---

## 5. Dati azienda

Verificati dal sito ufficiale `ruzzaorologi.com` (giugno 2026) e già nel sito —
tutto centralizzato in `src/lib/contact.ts`:

- **Ragione sociale:** Ruzza Orologi S.r.l.
- **P.IVA:** 11049590968 (in footer)
- **Indirizzo:** Via Cesare Battisti 8 · 20122 Milano
- **Tel / WhatsApp:** +39 331 9689707
- **Email:** labottegadeltempo@yahoo.com
- **Social:** Instagram / Facebook `ruzzaorologi`, Telegram `lorenzoruzza`

Resta da decidere solo il **dominio** ufficiale del nuovo sito (vedi `GUIDA_ONLINE.md`)
e, se si vuole l'aggiornamento catalogo automatico, il deploy hook Shopify.
