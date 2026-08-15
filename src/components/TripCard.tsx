import { useState } from 'react'
import { ChevronRight, X, Trash2, AlertTriangle } from 'lucide-react'
import { Trip } from '../types'
import { timeAgo } from '../utils'

interface TripCardProps {
  trip: Trip
  onOpen: () => void
  onRemove: () => void
  style?: React.CSSProperties
}

export function TripCard({ trip, onOpen, onRemove, style }: TripCardProps) {
  const [confirming, setConfirming] = useState(false)
  const lk = trip.lastKnown

  const delayInfo = (() => {
    if (!lk) return null
    const d = lk.delay
    if (d === null || d <= 2) return { label: 'On time', color: 'emerald' as const }
    if (d <= 15) return { label: `+${d} min`, color: 'amber' as const }
    return { label: `+${d} min`, color: 'red' as const }
  })()

  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    amber:   'text-amber-600 bg-amber-500/10 border-amber-500/20',
    red:     'text-red-600 bg-red-500/10 border-red-500/20',
  }

  const barColor = {
    emerald: 'bg-violet-500',
    amber:   'bg-amber-500',
    red:     'bg-red-500',
  }

  return (
    <div className="animate-card-in" style={style}>
      <div className={`rounded-2xl border overflow-hidden shadow-sm transition-all duration-200
        ${confirming
          ? 'bg-zinc-900 light:bg-white border-red-500/40 light:border-red-300'
          : 'bg-zinc-900 light:bg-white border-zinc-800 light:border-zinc-200 shadow-sm light:shadow-zinc-200/60'
        }`}
      >
        {/* Progress stripe */}
        {lk && !confirming && (
          <div className="h-0.5 bg-zinc-800 light:bg-zinc-100 w-full">
            <div
              className={`h-full transition-all duration-700 ease-out ${delayInfo ? barColor[delayInfo.color] : 'bg-violet-500'}`}
              style={{ width: `${lk.progress}%` }}
            />
          </div>
        )}

        {confirming ? (
          /* ── Confirmation state ── */
          <div className="p-4 space-y-3 animate-view-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle size={14} className="text-red-400 light:text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-100 light:text-zinc-900 leading-none">Remove trip?</p>
                <p className="text-xs text-zinc-500 mt-0.5 truncate">
                  {trip.name !== trip.key ? trip.name : trip.key}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 text-zinc-300 light:text-zinc-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onRemove}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5
                  bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 border border-red-500/30 text-red-400 light:text-red-600 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* ── Normal state ── */
          <button
            onClick={onOpen}
            className="group w-full text-left hover:bg-zinc-800/40 light:hover:bg-zinc-50 active:bg-zinc-800/70 light:active:bg-zinc-100 transition-all duration-150 cursor-pointer"
          >
            <div className="p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-zinc-400 light:text-zinc-500 bg-zinc-800 light:bg-zinc-100 px-2 py-0.5 rounded-md">
                      {trip.key}
                    </span>
                    {trip.name !== trip.key && (
                      <span className="text-sm font-medium text-zinc-200 light:text-zinc-800 truncate">{trip.name}</span>
                    )}
                  </div>
                  {lk ? (
                    <p className="text-xs text-zinc-500 mt-1.5 truncate">{lk.firstStop} → {lk.lastStop}</p>
                  ) : (
                    <p className="text-xs text-zinc-600 light:text-zinc-400 mt-1.5">Loading route…</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); setConfirming(true) }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-700 light:text-zinc-400 hover:text-red-400 light:hover:text-red-500 hover:bg-red-500/10 active:bg-red-500/20 transition-all cursor-pointer"
                    aria-label="Remove trip"
                  >
                    <X size={14} />
                  </span>
                  <ChevronRight size={16} className="text-zinc-700 light:text-zinc-400 group-hover:text-zinc-500 light:group-hover:text-zinc-600 transition-colors" />
                </div>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {delayInfo ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorMap[delayInfo.color]}`}>
                      {delayInfo.label}
                    </span>
                  ) : lk ? (
                    <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-800 light:border-zinc-200 bg-zinc-800/50 light:bg-zinc-100">
                      On time
                    </span>
                  ) : null}
                  {lk?.currentStop && (
                    <span className="text-xs text-zinc-600 light:text-zinc-500 truncate max-w-[120px] sm:max-w-[200px]">
                      at {lk.currentStop}
                    </span>
                  )}
                </div>
                {lk && (
                  <span className="text-xs text-zinc-700 light:text-zinc-400 shrink-0 tabular-nums">{timeAgo(lk.at)}</span>
                )}
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
