import { useState, useEffect, useMemo, useCallback } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTrips } from './hooks/useTrips'
import { useTheme } from './hooks/useTheme'
import { useDataSaver } from './hooks/useDataSaver'
import { TripListScreen } from './components/TripListScreen'
import { TrackingScreen } from './components/TrackingScreen'
import { TripRail } from './components/TripRail'
import { AddTripSheet } from './components/AddTripSheet'
import { Logo } from './components/Logo'
import { DataSourceNote } from './components/SupportedServices'
import { DEMO_KEY, DEMO_REFRESH_MS, isDemoKey, makeDemoTrip, resetDemo } from './demo/demoApi'

type TripsAPI = ReturnType<typeof useTrips>

interface PageProps {
  tripsAPI: TripsAPI
  saver: ReturnType<typeof useDataSaver>
  isDark: boolean
  onToggleTheme: () => void
  onOpenAdd: () => void
  onStartDemo: () => void
}

// ── Routes ────────────────────────────────────────────────────────────────────

function ListPage({ tripsAPI, saver, isDark, onToggleTheme, onOpenAdd, onStartDemo }: PageProps) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const animClass =
    (state as { dir?: string } | null)?.dir === 'back' ? 'animate-slide-in-left' : ''

  const open = (key: string) => navigate(`/track/${key}`, { state: { dir: 'forward' } })

  return (
    <>
      {/* Phones and tablets get the list as a full screen. */}
      <div className="lg:hidden">
        <TripListScreen
          trips={tripsAPI.trips}
          onOpenTrip={trip => open(trip.key)}
          onRemoveTrip={tripsAPI.removeTrip}
          onAdd={onOpenAdd}
          onQuickAdd={(url, name) => {
            const result = tripsAPI.addTrip(url, name)
            if (result.success && result.trip) open(result.trip.key)
            return result
          }}
          onStartDemo={onStartDemo}
          dataSaver={saver.dataSaver}
          onToggleDataSaver={saver.toggleDataSaver}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          animClass={animClass}
        />
      </div>

      {/* On desktop the list already lives in the rail, so the detail pane
          explains itself instead of repeating it. */}
      <div className="hidden lg:flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center">
        <Logo size={44} showWordmark={false} />
        <div className="flex flex-col gap-2.5 max-w-sm">
          <h1 className="font-display font-semibold text-[32px] leading-tight tracking-[-0.03em] text-ink">
            {tripsAPI.trips.length ? 'Pick a trip' : 'Track any bus. No sign-up.'}
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
            {tripsAPI.trips.length
              ? 'Choose a saved trip on the left to watch it live.'
              : 'Paste the tracking link your operator sent you. Everything stays on this device.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAdd}
            className="px-5 py-3 rounded-field bg-signal text-signal-ink font-semibold text-sm
                       hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
          >
            Add a bus
          </button>
          <button
            onClick={onStartDemo}
            className="px-5 py-3 rounded-field border border-line font-semibold text-sm text-ink-3
                       hover:text-ink hover:border-line-strong transition-all cursor-pointer"
          >
            Try a sample trip
          </button>
        </div>
        <div className="w-full max-w-sm text-left">
          <DataSourceNote />
        </div>
      </div>
    </>
  )
}

