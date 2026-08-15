import { WifiOff } from 'lucide-react'
import { formatLastUpdated } from '../utils'

interface OfflineBannerProps {
  lastUpdated: Date | null
  currentStopName: string | null
}

export function OfflineBanner({ lastUpdated, currentStopName }: OfflineBannerProps) {
  return (
    <div className="shrink-0 border-b border-amber-500/25 bg-amber-500/[0.08] light:bg-amber-50 animate-view-in">
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
        <WifiOff size={12} className="text-amber-400 light:text-amber-600 shrink-0" />
        <p className="text-xs text-amber-300/80 light:text-amber-800/80 truncate">
          Offline · Showing cached data
          {currentStopName && ` · Last at ${currentStopName}`}
          {lastUpdated && ` · ${formatLastUpdated(lastUpdated)}`}
        </p>
      </div>
    </div>
  )
}
