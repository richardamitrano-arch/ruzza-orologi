import { Capacitor } from '@capacitor/core'
import { useEffect, useState } from 'react'

import { useLenis } from './lib/useLenis'
import LoadingScreen from './components/LoadingScreen'
import Nav from './components/Nav'
import SearchOverlay from './components/SearchOverlay'
import Atmosphere from './components/Atmosphere'
import DedicatedBagPage from './components/DedicatedBagPage'
import DedicatedJewelryPage from './components/DedicatedJewelryPage'
import DedicatedWatchPage from './components/DedicatedWatchPage'
import NovitaPage from './components/NovitaPage'
import ProductDetailPage from './components/ProductDetailPage'
import SecretaryDashboard from './components/SecretaryDashboard'
import MobileWatchSalesApp from './components/MobileWatchSalesApp'
import LorenzoHero from './components/LorenzoHero'
import HeroSequence from './components/HeroSequence'
import RuzzaLineup from './components/RuzzaLineup'
import WatchShowcase from './components/WatchShowcase'
import Manifesto from './components/Manifesto'
import ContactDock from './components/ContactDock'
import WatchMaisons from './components/WatchMaisons'
import CatalogScroll from './components/CatalogScroll'
import WatchCatalog from './components/WatchCatalog'
import LuxuryBagsFilm from './components/LuxuryBagsFilm'
import LuxuryBags from './components/LuxuryBags'
import JewelryCatalog from './components/JewelryCatalog'
import PerfumeCatalog from './components/PerfumeCatalog'
import Heritage from './components/Heritage'
import Valuation from './components/Valuation'
import Newsletter from './components/Newsletter'
import ClosingFilm from './components/ClosingFilm'
import Footer from './components/Footer'
import { appPath } from './lib/routing'
import { productByHandle, refreshCommerceData } from './data/commerce'

