import { Plus, Sun, Moon } from 'lucide-react'
import { Trip } from '../types'
import { Logo } from './Logo'
import { TripCard } from './TripCard'
import { EcoToggle } from './EcoToggle'
import { InstallCard } from './InstallCard'

interface TripRailProps {
  trips: Trip[]
  activeKey?: string
  onOpenTrip: (trip: Trip) => void
  onRemoveTrip: (key: string) => void
  onAdd: () => void
  dataSaver: boolean
  onToggleDataSaver: () => void
  isDark: boolean
  onToggleTheme: () => void
}

/**
 * Desktop-only master pane. Below `lg` the trip list is a full screen of its
 * own, so this is hidden rather than duplicated.
 */
export function TripRail({
  trips,
  activeKey,
  onOpenTrip,
  onRemoveTrip,
  onAdd,
  dataSaver,
  onToggleDataSaver,
  isDark,
  onToggleTheme,
}: TripRailProps) {
  return (
    <aside
      className="hidden lg:flex flex-col w-[340px] xl:w-[380px] shrink-0 h-dvh sticky top-0
                      border-r border-line-soft bg-app"
    >
      <div className="px-5 h-16 flex items-center justify-between shrink-0">
        <Logo />
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 flex items-center justify-center rounded-ctl border border-line
                       bg-surface text-ink-3 hover:text-ink hover:border-line-strong
                       active:scale-95 transition-all cursor-pointer"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onAdd}
            aria-label="Add trip"
            className="w-9 h-9 flex items-center justify-center rounded-ctl bg-signal text-signal-ink
                       hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={17} strokeWidth={2.6} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-3 flex items-baseline justify-between shrink-0">
        <p className="eyebrow">Your trips</p>
        <span className="font-mono text-[11px] text-ink-5 tnum">
          {String(trips.length).padStart(2, '0')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-2.5">
        {trips.length === 0 ? (
          <button
            onClick={onAdd}
            className="mt-2 p-5 rounded-card border border-dashed border-line text-left
                       hover:border-signal-edge transition-colors cursor-pointer"
          >
            <p className="font-display font-semibold text-base text-ink">No trips yet</p>
            <p className="mt-1 text-[13px] text-ink-4">Paste a tracking link to get started.</p>
          </button>
        ) : (
          trips.map(trip => (
            <TripCard
              key={trip.key}
              trip={trip}
              compact
              active={trip.key === activeKey}
              onOpen={() => onOpenTrip(trip)}
              onRemove={() => onRemoveTrip(trip.key)}
            />
          ))
        )}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-2.5 shrink-0">
        <InstallCard />
        <EcoToggle enabled={dataSaver} onToggle={onToggleDataSaver} />
      </div>
    </aside>
  )
}
