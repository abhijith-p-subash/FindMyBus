import { Trip } from '../types'
import { AddTripResult } from '../hooks/useTrips'
import { ListHeader } from './Header'
import { TripCard } from './TripCard'
import { FirstRun } from './FirstRun'
import { InstallCard } from './InstallCard'
import { EcoToggle } from './EcoToggle'
import { ServicesNote } from './SupportedServices'
import { BuyMeCoffeeButton } from './BuyMeCoffeeButton'

interface TripListScreenProps {
  trips: Trip[]
  onOpenTrip: (trip: Trip) => void
  onRemoveTrip: (key: string) => void
  onAdd: () => void
  onQuickAdd: (url: string, name: string) => AddTripResult
  onStartDemo: () => void
  dataSaver: boolean
  onToggleDataSaver: () => void
  isDark: boolean
  onToggleTheme: () => void
  animClass?: string
}

export function TripListScreen({
  trips,
  onOpenTrip,
  onRemoveTrip,
  onAdd,
  onQuickAdd,
  onStartDemo,
  dataSaver,
  onToggleDataSaver,
  isDark,
  onToggleTheme,
  animClass = '',
}: TripListScreenProps) {
  const empty = trips.length === 0

  return (
    <div className={`min-h-dvh flex flex-col bg-app text-ink ${animClass}`}>
      <ListHeader onAdd={onAdd} isDark={isDark} onToggleTheme={onToggleTheme} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-5 pb-8">
        {empty ? (
          <FirstRun onAdd={onQuickAdd} onStartDemo={onStartDemo} />
        ) : (
          <div className="flex flex-col gap-5 pt-6">
            <div className="flex items-baseline gap-2.5">
              <h1 className="font-display font-semibold text-[30px] leading-none tracking-[-0.03em] text-ink">
                Your trips
              </h1>
              <span className="font-mono font-medium text-[13px] text-ink-5 tnum">
                {String(trips.length).padStart(2, '0')}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {trips.map((trip, i) => (
                <TripCard
                  key={trip.key}
                  trip={trip}
                  onOpen={() => onOpenTrip(trip)}
                  onRemove={() => onRemoveTrip(trip.key)}
                  style={{ animationDelay: `${i * 55}ms` }}
                />
              ))}
            </div>

            <InstallCard />
            <EcoToggle enabled={dataSaver} onToggle={onToggleDataSaver} />
          </div>
        )}
      </main>

      <footer className="w-full max-w-2xl mx-auto px-5 pb-safe pt-2 flex flex-col items-center gap-3">
        {/* First run already shows the full "Works with" list, so only repeat it
            here once the user has trips and that screen is gone. */}
        {!empty && <ServicesNote className="text-center" />}
        <BuyMeCoffeeButton />
        <p className="text-[11px] text-ink-5 text-center">
          FindMyBus · all data stays in your browser
        </p>
      </footer>
    </div>
  )
}