export default function App() {
  useLenis()
  const [, setCommerceVersion] = useState(0)
  const [locationSignature, setLocationSignature] = useState(
    () => `${window.location.pathname}${window.location.search}${window.location.hash}`,
  )

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const onCommerceUpdated = () => {
      refreshCommerceData()
      setCommerceVersion((version) => version + 1)
    }

    window.addEventListener('ruzza:commerce-updated', onCommerceUpdated)
    return () => window.removeEventListener('ruzza:commerce-updated', onCommerceUpdated)
  }, [])

  useEffect(() => {
    const onLocationChange = () => {
      setLocationSignature(`${window.location.pathname}${window.location.search}${window.location.hash}`)
    }

    window.addEventListener('popstate', onLocationChange)
    window.addEventListener('hashchange', onLocationChange)
    return () => {
      window.removeEventListener('popstate', onLocationChange)
      window.removeEventListener('hashchange', onLocationChange)
    }
  }, [])

  const path = appPath()
  const isWatchPage = path === '/orologi'
  const isBagPage = path === '/borse'
  const isJewelryPage = path === '/gioielli'
  const isNewPage = path === '/novita'
  const isSecretaryDashboard = path === '/dashboard-segretaria'
  const isWatchSalesApp = path === '/app-orologi'
  const isNativeWatchApp = Capacitor.isNativePlatform() && path === '/'
  const productMatch = path.match(/^\/products\/([^/]+)$/)
  const productHandle = productMatch ? decodeURIComponent(productMatch[1]) : ''
  const params = new URLSearchParams(window.location.search)
  const initialWatchBrand = params.get('brand') || 'Tutti'
  const initialBagBrand = params.get('brand') || 'Tutti'
  const initialJewelryBrand = params.get('brand') || 'Tutti'

  // Numero WhatsApp giusto per il dock fluttuante in base alla categoria della pagina:
  // borse/gioielli → numero ruzzabags, tutto il resto → numero principale.
  const contactCategory = productHandle
    ? productByHandle(productHandle)?.category
    : isBagPage
      ? 'luxury-bags'
      : isJewelryPage
        ? 'gioielli'
        : undefined

  useEffect(() => {
    document.documentElement.classList.toggle('ruzza-home-route', path === '/')
    return () => {
      document.documentElement.classList.remove('ruzza-home-route')
    }
  }, [path])

  useEffect(() => {
    if (!window.location.hash) return
    const id = decodeURIComponent(window.location.hash.slice(1))
    let raf = 0
    let retry = 0

    const scrollToHash = () => {
      const target = document.getElementById(id)
      if (!target) return
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
  }, [path, locationSignature])

  useEffect(() => {
    if (window.location.hash) return

    let raf = 0
    let retry = 0

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    raf = requestAnimationFrame(scrollToTop)
    retry = window.setTimeout(scrollToTop, 120)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(retry)
    }
  }, [path, locationSignature])

  useEffect(() => {
    if (path !== '/') {
      document.documentElement.classList.remove('ruzza-footer-free')
      return
    }

    const desktopSnap = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)')
    let raf = 0

    const updateFooterSnapEscape = () => {
      window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        const footer = document.querySelector('footer')
        const rect = footer?.getBoundingClientRect()
        const footerVisible = !!rect && rect.top < window.innerHeight && rect.bottom > 0
        document.documentElement.classList.toggle('ruzza-footer-free', desktopSnap.matches && footerVisible)
      })
    }

    updateFooterSnapEscape()
    window.addEventListener('scroll', updateFooterSnapEscape, { passive: true })
    window.addEventListener('resize', updateFooterSnapEscape, { passive: true })
    desktopSnap.addEventListener('change', updateFooterSnapEscape)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', updateFooterSnapEscape)
      window.removeEventListener('resize', updateFooterSnapEscape)
      desktopSnap.removeEventListener('change', updateFooterSnapEscape)
      document.documentElement.classList.remove('ruzza-footer-free')
    }
  }, [path])

  if (productHandle) {
    return (
      <div id="top" className="relative">
        <Atmosphere />
        <ContactDock compact category={contactCategory} />
        <Nav />
        <SearchOverlay />
        <ProductDetailPage handle={productHandle} />
        <Footer />
      </div>
    )
  }

  if (isSecretaryDashboard) {
    return <SecretaryDashboard />
  }

  if (isWatchSalesApp || isNativeWatchApp) {
    return <MobileWatchSalesApp />
  }

  if (isWatchPage) {
    return (
      <div id="top" className="relative">
        <Atmosphere />
        <ContactDock compact category={contactCategory} />
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
        <ContactDock compact category={contactCategory} />
        <Nav />
        <SearchOverlay />
        <DedicatedBagPage initialBrand={initialBagBrand} />
        <Footer />
      </div>
    )
  }

  if (isJewelryPage) {
    return (
      <div id="top" className="relative">
        <Atmosphere />
        <ContactDock compact category={contactCategory} />
        <Nav />
        <SearchOverlay />
        <DedicatedJewelryPage initialBrand={initialJewelryBrand} />
        <Footer />
      </div>
    )
  }

  if (isNewPage) {
    return (
      <div id="top" className="relative">
        <Atmosphere />
        <ContactDock compact category={contactCategory} />
        <Nav />
        <SearchOverlay />
        <NovitaPage />
        <Footer />
      </div>
    )
  }

  return (
    <div id="top" className="relative">
      <LoadingScreen />
      <Atmosphere />
      <ContactDock category={contactCategory} />
      <Nav />
      <SearchOverlay />
      <main className="home-main">
        <h1 className="sr-only">Ruzza Orologi — Alta orologeria di lusso a Milano dal 2017</h1>
        <LorenzoHero />
        <Manifesto />
        <HeroSequence />
        <RuzzaLineup />
        <WatchShowcase />
        <WatchMaisons />
        <CatalogScroll />
        <WatchCatalog />
        <LuxuryBagsFilm />
        <LuxuryBags />
        <JewelryCatalog />
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