function TrackPage({ tripsAPI, saver, isDark, onToggleTheme, onOpenAdd }: PageProps) {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const animClass =
    (state as { dir?: string } | null)?.dir === 'forward' ? 'animate-slide-in-right' : ''

  const isDemo = !!key && isDemoKey(key)

  // The sample trip is built on the fly and never saved, so it cannot appear in
  // the real trip list or survive a reload.
  const demoTrip = useMemo(() => (isDemo ? makeDemoTrip() : null), [isDemo])

  const exitDemo = () => {
    resetDemo()
    try {
      localStorage.removeItem(`bus-tracker-mystop-${DEMO_KEY}`)
    } catch {}
    navigate('/', { state: { dir: 'back' } })
  }

  if (demoTrip) {
    return (
      <TrackingScreen
        trip={demoTrip}
        onBack={exitDemo}
        onTripCompleted={() => resetDemo()}
        onUpdateLastKnown={() => {}} // nothing to persist for a simulation
        dataSaver={saver.dataSaver}
        onToggleDataSaver={saver.toggleDataSaver}
        refreshInterval={DEMO_REFRESH_MS}
        onAddReal={() => {
          exitDemo()
          onOpenAdd()
        }}
        animClass={animClass}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />
    )
  }

  // load() in useTrips resolves cold-start deep links synchronously, so the trip
  // is present on the very first render. This fallback should never be seen.
  const trip = tripsAPI.trips.find(t => t.key === key?.toUpperCase())
  if (!trip) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-app">
        <p className="text-sm text-ink-4">Loading…</p>
      </div>
    )
  }

  return (
    <TrackingScreen
      trip={trip}
      onBack={() => navigate('/', { state: { dir: 'back' } })}
      onTripCompleted={k => tripsAPI.removeTrip(k)}
      onUpdateLastKnown={tripsAPI.updateLastKnown}
      dataSaver={saver.dataSaver}
      onToggleDataSaver={saver.toggleDataSaver}
      refreshInterval={saver.refreshInterval}
      onAddReal={onOpenAdd}
      animClass={animClass}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    />
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function App() {
  const tripsAPI = useTrips()
  const saver = useDataSaver()
  const { isDark, toggle } = useTheme()
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()
  const { pathname, search } = useLocation()

  const activeKey = pathname.match(/^\/track\/([A-Za-z0-9]{4,10})$/)?.[1].toUpperCase()

  // The manifest ships an "Add a bus" shortcut pointing at /?add=1.
  useEffect(() => {
    if (new URLSearchParams(search).get('add') !== '1') return
    // Reading the URL is exactly the external-system sync this effect exists for.
    setShowAdd(true)
    navigate('/', { replace: true })
  }, [search, navigate])

  const startDemo = useCallback(() => {
    resetDemo()
    navigate(`/track/${DEMO_KEY}`, { state: { dir: 'forward' } })
  }, [navigate])

  /**
   * Shared add handler. `DEMO` is a real 4-character code as far as
   * parseTrackingKey is concerned, so intercept it here — otherwise typing it
   * would persist a fake trip into the user's list.
   */
  const handleAdd = useCallback(
    (url: string, name: string) => {
      if (isDemoKey(url.trim())) {
        setShowAdd(false)
        startDemo()
        return { success: true }
      }
      const result = tripsAPI.addTrip(url, name)
      if (result.success && result.trip) {
        setShowAdd(false)
        navigate(`/track/${result.trip.key}`, { state: { dir: 'forward' } })
      }
      return result
    },
    [tripsAPI, navigate, startDemo],
  )

  const pageProps: PageProps = {
    tripsAPI,
    saver,
    isDark,
    onToggleTheme: toggle,
    onOpenAdd: () => setShowAdd(true),
    onStartDemo: startDemo,
  }

  return (
    <div className="lg:flex bg-app text-ink">
      <TripRail
        trips={tripsAPI.trips}
        activeKey={activeKey}
        onOpenTrip={trip => navigate(`/track/${trip.key}`, { state: { dir: 'forward' } })}
        onRemoveTrip={key => {
          tripsAPI.removeTrip(key)
          if (key === activeKey) navigate('/', { state: { dir: 'back' } })
        }}
        onAdd={() => setShowAdd(true)}
        onStartDemo={startDemo}
        dataSaver={saver.dataSaver}
        onToggleDataSaver={saver.toggleDataSaver}
        isDark={isDark}
        onToggleTheme={toggle}
      />

      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<ListPage {...pageProps} />} />
          <Route path="/track/:key" element={<TrackPage {...pageProps} />} />
        </Routes>
      </div>

      <AddTripSheet isOpen={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </div>
  )
}
