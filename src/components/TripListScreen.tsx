import { Trip } from '../types'
import { Header } from './Header'
import { TripCard } from './TripCard'
import { EmptyState } from './EmptyState'
import { BuyMeCoffeeButton } from './BuyMeCoffeeButton'


interface TripListScreenProps {
  trips: Trip[]
  onOpenTrip: (trip: Trip) => void
  onRemoveTrip: (key: string) => void
  onAdd: () => void
  isDark: boolean
  onToggleTheme: () => void
  animClass?: string
}

export function TripListScreen({ trips, onOpenTrip, onRemoveTrip, onAdd, isDark, onToggleTheme, animClass = '' }: TripListScreenProps) {
  return (
    <div className={`min-h-screen flex flex-col bg-zinc-950 light:bg-zinc-50 text-zinc-100 light:text-zinc-900 ${animClass}`}>
      <Header mode="list" onAdd={onAdd} isDark={isDark} onToggleTheme={onToggleTheme} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 sm:py-6">
        {trips.length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          <div className="space-y-3">
            {trips.map((trip, idx) => (
              <TripCard
                key={trip.key}
                trip={trip}
                onOpen={() => onOpenTrip(trip)}
                onRemove={() => onRemoveTrip(trip.key)}
                style={{ animationDelay: `${idx * 55}ms` }}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-2xl w-full mx-auto px-4 py-4 pb-safe text-center">
        <p className="text-xs text-zinc-800 light:text-zinc-300">FindMyBus · all data stays in your browser</p>
      </footer>

      <BuyMeCoffeeButton />
    </div>
  )
}
