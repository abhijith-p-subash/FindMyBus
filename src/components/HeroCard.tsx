import { TrendingDown, TrendingUp, Minus, Zap, Leaf } from 'lucide-react'
import { ApiResponse } from '../types'
import { DelayTrend } from '../hooks/useBusTracker'
import {
  dedupeStops,
  computeProgress,
  findNextStop,
  stopName,
  formatClock,
  minutesUntil,
} from '../utils'

interface HeroCardProps {
  data: ApiResponse
  delayTrend: DelayTrend
  stale: boolean
  dataSaver: boolean
  onToggleDataSaver: () => void
  className?: string
}

/**
 * The answer card. Everything else on the screen is supporting evidence for the
 * two figures here: which stop is next, and how long until it.
 */
export function HeroCard({
  data,
  delayTrend,
  stale,
  dataSaver,
  onToggleDataSaver,
  className = '',
}: HeroCardProps) {
  const stops = dedupeStops(data.eta_map_data, data.current_sp_id)
  const currentStop = data.eta_map_data.find(s => s.id === data.current_sp_id)
  const next = findNextStop(data)

  const idx = stops.findIndex(s => s.id === data.current_sp_id)
  const progress = computeProgress(data)
  const delay = currentStop?.delay_time ?? null

  const nextEta = next
    ? formatClock(next.expected_time || next.arrival_time || next.scheduled_time)
    : ''
  const mins = next
    ? minutesUntil(next.expected_time || next.arrival_time || next.scheduled_time)
    : null
  const minsLabel = mins === null ? '—' : mins <= 0 ? 'now' : String(mins)

  return (
    <section
      className={`p-5 rounded-hero bg-surface border border-line-strong flex flex-col gap-[18px]
                  shadow-[var(--fmb-shadow-card)] ${stale ? 'opacity-75' : ''} ${className}`}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <p className="eyebrow">{stale ? 'Last next stop' : 'Next stop'}</p>
          <h2 className="font-display font-semibold text-[26px] leading-[1.05] tracking-[-0.03em] text-ink truncate">
            {stopName(next) || '—'}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span
            className={`font-mono font-semibold text-[40px] leading-none tracking-[-0.04em] tnum
                        ${stale ? 'text-ink-3' : 'text-signal-text'}`}
          >
            {stale && mins !== null ? '~' : ''}
            {minsLabel}
          </span>
          <span className="eyebrow">{stale ? 'est. min' : 'min away'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="h-[5px] rounded-full bg-line overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out
                        ${stale ? 'bg-ink-5' : 'bg-signal'}`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-[11px] text-ink-4 tnum">
          <span>
            Stop {idx === -1 ? '—' : idx + 1} / {stops.length}
          </span>
          <span>{progress}% of route</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Tile label="Delay">
          <span
            className={`font-mono font-semibold text-lg leading-none tnum
                            ${delay && delay > 0 ? 'text-delay-text' : 'text-go-text'}`}
          >
            {delay && delay > 0 ? `+${delay}m` : '0m'}
          </span>
          <TrendNote trend={delayTrend} />
        </Tile>

        <Tile label="Arrives">
          <span className="font-mono font-semibold text-lg leading-none text-ink tnum">
            {nextEta || '—'}
          </span>
          <span className="text-[10px] text-ink-4 truncate">
            {next ? `at ${stopName(next)}` : 'end of route'}
          </span>
        </Tile>

        <Tile
          label="Mode"
          onClick={onToggleDataSaver}
          title={
            dataSaver
              ? 'Eco — refreshes every 60s. Tap for live.'
              : 'Live — refreshes every 30s. Tap for eco.'
          }
        >
          <span className="font-mono font-semibold text-lg leading-none text-ink tnum">
            {dataSaver ? '60s' : '30s'}
          </span>
          <span
            className={`text-[10px] flex items-center gap-1 ${dataSaver ? 'text-go-text' : 'text-signal-text'}`}
          >
            {dataSaver ? (
              <>
                <Leaf size={9} /> eco
              </>
            ) : (
              <>
                <Zap size={9} /> live
              </>
            )}
          </span>
        </Tile>
      </div>
    </section>
  )
}

// ── Parts ─────────────────────────────────────────────────────────────────────

interface TileProps {
  label: string
  children: React.ReactNode
  onClick?: () => void
  title?: string
}

function Tile({ label, children, onClick, title }: TileProps) {
  const Element = onClick ? 'button' : 'div'
  return (
    <Element
      onClick={onClick}
      title={title}
      className={`flex-1 min-w-0 p-3 rounded-tile bg-surface-3 border border-line
                  flex flex-col gap-1.5 items-start text-left transition-colors
                  ${onClick ? 'cursor-pointer hover:border-line-strong' : ''}`}
    >
      <span className="eyebrow !text-[9px] !tracking-[0.14em]">{label}</span>
      {children}
    </Element>
  )
}

function TrendNote({ trend }: { trend: DelayTrend }) {
  if (!trend) return <span className="text-[10px] text-ink-4">—</span>
  const map = {
    improving: { icon: <TrendingDown size={9} />, text: 'improving', cls: 'text-go-text' },
    worsening: { icon: <TrendingUp size={9} />, text: 'growing', cls: 'text-delay-text' },
    stable: { icon: <Minus size={9} />, text: 'stable', cls: 'text-ink-4' },
  }[trend]
  return (
    <span className={`text-[10px] flex items-center gap-1 ${map.cls}`}>
      {map.icon} {map.text}
    </span>
  )
}
