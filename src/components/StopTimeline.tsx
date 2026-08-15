import { useState, useEffect, useImperativeHandle, useRef } from 'react'
import { CheckCircle2, Clock, Circle, MinusCircle, Search, X, MapPin } from 'lucide-react'
import { Stop, ApiResponse } from '../types'
import { dedupeStops, getStopStatus } from '../utils'

export interface StopTimelineHandle {
  scrollToCurrent: () => void
}

interface StopTimelineProps {
  data: ApiResponse
  myStopId?: number | null
  onSetMyStop?: (id: number | null) => void
  ref?: React.Ref<StopTimelineHandle>
}

export function StopTimeline({ data, myStopId, onSetMyStop, ref }: StopTimelineProps) {
  const stops = dedupeStops(data.eta_map_data, data.current_sp_id)
  const currentRef = useRef<HTMLDivElement>(null)
  const speed = data.current_status_details.details.speed
  const [search, setSearch] = useState('')

  useImperativeHandle(ref, () => ({
    scrollToCurrent: () =>
      currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
  }), [])

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [data.current_sp_id])

  const currentIdx = stops.findIndex(s => s.id === data.current_sp_id)

  const filtered = search
    ? stops.filter(s => s.service_place_name.toLowerCase().includes(search.toLowerCase()))
    : stops

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Route</h2>
        <span className="text-xs text-zinc-700 light:text-zinc-400">{stops.length} stops</span>
      </div>

      {/* Search — shown when route has 6+ stops */}
      {stops.length >= 6 && (
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 light:text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find a stop…"
            className="w-full bg-zinc-800/60 light:bg-zinc-50 border border-zinc-700/60 light:border-zinc-200 rounded-xl pl-8 pr-8 py-2 text-sm text-zinc-200 light:text-zinc-800 placeholder-zinc-600 light:placeholder-zinc-400 focus:outline-none focus:border-violet-500/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {myStopId !== null && !search && (
        <p className="text-xs text-violet-400 light:text-violet-600 mb-3 flex items-center gap-1.5">
          <MapPin size={11} />
          Tap any stop to update your destination
        </p>
      )}
      {myStopId === null && !search && (
        <p className="text-xs text-zinc-700 light:text-zinc-400 mb-3 flex items-center gap-1.5">
          <MapPin size={11} />
          Tap a stop to pin it as your destination
        </p>
      )}

      <div className="relative">
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-4">No stops match "{search}"</p>
        )}
        {filtered.map((stop, idx) => {
          const originalIdx = stops.findIndex(s => s.id === stop.id)
          const status = getStopStatus(stop.color, stop.skipped)
          const isCurrent = stop.id === data.current_sp_id
          const isNext    = originalIdx === currentIdx + 1 && !stop.skipped
          const isPast    = status === 'ontime' || status === 'delayed'
          const isMyStop  = stop.id === myStopId

          return (
            <StopRow
              key={stop.id}
              stop={stop}
              status={status}
              isCurrent={isCurrent}
              isNext={isNext}
              isPast={isPast}
              isLast={idx === filtered.length - 1}
              isMyStop={isMyStop}
              speed={isCurrent ? speed : undefined}
              onPin={() => onSetMyStop?.(isMyStop ? null : stop.id)}
              ref={isCurrent ? currentRef : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

interface StopRowProps {
  stop: Stop
  status: string
  isCurrent: boolean
  isNext: boolean
  isPast: boolean
  isLast: boolean
  isMyStop: boolean
  speed?: number
  onPin: () => void
  ref?: React.Ref<HTMLDivElement>
}

function StopRow({ stop, status, isCurrent, isNext, isPast, isLast, isMyStop, speed, onPin, ref }: StopRowProps) {
  const timeToShow = stop.arrival_time || stop.expected_time

  return (
    <div ref={ref} className="relative flex gap-3">
      {/* Dot + connector line */}
      <div className="flex flex-col items-center shrink-0 w-5 pt-0.5">
        <StopDot status={status} isCurrent={isCurrent} />
        {!isLast && (
          <div className={`w-px flex-1 min-h-5 mt-1 ${isPast ? 'bg-zinc-700 light:bg-zinc-300' : 'bg-zinc-800 light:bg-zinc-200'}`} />
        )}
      </div>

      {/* Content */}
      <div
        onClick={onPin}
        className={`flex-1 mb-1 rounded-xl transition-colors cursor-pointer select-none ${
          isCurrent
            ? 'bg-violet-500/5 border border-violet-500/15 light:border-violet-500/25 px-3 py-2.5 -mx-1'
            : isMyStop
            ? 'bg-violet-500/[0.04] border border-violet-500/10 px-3 py-2.5 -mx-1'
            : 'pb-3 hover:bg-zinc-800/30 light:hover:bg-zinc-50 px-1 rounded-lg'
        } ${
          isCurrent ? 'opacity-100'
            : isPast  ? 'opacity-40'
            : isNext  ? 'opacity-90'
            : 'opacity-30 hover:opacity-50'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-sm leading-snug font-medium ${
                isCurrent ? 'text-zinc-50 light:text-zinc-900'
                : isNext  ? 'text-zinc-100 light:text-zinc-800'
                :            'text-zinc-400 light:text-zinc-600'
              }`}>
                {stop.service_place_name.trim()}
              </span>
              {isCurrent && (
                <span className="text-xs font-semibold text-violet-300 light:text-violet-700 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  Here
                </span>
              )}
              {isCurrent && speed !== undefined && (
                <span className="text-xs font-mono font-semibold text-emerald-400 light:text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  {speed} km/h
                </span>
              )}
              {isNext && !isCurrent && (
                <span className="text-xs font-medium text-zinc-400 light:text-zinc-500 bg-zinc-800 light:bg-zinc-100 border border-zinc-700/60 light:border-zinc-300 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                  Next
                </span>
              )}
              {isMyStop && (
                <span className="text-xs font-semibold text-violet-400 light:text-violet-600 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap flex items-center gap-1">
                  <MapPin size={9} /> My stop
                </span>
              )}
            </div>
            {stop.running_status && (
              <p className={`text-xs mt-0.5 ${status === 'delayed' ? 'text-amber-400/80' : 'text-emerald-400/70'}`}>
                {stop.running_status}
              </p>
            )}
          </div>

          <div className="text-right shrink-0 ml-2">
            <p className={`text-sm font-mono tabular-nums leading-snug ${
              isCurrent || isNext ? 'text-zinc-100 light:text-zinc-800' : 'text-zinc-600 light:text-zinc-400'
            }`}>
              {timeToShow || stop.scheduled_time}
            </p>
            {stop.delay_time !== null && stop.delay_time > 0 && (
              <p className="text-xs font-mono text-amber-400/70 light:text-amber-600/80 mt-0.5 tabular-nums">
                +{stop.delay_time}m
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StopDot({ status, isCurrent }: { status: string; isCurrent: boolean }) {
  if (isCurrent) return (
    <div className="relative flex items-center justify-center w-5 h-5">
      <div className="absolute w-5 h-5 rounded-full bg-violet-500/20 animate-ping" />
      <img
        src="/bus.svg"
        alt=""
        className="relative z-10"
        style={{
          width: 18, height: 18,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 3px rgba(124,58,237,0.85))',
        }}
      />
    </div>
  )
  switch (status) {
    case 'ontime':  return <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
    case 'delayed': return <Clock        size={15} className="text-amber-500 shrink-0"   />
    case 'skipped': return <MinusCircle  size={15} className="text-zinc-700 light:text-zinc-400 shrink-0" />
    default:        return <Circle       size={15} className="text-zinc-800 light:text-zinc-300 shrink-0" />
  }
}
