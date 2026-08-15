import { Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ApiResponse } from '../types'
import { dedupeStops, computeProgress, formatLastUpdated, parseTimeToday, formatDuration } from '../utils'
import { DelayTrend } from '../hooks/useBusTracker'

interface LiveCardProps {
  data: ApiResponse
  lastUpdated: Date | null
  delayTrend: DelayTrend
  startedAt: Date | null
}

export function LiveCard({ data, lastUpdated, delayTrend, startedAt }: LiveCardProps) {
  const { speed, timestamp } = data.current_status_details.details

  const stops = dedupeStops(data.eta_map_data, data.current_sp_id)
  const currentStop = data.eta_map_data.find(s => s.id === data.current_sp_id)
  const nextStop = (() => {
    const idx = stops.findIndex(s => s.id === data.current_sp_id)
    if (idx === -1) return null
    return stops.find((s, i) => i > idx && !s.skipped && s.color === 'color_gray') ?? null
  })()

  const progress = computeProgress(data)
  const currentDelay = currentStop?.delay_time ?? null

  // Elapsed time since tracking started
  const elapsed = startedAt ? Math.round((Date.now() - startedAt.getTime()) / 60_000) : null

  // Remaining time to last stop
  const lastStop = stops[stops.length - 1]
  const etaDate = parseTimeToday(lastStop?.expected_time || lastStop?.arrival_time || '')
  const remaining = etaDate ? Math.round((etaDate.getTime() - Date.now()) / 60_000) : null

  return (
    <div className="rounded-2xl bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 p-4 sm:p-5 space-y-4 shadow-sm light:shadow-zinc-200/60">
      {/* Live badge + timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 live-pulse shrink-0" />
          <span className="text-xs font-semibold text-emerald-500 light:text-emerald-600 uppercase tracking-widest">Live</span>
        </div>
        {lastUpdated && (
          <p className="text-xs text-zinc-600 light:text-zinc-400 font-mono tabular-nums">
            {formatLastUpdated(lastUpdated)}
          </p>
        )}
      </div>

      <p className="text-xs text-zinc-600 light:text-zinc-400 font-mono -mt-2">{timestamp}</p>

      {/* Progress ring + stat tiles */}
      <div className="flex gap-3 items-start">
        <ProgressRing progress={progress} />

        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
          <StatTile
            icon={<Gauge size={13} />}
            label="Speed"
            value={`${speed}`}
            unit="km/h"
            large
            highlight={speed > 0}
          />
          <DelayTile delay={currentDelay} trend={delayTrend} />
          <StatTile
            className="col-span-2"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L8 8H16L12 2Z M12 22L8 16H16L12 22Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
                <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            }
            label="Next stop"
            value={nextStop?.service_place_name.trim() ?? '—'}
            sub={nextStop ? `ETA ${nextStop.expected_time}` : undefined}
          />
        </div>
      </div>

      {/* Elapsed + remaining */}
      {(elapsed !== null || (remaining !== null && remaining > 0)) && (
        <div className="flex items-center justify-between text-xs text-zinc-600 light:text-zinc-400 pt-3 border-t border-zinc-800/50 light:border-zinc-200/50">
          {elapsed !== null && elapsed >= 1 && (
            <span>Tracking {formatDuration(elapsed)}</span>
          )}
          {remaining !== null && remaining > 0 && remaining < 720 && (
            <span>~{formatDuration(remaining)} to destination</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Progress ring ──────────────────────────────────────────────────────────────

function ProgressRing({ progress }: { progress: number }) {
  const r = 22
  const size = 64
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 100) / 100)

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-zinc-50 light:text-zinc-900 leading-none">{progress}%</span>
        <span className="text-[9px] text-zinc-600 mt-0.5">done</span>
      </div>
    </div>
  )
}

// ── Delay tile with trend ──────────────────────────────────────────────────────

function DelayTile({ delay, trend }: { delay: number | null; trend: DelayTrend }) {
  const isOnTime = delay === null || delay <= 0
  const trendIcon =
    trend === 'improving' ? <TrendingDown size={10} className="text-emerald-400" /> :
    trend === 'worsening' ? <TrendingUp   size={10} className="text-amber-400"   /> :
    trend === 'stable'    ? <Minus        size={10} className="text-zinc-500"    /> :
    null

  return (
    <div className="rounded-xl bg-zinc-800/40 light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 p-3 space-y-1.5 min-w-0">
      <div className="flex items-center gap-1 text-xs text-zinc-500">
        <span className="truncate">Delay</span>
        {trendIcon && <span className="ml-auto">{trendIcon}</span>}
      </div>
      <div>
        <span className={`text-lg font-semibold leading-none ${isOnTime ? 'text-emerald-400 light:text-emerald-600' : 'text-amber-400 light:text-amber-600'}`}>
          {isOnTime ? 'On time' : `+${delay}m`}
        </span>
        {trend && (
          <p className={`text-[10px] mt-0.5 ${
            trend === 'improving' ? 'text-emerald-500' :
            trend === 'worsening' ? 'text-amber-500'   : 'text-zinc-600'
          }`}>
            {trend === 'improving' ? 'Recovering' : trend === 'worsening' ? 'Growing' : 'Steady'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Generic stat tile ─────────────────────────────────────────────────────────

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  sub?: string
  large?: boolean
  highlight?: boolean
  className?: string
}

function StatTile({ icon, label, value, unit, sub, large, highlight, className = '' }: StatTileProps) {
  return (
    <div className={`rounded-xl bg-zinc-800/40 light:bg-zinc-50 border border-zinc-800 light:border-zinc-200 p-3 space-y-1.5 min-w-0 ${className}`}>
      <div className={`flex items-center gap-1 text-xs ${highlight ? 'text-violet-400 light:text-violet-600' : 'text-zinc-500'}`}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="min-w-0">
        <span className={`font-semibold text-zinc-50 light:text-zinc-900 leading-none ${large ? 'text-2xl' : 'text-sm'}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-zinc-500 ml-1">{unit}</span>}
        {sub && <p className="text-xs text-zinc-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}
