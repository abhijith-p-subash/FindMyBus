import { useState } from 'react'
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTrips } from './hooks/useTrips'
import { useTheme } from './hooks/useTheme'
import { TripListScreen } from './components/TripListScreen'
import { TrackingScreen } from './components/TrackingScreen'
import { AddTripSheet } from './components/AddTripSheet'

type TripsAPI = ReturnType<typeof useTrips>

interface SharedProps {
  tripsAPI: TripsAPI
  isDark: boolean
  onToggleTheme: () => void
}

function ListPage({ tripsAPI, isDark, onToggleTheme }: SharedProps) {
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()
  const { state } = useLocation()
  const animClass = (state as { dir?: string } | null)?.dir === 'back' ? 'animate-slide-in-left' : ''

  return (
    <>
      <TripListScreen
        trips={tripsAPI.trips}
        onOpenTrip={trip => navigate(`/track/${trip.key}`, { state: { dir: 'forward' } })}
        onRemoveTrip={tripsAPI.removeTrip}
        onAdd={() => setShowAdd(true)}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        animClass={animClass}
      />
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
    </>
  )
}

function TrackPage({ tripsAPI, isDark, onToggleTheme }: SharedProps) {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const animClass = (state as { dir?: string } | null)?.dir === 'forward' ? 'animate-slide-in-right' : ''

  // load() in useTrips handles cold-start deep-links synchronously, so trip is
  // available on the very first render. The fallback below should never be seen.
  const trip = tripsAPI.trips.find(t => t.key === key?.toUpperCase())
  if (!trip) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 light:bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    )
  }

  return (
    <TrackingScreen
      trip={trip}
      onBack={() => navigate('/', { state: { dir: 'back' } })}
      onTripCompleted={k => { tripsAPI.removeTrip(k); navigate('/', { state: { dir: 'back' } }) }}
      onUpdateLastKnown={(k, lk) => tripsAPI.updateLastKnown(k, lk)}
      animClass={animClass}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    />
  )
}

export default function App() {
  const tripsAPI = useTrips()
  const { isDark, toggle } = useTheme()

  return (
    <Routes>
      <Route path="/" element={<ListPage tripsAPI={tripsAPI} isDark={isDark} onToggleTheme={toggle} />} />
      <Route path="/track/:key" element={<TrackPage tripsAPI={tripsAPI} isDark={isDark} onToggleTheme={toggle} />} />
    </Routes>
  )
}
