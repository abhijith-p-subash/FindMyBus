import { useRef } from 'react'
import { Navigation } from 'lucide-react'
import { Trip } from '../types'
import { useBusTracker } from '../hooks/useBusTracker'
import { useShare } from '../hooks/useShare'
import { useMyStop } from '../hooks/useMyStop'
import { useOnline } from '../hooks/useOnline'
import { computeLastKnown, dedupeStops, formatClock, parseTimeToday } from '../utils'
import { TrackHeader } from './Header'
import { MapPanel } from './MapPanel'
import { HeroCard } from './HeroCard'
import { StopTimeline, StopTimelineHandle } from './StopTimeline'
import { MyStopBanner } from './MyStopBanner'
import { StaleBanner } from './StaleBanner'
import { CompletedState } from './CompletedState'
import { ErrorState } from './ErrorState'
import { LoadingSkeleton } from './LoadingSkeleton'
import { AppFooter } from './AppFooter'
import { DemoBanner } from '../demo/DemoBanner'
import { isDemoKey } from '../demo/demoApi'

interface TrackingScreenProps {
  trip: Trip
  onBack: () => void
  onTripCompleted: (key: string) => void
  onUpdateLastKnown: (key: string, lk: ReturnType<typeof computeLastKnown>) => void
  dataSaver: boolean
  onToggleDataSaver: () => void
  refreshInterval: number
  /** Leave the sample trip and open the add sheet. Only used in demo mode. */
  onAddReal: () => void
  animClass: string
  isDark: boolean
  onToggleTheme: () => void
}

export function TrackingScreen({
  trip,
  onBack,
  onTripCompleted,
  onUpdateLastKnown,
  dataSaver,
  onToggleDataSaver,
  refreshInterval,
  onAddReal,
  animClass,
  isDark,
  onToggleTheme,
}: TrackingScreenProps) {
  const isDemo = isDemoKey(trip.key)
  const timelineRef = useRef<StopTimelineHandle>(null)
  const { share, copied, shareViaWhatsApp } = useShare(trip.key, trip.name)
  const { myStopId, setMyStop } = useMyStop(trip.key)
  const online = useOnline()

  const {
    data,
    loading,
    error,
    completed,
    completedMessage,
    lastUpdated,
    countdown,
    refresh,
    delayTrend,
    stale,
  } = useBusTracker(trip.key, {
    onData: apiData => onUpdateLastKnown(trip.key, computeLastKnown(apiData)),
    refreshInterval,
  })

  const stops = data ? dedupeStops(data.eta_map_data, data.current_sp_id) : []
  const myStop = myStopId !== null ? (stops.find(s => s.id === myStopId) ?? null) : null
  const currentIdx = data ? stops.findIndex(s => s.id === data.current_sp_id) : -1
  const myStopIdx = myStopId !== null ? stops.findIndex(s => s.id === myStopId) : -1
  const stopsAway = myStopIdx >= 0 && currentIdx >= 0 ? myStopIdx - currentIdx : 0

  const degraded = (!!error || stale || !online) && !!data
  const showTimelineJump = !completed && !!data && stops.length > 6

  const subtitle = completed
    ? 'trip finished'
    : degraded
      ? 'reconnecting'
      : lastUpdated
        ? `next update in ${countdown}s`
        : 'connecting…'

  // ── Completion stats, read off the last payload before the 302 arrived ──
  const first = stops[0]
  const last = stops[stops.length - 1]
  const startAt = first ? parseTimeToday(first.scheduled_time || first.arrival_time) : null
  const endAt = last
    ? parseTimeToday(last.expected_time || last.arrival_time || last.scheduled_time)
    : null
  const durationMins =
    startAt && endAt
      ? Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60_000))
      : null
  const finalDelay = last?.delay_time ?? null

  return (
    <div className={`relative min-h-dvh flex flex-col bg-app text-ink ${animClass}`}>
      <TrackHeader
        tripKey={trip.key}
        tripName={trip.name}
        subtitle={subtitle}
        onBack={onBack}
        onShare={share}
        onShareWhatsApp={shareViaWhatsApp}
        onRefresh={refresh}
        shareCopied={copied}
        loading={loading}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />

      <main className="flex-1 pb-10">
        {completed ? (
          <div className="max-w-2xl mx-auto px-5">
            <CompletedState
              tripName={trip.name}
              message={completedMessage}
              stops={stops.length}
              durationMins={durationMins}
              finalDelay={finalDelay}
              onDone={() => {
                onTripCompleted(trip.key)
                onBack()
              }}
              onKeep={isDemo ? onAddReal : onBack}
              keepLabel={isDemo ? 'Track a real bus' : 'Keep on list'}
            />
          </div>
        ) : error && !data ? (
          <div className="max-w-2xl mx-auto px-5">
            <ErrorState message={error} onRetry={refresh} />
          </div>
        ) : loading && !data ? (
          <div className="max-w-2xl mx-auto px-5 pt-2">
            <LoadingSkeleton />
          </div>
        ) : data ? (
          <>
            {/* Map — edge to edge on phones, a contained panel from lg up */}
            <MapPanel
              lat={data.current_status_details.lat_long[0]}
              lng={data.current_status_details.lat_long[1]}
              speed={data.current_status_details.details.speed}
              location={data.current_status_details.details.location}
              frozen={degraded}
              frozenAt={
                lastUpdated ? formatClock(lastUpdated.toTimeString().slice(0, 5)) : undefined
              }
              variant="bleed"
              className="h-[300px] sm:h-[340px] lg:h-[380px] lg:rounded-card lg:border lg:border-line
                         lg:max-w-2xl lg:mx-auto"
            />

            <div className="max-w-2xl mx-auto px-4 sm:px-5 flex flex-col gap-4 -mt-10 lg:mt-4 relative z-10">
              {isDemo && <DemoBanner onExit={onBack} onAddReal={onAddReal} />}

              {degraded && (
                <StaleBanner
                  lastUpdated={lastUpdated}
                  retryIn={countdown}
                  offline={!online}
                  onRetry={refresh}
                />
              )}

              {myStop && (
                <MyStopBanner stop={myStop} stopsAway={stopsAway} onClear={() => setMyStop(null)} />
              )}

              <HeroCard
                data={data}
                delayTrend={delayTrend}
                stale={degraded}
                dataSaver={dataSaver}
                onToggleDataSaver={onToggleDataSaver}
              />

              <div className="pt-1">
                <StopTimeline
                  ref={timelineRef}
                  data={data}
                  myStopId={myStopId}
                  onSetMyStop={setMyStop}
                />
              </div>
            </div>
          </>
        ) : null}
      </main>

      {showTimelineJump && (
        <div className="sticky bottom-0 z-20 pointer-events-none pb-safe">
          <div className="max-w-2xl mx-auto px-5 flex justify-center">
            <button
              onClick={() => timelineRef.current?.scrollToCurrent()}
              className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full
                         bg-signal text-signal-ink font-semibold text-sm shadow-[var(--fmb-shadow-pop)]
                         hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
              <Navigation size={14} strokeWidth={2.6} />
              Current stop
            </button>
          </div>
        </div>
      )}

      <div className="pb-safe pt-4">
        <AppFooter prefix={isDemo ? 'Sample trip' : trip.key} />
      </div>
    </div>
  )
}
