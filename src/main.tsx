import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { prepareLiveCommerce } from './data/liveCommerce'

const removeBoot = () => document.getElementById('boot')?.remove()

// Ricarica UNA sola volta (anti-loop) — recupero pulito.
const reloadOnce = () => {
  if (!sessionStorage.getItem('ruzza-reloaded')) {
    sessionStorage.setItem('ruzza-reloaded', '1')
    window.location.reload()
  }
}

// Chunk non caricabile (es. HTML in cache dopo un redeploy che punta a un hash
// vecchio ormai 404): Vite emette 'vite:preloadError' → ricarico per prendere
// l'HTML aggiornato. SENZA questo lo splash resterebbe bloccato (era IL bug).
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault()
  reloadOnce()
})

async function boot() {
  const { default: App } = await import('./App.tsx')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  removeBoot()
  // boot riuscito → azzera il guard di reload per le visite future
  sessionStorage.removeItem('ruzza-reloaded')
  // I prodotti live non devono bloccare il primo render: snapshot immediato, poi
  // aggiornamento Shopify in background appena il proxy risponde.
  void prepareLiveCommerce()
}

// Rete di sicurezza ASSOLUTA: qualunque errore nel boot NON deve mai lasciare lo
// splash #boot a coprire il sito. Tolgo sempre lo splash e tento un reload unico.
void boot().catch((err) => {
  console.error('Ruzza boot failed:', err)
  removeBoot()
  reloadOnce()
})
