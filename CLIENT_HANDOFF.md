# Handoff Cliente Ruzza

## Come consegnarlo

La consegna pulita non e un file ZIP lasciato li: e un sito collegato a Shopify.

Setup consigliato:

1. Repo GitHub con questo progetto.
2. Deploy su Vercel, Netlify o Cloudflare Pages — i file di config (`netlify.toml`,
   `vercel.json`, `public/_redirects`) sono **già inclusi**: l'host li rileva da solo
   (build `npm run build`, output `dist`, fallback SPA per `/orologi` e `/borse`).
3. Per **aggiornare il catalogo** da Shopify: in locale `npm run build:fresh`, poi
   commit + push (il deploy in cloud usa `npm run build` sullo snapshot committato,
   così la pubblicazione non dipende dallo scraping live).
4. (Opzionale) Deploy hook collegato agli eventi Shopify prodotti/collezioni per
   ricompilare in automatico.

In questo modo il cliente carica i prodotti da Shopify e il sito si aggiorna al build successivo.

## Cosa fa il cliente

Il cliente entra in Shopify e gestisce:

- titolo prodotto
- prezzo o prezzo zero per "su richiesta"
- disponibilita
- immagini
- descrizione
- brand tramite vendor, tag o titolo
- collezione corretta

Non deve aprire il codice.

## Dove caricare i prodotti

Orologi:

- Shopify `ruzzaorologi.com`
- collezione `orologi`
- brand riconosciuti da tag/titolo, per esempio `Rolex`, `Patek Philippe`, `Audemars Piguet`

Luxury Bags:

- Shopify `ruzzaorologi.com`
- collezione `luxury-bags`
- brand riconosciuti da vendor/tag/titolo, per esempio `Chanel`, `Hermes`, `Louis Vuitton`, `Gucci`, `Dior`, `Prada`

Ruzza Watch:

- Shopify `ruzzawatch.com`
- prodotti con titolo/handle `Ruzza Watch`
- `Luxury` e `Basic` vengono separati automaticamente dal titolo/handle

Profumi:

- sezione editoriale Prestigious sul sito
- immagini e layout riprendono la pagina originale Lorenzo Ruzza
- se in futuro vanno gestiti come prodotti veri, conviene creare una collezione Shopify dedicata e collegarla allo script di sync

## Come si aggiorna il sito

Il sito usa `src/data/commerce.json`.

Lo script `scripts/sync-commerce.mjs` rigenera quel file dalle fonti pubbliche:

```bash
npm run sync:commerce
```

Il comando di produzione consigliato fa sync + build:

```bash
npm run build:fresh
```

## Deploy hook Shopify

Su Vercel/Netlify/Cloudflare:

1. creare un deploy hook del progetto
2. copiare l'URL segreto del hook
3. in Shopify usare Flow, una app webhook o una piccola Cloudflare Worker per chiamare quel hook quando cambiano i prodotti

Eventi da collegare:

- product created
- product updated
- product deleted
- collection updated

Risultato: il cliente lavora su Shopify, il sito si ricompila da solo.

## Limite attuale

Lo sync usa endpoint pubblici Shopify. Quindi mostra solo prodotti pubblicati. Se il cliente vuole vedere anche bozze, inventario privato o metadati non pubblici, serve aggiungere una Shopify Admin API key in ambiente deploy.
