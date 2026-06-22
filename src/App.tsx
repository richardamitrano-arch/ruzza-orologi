import { useEffect } from 'react'

import { useLenis } from './lib/useLenis'
import Nav from './components/Nav'
import SearchOverlay from './components/SearchOverlay'
import Atmosphere from './components/Atmosphere'
import DedicatedBagPage from './components/DedicatedBagPage'
import DedicatedWatchPage from './components/DedicatedWatchPage'
import LorenzoHero from './components/LorenzoHero'
import HeroSequence from './components/HeroSequence'
import RuzzaLineup from './components/RuzzaLineup'
import Manifesto from './components/Manifesto'
import ContactDock from './components/ContactDock'
import WatchMaisons from './components/WatchMaisons'
import WatchCatalog from './components/WatchCatalog'
import LuxuryBagsFilm from './components/LuxuryBagsFilm'
import LuxuryBags from './components/LuxuryBags'
import PerfumeCatalog from './components/PerfumeCatalog'
import Heritage from './components/Heritage'
import Valuation from './components/Valuation'
import Newsletter from './components/Newsletter'
import ClosingFilm from './components/ClosingFilm'
import Footer from './components/Footer'
import { appPath } from './lib/routing'

export default function App() {
  useLenis()
  const path = appPath()
  const isWatchPage = path === '/orologi'
  const isBagPage = path === '/borse'
  const params = new URLSearchParams(window.location.search)
  const initialWatchBrand = params.get('brand') || 'Tutti'
  const initialBagBrand = params.get('brand') || 'Tutti'

  useEffect(() => {
    if (!window.location.hash) return
    const id = decodeURIComponent(window.location.hash.slice(1))
    let raf = 0
    let retry = 0

    const scrollToHash = () => {
      const target = document.getElementById(id)
      if (!target) return
      if (id === 'ruzza-watch-video') {
        window.dispatchEvent(new Event('ruzza:play-watch-film'))
        return
      }
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY,
        behavior: 'auto',
      })
    }

    raf = requestAnimationFrame(scrollToHash)
    retry = window.setTimeout(scrollToHash, 120)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(retry)
    }
  }, [path])

  if (isWatchPage) {
    return (
      <div id="top" className="relative">
        <Atmosphere />
        <ContactDock />
        <Nav />
        <SearchOverlay />
        <DedicatedWatchPage initialBrand={initialWatchBrand} />
        <Footer />
      </div>
    )
  }

  if (isBagPage) {
    return (
      <div id="top" className="relative">
        <Atmosphere />
        <ContactDock />
        <Nav />
        <SearchOverlay />
        <DedicatedBagPage initialBrand={initialBagBrand} />
        <Footer />
      </div>
    )
  }

  return (
    <div id="top" className="relative">
      <Atmosphere />
      <ContactDock />
      <Nav />
      <SearchOverlay />
      <main>
        <h1 className="sr-only">Ruzza Orologi — Alta orologeria di lusso a Milano dal 2017</h1>
        <LorenzoHero />
        <Manifesto />
        <HeroSequence />
        <RuzzaLineup />
        <WatchMaisons />
        <WatchCatalog />
        <LuxuryBagsFilm />
        <LuxuryBags />
        <ClosingFilm />
        <PerfumeCatalog />
        <Heritage />
        <Valuation />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}
