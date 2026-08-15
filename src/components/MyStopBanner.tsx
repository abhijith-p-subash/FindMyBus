import { X, MapPin, Clock } from 'lucide-react'
import { Stop } from '../types'

interface MyStopBannerProps {
  stop: Stop
  stopsAway: number
  onClear: () => void
}

export function MyStopBanner({ stop, stopsAway, onClear }: MyStopBannerProps) {
  const timeToShow = stop.expected_time || stop.arrival_time

  const distanceLabel =
    stopsAway === 0 ? 'Current stop' :
    stopsAway < 0   ? 'Already passed' :
                      `${stopsAway} stop${stopsAway !== 1 ? 's' : ''} away`

  return (
    <div className="shrink-0 border-b border-violet-500/20 light:border-violet-500/30 bg-violet-500/[0.07] light:bg-violet-50 animate-view-in">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
            <MapPin size={13} className="text-violet-400 light:text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-100 light:text-zinc-800 truncate leading-tight">
              {stop.service_place_name.trim()}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-zinc-500">{distanceLabel}</span>
              {timeToShow && (
                <span className="flex items-center gap-1 text-xs font-mono text-violet-400 light:text-violet-600">
                  <Clock size={9} />
                  {timeToShow}
                </span>
              )}
              {stop.delay_time !== null && stop.delay_time > 0 && (
                <span className="text-xs text-amber-400 light:text-amber-600">+{stop.delay_time}m late</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-400 light:text-zinc-400 light:hover:text-zinc-600 hover:bg-zinc-800/60 light:hover:bg-zinc-100 transition-all cursor-pointer"
          aria-label="Clear destination stop"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
