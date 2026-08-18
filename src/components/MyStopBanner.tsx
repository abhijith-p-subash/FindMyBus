import { X } from 'lucide-react'
import { Stop } from '../types'
import { formatClock, minutesUntil, formatDurationTight } from '../utils'

interface MyStopBannerProps {
  stop: Stop
  stopsAway: number
  onClear: () => void
  className?: string
}

/**
 * The pinned-destination card. Escalates when the bus is close — the whole point
 * of pinning a stop is to be told when to stand up.
 */
export function MyStopBanner({ stop, stopsAway, onClear, className = '' }: MyStopBannerProps) {
  const etaRaw = stop.expected_time || stop.arrival_time || stop.scheduled_time
  const eta = formatClock(etaRaw)
  const mins = minutesUntil(etaRaw)

  const passed = stopsAway < 0
  const imminent = !passed && stopsAway <= 2

  const distance = passed
    ? 'Already passed'
    : stopsAway === 0
      ? 'Bus is here'
      : `${stopsAway} stop${stopsAway === 1 ? '' : 's'} away`

  return (
    <section
      className={`relative p-[18px] rounded-card border flex items-center justify-between gap-3
                  animate-view-in ${className}`}
      style={{
        background: imminent
          ? 'linear-gradient(180deg, var(--fmb-signal-wash), var(--fmb-surface))'
          : 'var(--fmb-surface-2)',
        borderColor: imminent ? 'var(--fmb-signal-edge)' : 'var(--fmb-line)',
      }}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-[2px] bg-signal rotate-45 shrink-0" />
          <span className="eyebrow !text-[9px] !text-signal-text">
            {imminent && !passed ? 'Get ready' : 'My stop'}
          </span>
        </div>
        <h3 className="font-display font-semibold text-xl leading-none tracking-tight text-ink truncate">
          {stop.service_place_name.trim()}
        </h3>
        <p className="text-[12px] text-ink-3 truncate">
          {distance}
          {eta ? ` · arrives ${eta}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono font-semibold text-[30px] leading-none tracking-[-0.04em] text-signal-text tnum">
            {mins === null || passed ? '—' : mins <= 0 ? 'now' : formatDurationTight(mins)}
          </span>
          <span className="eyebrow !text-[9px] !tracking-[0.14em]">to go</span>
        </div>
        <button
          onClick={onClear}
          aria-label="Unpin my stop"
          className="w-7 h-7 flex items-center justify-center rounded-badge text-ink-4
                     hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </section>
  )
}
