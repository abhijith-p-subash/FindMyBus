import { useRef } from 'react'
import { Navigation, Zap, Leaf } from 'lucide-react'
import { BuyMeCoffeeButton } from './BuyMeCoffeeButton'
import { useBusTracker } from '../hooks/useBusTracker'
import { useShare } from '../hooks/useShare'
import { useMyStop } from '../hooks/useMyStop'
import { useDataSaver } from '../hooks/useDataSaver'
import { Trip } from '../types'
import { computeLastKnown, dedupeStops } from '../utils'
import { Header } from './Header'
import { LiveCard } from './LiveCard'
import { StopTimeline, StopTimelineHandle } from './StopTimeline'
import { Legend } from './Legend'
import { ErrorState } from './ErrorState'
import { LoadingSkeleton } from './LoadingSkeleton'
import { CompletedState } from './CompletedState'
import { BusMap } from './BusMap'
import { OfflineBanner } from './OfflineBanner'
import { MyStopBanner } from './MyStopBanner'

interface TrackingScreenProps {
  trip: Trip
  onBack: () => void
  onTripCompleted: (key: string) => void
  onUpdateLastKnown: (key: string, lk: ReturnType<typeof computeLastKnown>) => void
  animClass: string
  isDark: boolean
  onToggleTheme: () => void
}

export function TrackingScreen({
  trip, onBack, onTripCompleted, onUpdateLastKnown, animClass, isDark, onToggleTheme,
}: TrackingScreenProps) {
  const timelineRef = useRef<StopTimelineHandle>(null)
  const { share, copied: shareCopied, shareViaWhatsApp } = useShare(trip.key, trip.name)
  const { myStopId, setMyStop } = useMyStop(trip.key)
  const { dataSaver, toggleDataSaver, refreshInterval } = useDataSaver()

  const { data, loading, error, completed, completedMessage, lastUpdated, countdown, refresh, delayTrend, startedAt } =
    useBusTracker(trip.key, {
      onData: apiData => onUpdateLastKnown(trip.key, computeLastKnown(apiData)),
      refreshInterval,
    })

  const handleDone = () => {
    onTripCompleted(trip.key)
    onBack()
  }

  const showJumpButton = !completed && !!data

  // Compute my-stop details for the banner
  const stops = data ? dedupeStops(data.eta_map_data, data.current_sp_id) : []
  const myStop = myStopId !== null ? stops.find(s => s.id === myStopId) ?? null : null
  const currentIdx = data ? stops.findIndex(s => s.id === data.current_sp_id) : -1
  const myStopIdx = myStopId !== null ? stops.findIndex(s => s.id === myStopId) : -1
  const stopsAway = myStopIdx >= 0 && currentIdx >= 0 ? myStopIdx - currentIdx : 0

  const currentStopName = data
    ? data.eta_map_data.find(s => s.id === data.current_sp_id)?.service_place_name ?? null
    : null

  const showOfflineBanner = !!error && !!data
  const showMyStopBanner  = !!myStop && !!data

  return (
    <div
      className={`h-screen flex flex-col bg-zinc-950 light:bg-zinc-50 text-zinc-100 light:text-zinc-900 ${animClass}`}
      style={{ height: '100dvh' }}
    >
      <Header
        mode="tracking"
        tripKey={trip.key}
        tripName={trip.name}
        lastUpdated={lastUpdated}
        countdown={countdown}
        onRefresh={refresh}
        onBack={onBack}
        onShare={share}
        onShareWhatsApp={shareViaWhatsApp}
        shareCopied={shareCopied}
        loading={loading}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />

      {showOfflineBanner && (
        <OfflineBanner lastUpdated={lastUpdated} currentStopName={currentStopName} />
      )}

      {showMyStopBanner && (
        <MyStopBanner stop={myStop} stopsAway={stopsAway} onClear={() => setMyStop(null)} />
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 sm:py-6 space-y-5">
          {completed ? (
            <CompletedState message={completedMessage} onDone={handleDone} />
          ) : error && !data ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : loading && !data ? (
            <LoadingSkeleton />
          ) : data ? (
            <>
              <BusMap
                lat={data.current_status_details.lat_long[0]}
                lng={data.current_status_details.lat_long[1]}
                speed={data.current_status_details.details.speed}
                location={data.current_status_details.details.location}
              />
              <LiveCard
                data={data}
                lastUpdated={lastUpdated}
                delayTrend={delayTrend}
                startedAt={startedAt}
              />
              <div className="space-y-3">
                <Legend />
                <StopTimeline
                  ref={timelineRef}
                  data={data}
                  myStopId={myStopId}
                  onSetMyStop={setMyStop}
                />
              </div>
            </>
          ) : null}
        </div>
      </main>

      <BuyMeCoffeeButton />

      {/* Bottom chrome — always visible, footer never scrolls away */}
      <div className="shrink-0 border-t border-zinc-800/50 light:border-zinc-200/60 bg-zinc-950/95 light:bg-white/95 backdrop-blur-md">
        {showJumpButton && (
          <div className="flex items-center justify-between px-4 pt-3">
            <button
              onClick={toggleDataSaver}
              title={dataSaver ? 'Eco mode: updates every 60s. Tap for live.' : 'Live mode: updates every 30s. Tap for eco.'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                dataSaver
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 light:text-emerald-600'
                  : 'border-zinc-700/50 bg-zinc-800/50 light:bg-zinc-100 text-zinc-400 light:text-zinc-500 hover:border-zinc-600'
              }`}
            >
              {dataSaver
                ? <><Leaf size={11} /> Eco</>
                : <><Zap size={11} /> Live</>
              }
            </button>

            <button
              onClick={() => timelineRef.current?.scrollToCurrent()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-violet-900/30 light:shadow-violet-500/20 transition-all cursor-pointer"
            >
              <Navigation size={14} strokeWidth={2.5} />
              Current stop
            </button>

            {/* Spacer to balance the eco toggle */}
            <div className="w-16" />
          </div>
        )}
        <p className="text-center text-xs text-zinc-800 light:text-zinc-300 py-2.5 pb-safe">
          {trip.key} · FindMyBus · all data stays in your browser
        </p>
      </div>
    </div>
  )
}
