import { useState, useEffect, useImperativeHandle, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Stop, ApiResponse } from '../types'
import { dedupeStops, getStopStatus, formatClock } from '../utils'

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
  const currentRef = useRef<HTMLLIElement>(null)
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
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="eyebrow">Timeline</p>
        <span className="font-mono text-[11px] text-ink-4 tnum">
          {myStopId !== null ? 'Tap a stop to change' : 'Tap a stop to pin yours'}
        </span>
      </div>

      {stops.length >= 6 && (
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find a stop…"
            aria-label="Find a stop"
            className="w-full pl-9 pr-9 py-2.5 rounded-field bg-surface-2 border border-line
                       text-sm text-ink placeholder:text-ink-5 focus:outline-none
                       focus:border-line-strong transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink
                         transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-4">No stops match “{search}”.</p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((stop, i) => {
            const originalIdx = stops.findIndex(s => s.id === stop.id)
            const isCurrent = stop.id === data.current_sp_id
            const isMine = stop.id === myStopId
            const status = getStopStatus(stop.color, stop.skipped)
            const isPast = !isCurrent && originalIdx < currentIdx

            return (
              <StopRow
                key={stop.id}
                ref={isCurrent ? currentRef : undefined}
                stop={stop}
                isCurrent={isCurrent}
                isMine={isMine}
                isPast={isPast}
                isNext={originalIdx === currentIdx + 1}
                isSkipped={status === 'skipped'}
                isLast={i === filtered.length - 1}
                onPin={() => onSetMyStop?.(isMine ? null : stop.id)}
              />
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface StopRowProps {
  stop: Stop
  isCurrent: boolean
  isMine: boolean
  isPast: boolean
  isNext: boolean
  isSkipped: boolean
  isLast: boolean
  onPin: () => void
  ref?: React.Ref<HTMLLIElement>
}

function StopRow({
  stop, isCurrent, isMine, isPast, isNext, isSkipped, isLast, onPin, ref,
}: StopRowProps) {
  const eta = formatClock(stop.expected_time || stop.arrival_time || stop.scheduled_time)
  const scheduled = formatClock(stop.scheduled_time)
  const late = stop.delay_time !== null && stop.delay_time > 0

  const sub = isCurrent
    ? `Bus is here${stop.departure_time ? ` · departed ${formatClock(stop.departure_time)}` : ''}`
    : isMine
    ? 'your stop'
    : isSkipped
    ? 'skipped'
    : scheduled && scheduled !== eta
    ? `was ${scheduled}`
    : scheduled
    ? `scheduled ${scheduled}`
    : ''

  return (
    <li
      ref={ref}
      onClick={onPin}
      className={`flex gap-3.5 items-start cursor-pointer select-none group
                  ${isPast ? 'opacity-45 hover:opacity-70' : ''} transition-opacity`}
    >
      {/* Rail */}
      <div className="flex flex-col items-center w-3.5 shrink-0 pt-1">
        <Dot isCurrent={isCurrent} isMine={isMine} isPast={isPast} isSkipped={isSkipped} />
        {!isLast && (
          <span
            className="w-0.5 flex-1 min-h-9"
            style={{
              background: isCurrent
                ? 'linear-gradient(var(--fmb-signal), var(--fmb-line))'
                : 'var(--fmb-line)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 flex items-start justify-between gap-3
                       ${isLast ? 'pb-1' : 'pb-5'} group-hover:opacity-100`}>
        <div className="min-w-0 flex flex-col gap-1">
          <span
            className={`truncate leading-tight ${
              isCurrent || isMine
                ? 'font-display font-semibold text-base tracking-[-0.01em]'
                : 'font-medium text-[15px]'
            } ${
              isMine ? 'text-signal-text' : isCurrent ? 'text-ink' : isPast ? 'text-ink-3' : 'text-ink-2'
            } ${isSkipped ? 'line-through' : ''}`}
          >
            {stop.service_place_name.trim()}
          </span>
          {sub && <span className="text-[11px] text-ink-4 truncate">{sub}</span>}
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isCurrent && (
            <span className="px-2 py-1 rounded-[7px] bg-signal-wash font-mono font-medium
                             text-[9px] leading-none tracking-[0.12em] text-signal-text">
              HERE
            </span>
          )}
          {isNext && !isCurrent && !isMine && (
            <span className="px-2 py-1 rounded-[7px] bg-surface-3 border border-line font-mono
                             text-[9px] leading-none tracking-[0.12em] text-ink-4">
              NEXT
            </span>
          )}
          {!isCurrent && (
            <span className={`font-mono font-medium text-[13px] leading-none tnum
                              ${isMine ? 'text-signal-text' : late ? 'text-delay-text' : 'text-ink'}`}>
              {eta || '—'}
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

function Dot({ isCurrent, isMine, isPast, isSkipped }:
  { isCurrent: boolean; isMine: boolean; isPast: boolean; isSkipped: boolean }) {

  if (isCurrent) return (
    <span
      className="w-3 h-3 rounded-full bg-signal shrink-0"
      style={{ boxShadow: '0 0 0 5px var(--fmb-signal-wash)' }}
    />
  )

  if (isMine) return (
    <span
      className="w-[11px] h-[11px] rounded-[3px] bg-signal rotate-45 shrink-0"
      aria-label="Your stop"
      style={{ boxShadow: '0 0 0 4px var(--fmb-signal-wash)' }}
    />
  )

  if (isSkipped) return <span className="w-2 h-2 rounded-full bg-ink-5 shrink-0 opacity-50" />
  if (isPast)    return <span className="w-2 h-2 rounded-full bg-ink-5 shrink-0" />

  return <span className="w-[9px] h-[9px] rounded-full border-2 border-ink-5 bg-app shrink-0" />
}
