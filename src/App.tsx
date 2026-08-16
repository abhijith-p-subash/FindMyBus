import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTrips } from './hooks/useTrips'
import { useTheme } from './hooks/useTheme'
import { useDataSaver } from './hooks/useDataSaver'
import { TripListScreen } from './components/TripListScreen'
import { TrackingScreen } from './components/TrackingScreen'
import { TripRail } from './components/TripRail'
import { AddTripSheet } from './components/AddTripSheet'
import { Logo } from './components/Logo'

type TripsAPI = ReturnType<typeof useTrips>

interface PageProps {
  tripsAPI: TripsAPI
  saver: ReturnType<typeof useDataSaver>
  isDark: boolean
  onToggleTheme: () => void
  onOpenAdd: () => void
}

// ── Routes ────────────────────────────────────────────────────────────────────

function ListPage({ tripsAPI, saver, isDark, onToggleTheme, onOpenAdd }: PageProps) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const animClass = (state as { dir?: string } | null)?.dir === 'back' ? 'animate-slide-in-left' : ''

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
        <button
          onClick={onOpenAdd}
          className="px-5 py-3 rounded-field bg-signal text-signal-ink font-semibold text-sm
                     hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
        >
          Add a bus
        </button>
      </div>
    </>
  )
}

function TrackPage({ tripsAPI, saver, isDark, onToggleTheme }: PageProps) {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const animClass = (state as { dir?: string } | null)?.dir === 'forward' ? 'animate-slide-in-right' : ''

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
    setShowAdd(true)
    navigate('/', { replace: true })
  }, [search, navigate])

  const pageProps: PageProps = {
    tripsAPI,
    saver,
    isDark,
    onToggleTheme: toggle,
    onOpenAdd: () => setShowAdd(true),
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

      <AddTripSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(url, name) => {
          const result = tripsAPI.addTrip(url, name)
          if (result.success && result.trip) {
            setShowAdd(false)
            navigate(`/track/${result.trip.key}`, { state: { dir: 'forward' } })
          }
          return result
        }}
      />
    </div>
  )
}
