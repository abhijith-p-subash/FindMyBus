import { useEffect, useState } from 'react'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { elapsedShort } from '../utils'

interface StaleBannerProps {
  lastUpdated: Date | null
  retryIn: number
  offline: boolean
  onRetry: () => void
  className?: string
}

/**
 * Trust in a live tracker is built by admitting when it isn't live. This says
 * exactly how old the data is and when the next attempt lands.
 */
export function StaleBanner({
  lastUpdated,
  retryIn,
  offline,
  onRetry,
  className = '',
}: StaleBannerProps) {
  const [, tick] = useState(0)

  // The age has to keep counting even though no new data is arriving.
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      className={`flex items-center gap-3 px-4 py-3.5 rounded-tile border animate-view-in ${className}`}
      style={{ background: 'var(--fmb-delay-wash)', borderColor: 'var(--fmb-delay-edge)' }}
      role="status"
    >
      <span
        className="w-[26px] h-[26px] shrink-0 rounded-[9px] bg-delay-wash
                       flex items-center justify-center text-delay-text"
      >
        {offline ? <AlertTriangle size={13} /> : <WifiOff size={13} />}
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="font-semibold text-[13px] leading-tight text-ink">
          Showing last known position
        </p>
        <p className="text-[11px] text-ink-3 tnum truncate">
          {lastUpdated ? `Updated ${elapsedShort(lastUpdated)} ago` : 'Never updated'}
          {' · '}
          {offline ? 'waiting for connection' : `retrying in ${retryIn}s`}
        </p>
      </div>

      <button
        onClick={onRetry}
        className="shrink-0 font-mono font-medium text-[11px] tracking-wide text-delay-text
                   px-2.5 py-1.5 rounded-badge hover:bg-delay-wash transition-colors cursor-pointer"
      >
        RETRY
      </button>
    </section>
  )
}
