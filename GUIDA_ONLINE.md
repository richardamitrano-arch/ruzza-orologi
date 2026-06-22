# Guida — mettere il sito online (qualsiasi host)

Due parti:
- **Parte A — tu (Richard):** pubblichi il sito e mandi il link. 5 minuti.
- **Parte B — il cliente (Lorenzo):** collega il SUO dominio e gestisce foto/prezzi.

Il sito è già pronto: `npm run build` → cartella `dist/`. Le config di deploy
(`netlify.toml`, `vercel.json`, `public/_redirects`, `404.html`) sono incluse, quindi
le rotte `/orologi` e `/borse` funzionano ovunque senza configurare niente.

---

## PARTE A — Pubblicare e mandare il link (per te)

Prima genera la build (una volta):

```bash
npm install
npm run build
```

Poi scegli **una** strada. Tutte danno un link condivisibile.

### Opzione 1 — Netlify Drop (più veloce, senza account git)
1. Vai su **app.netlify.com/drop**
2. Trascina la cartella **`dist/`**
3. Ottieni subito un link tipo `https://nome-a-caso.netlify.app` → mandalo.

### Opzione 2 — Vercel (da repo GitHub)
1. Metti il progetto su GitHub.
2. vercel.com → **New Project → Import** il repo.
3. Vercel legge `vercel.json` da solo. **Deploy.** Link `…vercel.app`.

### Opzione 3 — Cloudflare Pages (da repo GitHub)
1. Progetto su GitHub.
2. Cloudflare → Pages → **Connect to Git**.
3. Build command `npm run build`, output `dist`. **Deploy.** Link `…pages.dev`.

> Da repo (opz. 2/3): a ogni `git push` il sito si ri-pubblica da solo.
> Con Netlify Drop (opz. 1): per aggiornare, rifai `npm run build` e ritrascini `dist/`.

**Fatto: copi il link e lo mandi a Lorenzo.**

---

## PARTE B — Per il cliente (Lorenzo)

### B1. Collegare il SUO dominio personale
Vale per qualsiasi host (Netlify / Vercel / Cloudflare):

1. Nel pannello dell'host: **Domains / Custom domain → Add domain** → scrivi il dominio
   (es. `ruzzaorologi.com`).
2. L'host mostra **dove puntare il dominio**. Dal pannello del registrar del dominio
   (dove l'ha comprato) imposta:
   - **dominio "nudo"** (`ruzzaorologi.com`): record **A** (o ALIAS) verso l'IP/target che indica l'host;
   - **www** (`www.ruzzaorologi.com`): record **CNAME** verso il target dell'host.
3. L'**HTTPS (lucchetto)** lo attiva l'host da solo in pochi minuti.

> Tempo di propagazione DNS: da pochi minuti a qualche ora.

### B2. Mettere/aggiornare foto e prezzi
Il cliente **non tocca il codice**: lavora su **Shopify**.

- **Orologi** → Shopify `ruzzaorologi.com`, collezione `orologi`; brand nei tag/titolo
  (es. `Rolex`, `Patek Philippe`).
- **Borse** → collezione `luxury-bags`; brand da vendor/tag/titolo.
- **Ruzza Watch** → `ruzzawatch.com`.
- Per ogni prodotto su Shopify si gestiscono: **foto, prezzo** (0 = "su richiesta"),
  **disponibilità, descrizione, brand, collezione**.

Dopo le modifiche su Shopify, il catalogo del sito si rigenera con:

```bash
npm run build:fresh     # riscarica i prodotti da Shopify + ricompila
```

…poi si ripubblica (push se da repo, o ri-trascina `dist/` se Netlify Drop).

> **Automatico (consigliato per il cliente):** collegando il repo a Netlify/Vercel/
> Cloudflare si può creare un **Deploy Hook** e chiamarlo da Shopify (Flow/webhook) a
> ogni prodotto creato/modificato → il sito si aggiorna da solo. Dettagli in
> `CLIENT_HANDOFF.md`.

---

## Da completare prima del go-live
Tutto in `src/lib/contact.ts` (+ footer): **P.IVA**, conferma **email** e **WhatsApp**,
e il **dominio** ufficiale. Vedi `README.md`.
