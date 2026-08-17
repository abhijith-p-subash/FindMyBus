import { CSSProperties } from 'react'
import { Trash2 } from 'lucide-react'
import { Trip } from '../types'
import { tripStatus, timeAgo } from '../utils'

interface TripCardProps {
  trip: Trip
  active?: boolean
  compact?: boolean
  onOpen: () => void
  onRemove: () => void
  style?: CSSProperties
}

const STATUS_META = {
  live: { label: 'Live now', dot: 'bg-signal', text: 'text-signal-text', blink: true },
  ontime: { label: 'On time', dot: 'bg-go', text: 'text-go-text', blink: false },
  delayed: { label: 'Delayed', dot: 'bg-delay', text: 'text-delay-text', blink: true },
  idle: { label: 'Idle', dot: 'bg-ink-5', text: 'text-ink-4', blink: false },
  new: { label: 'Not tracked yet', dot: 'bg-ink-5', text: 'text-ink-4', blink: false },
} as const

export function TripCard({
  trip,
  active = false,
  compact = false,
  onOpen,
  onRemove,
  style,
}: TripCardProps) {
  const status = tripStatus(trip)
  const meta = STATUS_META[status]
  const lk = trip.lastKnown
  const dim = status === 'idle' || status === 'new'

  const shell = active
    ? 'bg-surface border-signal-edge'
    : dim
      ? 'bg-surface-3 border-line-faint'
      : status === 'live'
        ? 'bg-surface border-line-strong'
        : 'bg-surface-2 border-line-soft'

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      style={style}
      className={`group relative animate-card-in cursor-pointer rounded-card border transition-colors
                  hover:border-line-strong focus:outline-none focus-visible:border-signal-edge
                  ${shell} ${dim ? 'opacity-70 hover:opacity-100' : ''} ${compact ? 'p-4' : 'p-[18px]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-[7px] min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-[7px] h-[7px] rounded-full shrink-0 ${meta.dot} ${meta.blink ? 'soft-blink' : ''}`}
            />
            <span
              className={`font-mono font-medium text-[10px] leading-none tracking-[0.14em] uppercase ${meta.text}`}
            >
              {meta.label}
              {status === 'idle' && lk ? ` · ${timeAgo(lk.at)}` : ''}
            </span>
          </div>
          <h3
            className={`font-display font-semibold leading-tight tracking-tight truncate
                          ${dim ? 'text-ink-2' : 'text-ink'} ${compact ? 'text-base' : 'text-[19px]'}`}
          >
            {trip.name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="font-mono font-medium text-[11px] leading-none px-2 py-1.5 rounded-badge
                           bg-app border border-line text-ink-3"
          >
            {trip.key}
          </span>
          <button
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
            aria-label={`Remove ${trip.name}`}
            className="w-7 h-7 flex items-center justify-center rounded-badge text-ink-5
                       opacity-0 group-hover:opacity-100 focus:opacity-100
                       hover:text-delay-text hover:bg-delay-wash transition-all cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="h-px bg-line-soft my-3.5" />

      <div className="flex items-center justify-between gap-3 text-[13px]">
        {lk && lk.stopCount > 0 ? (
          <>
            <span className="text-ink-3 truncate">
              At {lk.currentStop || '—'} · stop {lk.stopIndex} of {lk.stopCount}
            </span>
            <span
              className={`font-mono font-medium tnum shrink-0
                          ${lk.delay && lk.delay > 0 ? 'text-delay-text' : 'text-go-text'}`}
            >
              {lk.delay && lk.delay > 0 ? `+${lk.delay}m` : '0m'}
            </span>
          </>
        ) : (
          <>
            <span className="text-ink-4">No recent data</span>
            <span className="font-mono text-ink-4">—</span>
          </>
        )}
      </div>
    </div>
  )
}
