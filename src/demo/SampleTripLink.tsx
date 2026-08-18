import { Sparkles } from 'lucide-react'

interface SampleTripLinkProps {
  onStart: () => void
  /** `quiet` sits in a footer; `card` is a tappable row for the rail. */
  variant?: 'quiet' | 'card'
  label?: string
  className?: string
}

/**
 * Entry point to the sample trip. Shared so every surface offers it — first run,
 * the trip list once you have trips, and the desktop rail — rather than only the
 * empty state.
 */
export function SampleTripLink({
  onStart,
  variant = 'quiet',
  label = 'Watch a sample trip',
  className = '',
}: SampleTripLinkProps) {
  if (variant === 'card') {
    return (
      <button
        onClick={onStart}
        className={`flex items-center gap-2.5 rounded-tile border border-line bg-surface-2 px-4 py-3
                    text-left transition-colors hover:border-line-strong ${className}`}
      >
        <Sparkles size={13} className="shrink-0 text-signal-text" />
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium leading-none text-ink">{label}</span>
          <span className="text-[11px] text-ink-4">No tracking link needed</span>
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onStart}
      className={`cursor-pointer text-[12px] text-ink-4 transition-colors hover:text-signal-text ${className}`}
    >
      {label} →
    </button>
  )
}
