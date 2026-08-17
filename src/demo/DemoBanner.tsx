import { Sparkles, X } from 'lucide-react'

interface DemoBannerProps {
  /** Leave the sample trip and return to the add screen. */
  onExit: () => void
  /** Leave the sample trip and open the add-a-bus sheet. */
  onAddReal: () => void
  className?: string
}

/**
 * Says plainly that this is a simulation, and offers the two things someone
 * might want next: track a real bus, or leave.
 */
export function DemoBanner({ onExit, onAddReal, className = '' }: DemoBannerProps) {
  return (
    <section
      className={`flex items-center gap-3 px-4 py-3.5 rounded-tile border animate-view-in ${className}`}
      style={{ background: 'var(--fmb-signal-wash)', borderColor: 'var(--fmb-signal-edge)' }}
      role="status"
    >
      <span
        className="w-[26px] h-[26px] shrink-0 rounded-[9px] bg-signal-wash
                       flex items-center justify-center text-signal-text"
      >
        <Sparkles size={13} />
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="font-semibold text-[13px] leading-tight text-ink">Sample trip</p>
        <p className="text-[11px] text-ink-3">Simulated data — no real bus is being tracked.</p>
      </div>

      <button
        onClick={onAddReal}
        className="shrink-0 px-3 py-1.5 rounded-badge bg-signal text-signal-ink
                   font-semibold text-[12px] hover:brightness-105 active:scale-95
                   transition-all cursor-pointer"
      >
        Track a real bus
      </button>

      <button
        onClick={onExit}
        aria-label="Exit sample trip"
        title="Exit sample trip"
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-badge text-ink-4
                   hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </section>
  )
}
