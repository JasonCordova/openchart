import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

const PriceMap = lazy(() => import('./components/PriceMap/PriceMap'))

export default function App() {
  const [page, setPage] = useState<'landing' | 'leaving' | 'entering' | 'workspace'>('landing')
  const [isBlurFinished, setIsBlurFinished] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const handleMapReady = useCallback(() => setIsMapReady(true), [])
  const [isMotionPaused, setIsMotionPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (page === 'leaving' && isBlurFinished && isMapReady) {
      setPage(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'workspace' : 'entering')
    }
  }, [page, isBlurFinished, isMapReady])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = (event: MediaQueryListEvent) => {
      setIsMotionPaused(event.matches)
      if (event.matches) {
        setIsBlurFinished(true)
        setPage((current) => current === 'entering' ? 'workspace' : current)
      }
    }
    preference.addEventListener('change', updateMotion)
    return () => preference.removeEventListener('change', updateMotion)
  }, [])

  useEffect(() => {
    if (page === 'workspace') {
      window.scrollTo(0, 0)
    }
  }, [page])

  function explorePrices() {
    if (page !== 'landing') return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setIsBlurFinished(prefersReducedMotion)
    setPage('leaving')
  }

  return (
    <>
      {page !== 'landing' && (
        <div
          className="map-stage"
          data-visible={page === 'entering' || page === 'workspace'}
          data-entering={page === 'entering'}
          inert={page !== 'workspace'}
          aria-hidden={page !== 'workspace'}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && event.animationName === 'map-enter') {
              setPage('workspace')
            }
          }}
        >
          <Suspense fallback={null}>
            <PriceMap onReady={handleMapReady} isActive={page === 'workspace'} />
          </Suspense>
        </div>
      )}
      {page !== 'workspace' && (
        <div className="landing-page" inert={page !== 'landing'}>
          <a className="skip-link" href="#main">Skip to content</a>

          <div className="ambient" data-motion={isMotionPaused || page !== 'landing' ? 'paused' : 'playing'} aria-hidden="true">
            <div className="ambient__field" />
            <div className="ambient__veil" />
          </div>

          <main className="main-content" id="main">
            <section className="hero" aria-labelledby="hero-title">
              <p className="hero__tagline">Hospital prices, a little clearer.</p>
              <h1 id="hero-title">OpenChart<span className="title-period">.</span></h1>
              <p className="hero__description">
                Explore procedure prices and compare hospitals by location
                <br className="desktop-break" />
                {' '}with pricing information published by hospitals.
              </p>
              <button className="enter-button" type="button" onClick={explorePrices}>
                Explore prices
              </button>
            </section>

            <aside className="price-notice" aria-labelledby="price-notice-title">
              <svg className="price-notice__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="7.5" r="1" fill="currentColor" />
              </svg>
              <div>
                <h2 id="price-notice-title">Prices are estimates.</h2>
                <p>
                  Hospital-provided prices may differ from your final bill and are not always
                  updated in real time; confirm current pricing directly with the hospital.
                </p>
              </div>
            </aside>
          </main>

          <footer className="site-footer">
            <span>© {new Date().getFullYear()} OpenChart</span>
            <button
              className="motion-toggle"
              type="button"
              aria-label={isMotionPaused ? 'Play background animation' : 'Pause background animation'}
              title={isMotionPaused ? 'Play background animation' : 'Pause background animation'}
              onClick={() => setIsMotionPaused((paused) => !paused)}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
                {isMotionPaused ? (
                  <path d="m5 3 7 5-7 5V3Z" fill="currentColor" />
                ) : (
                  <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </footer>

          {page !== 'landing' && (
            <div
              className="page-transition"
              aria-hidden="true"
              onAnimationEnd={(event) => {
                if (event.animationName === 'page-exit') setIsBlurFinished(true)
              }}
            />
          )}
        </div>
      )}
    </>
  )
}
