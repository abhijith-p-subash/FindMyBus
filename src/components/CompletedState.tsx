import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { formatDurationTight } from '../utils'

interface CompletedStateProps {
  tripName: string
  message: string
  stops: number
  durationMins: number | null
  finalDelay: number | null
  /** Clear the trip from the list and go back. */
  onDone: () => void
  /** Keep the trip saved and go back. */
  onKeep: () => void
  /** Overridable because the sample trip has nothing to keep. */
  keepLabel?: string
}

const AUTO_DISMISS_SECS = 5

export function CompletedState({
  tripName, message, stops, durationMins, finalDelay, onDone, onKeep,
  keepLabel = 'Keep on list',
}: CompletedStateProps) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_SECS)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (held) return
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(id); onDone(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [held, onDone])

  const late = finalDelay !== null && finalDelay > 0

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-16 px-4 animate-view-in">
      <div className="relative w-[88px] h-[88px] flex items-center justify-center animate-arrive">
        <span className="absolute inset-0 rounded-full border border-line" />
        <span className="absolute inset-3 rounded-full bg-go-wash" />
        <Check size={32} strokeWidth={2.5} className="relative text-go-text" />
      </div>

      <div className="flex flex-col gap-3 max-w-sm">
        <h2 className="font-display font-semibold text-[32px] leading-[1.05] tracking-[-0.03em] text-ink">
          Arrived
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-3 text-pretty">
          {tripName} {message || 'has completed its trip.'}
        </p>
      </div>

      <dl className="flex gap-6 px-6 py-4.5 rounded-card bg-surface-2 border border-line-soft">
        <Stat value={stops > 0 ? String(stops) : '—'} label="stops" />
        <span className="w-px bg-line-soft" />
        <Stat value={durationMins !== null ? formatDurationTight(durationMins) : '—'} label="duration" />
        <span className="w-px bg-line-soft" />
        <Stat
          value={finalDelay === null ? '—' : late ? `+${finalDelay}m` : '0m'}
          label="final delay"
          tone={late ? 'text-delay-text' : 'text-go-text'}
        />
      </dl>

      {!held && (
        <p className="flex items-center gap-2.5 text-[13px] text-ink-4">
          <span
            className="w-4 h-4 rounded-full border-2 border-line animate-spin block"
            style={{ borderTopColor: 'var(--fmb-signal)' }}
          />
          Clearing this trip in <span className="tnum">{remaining}s</span>
        </p>
      )}

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => { setHeld(true); onKeep() }}
          className="px-5 py-3 rounded-field border border-line bg-surface font-semibold text-sm text-ink
                     hover:border-line-strong active:scale-[0.98] transition-all cursor-pointer"
        >
          {keepLabel}
        </button>
        <button
          onClick={onDone}
          className="px-5 py-3 rounded-field font-semibold text-sm text-ink-4
                     hover:text-ink transition-colors cursor-pointer"
        >
          Clear now
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label, tone = 'text-ink' }: { value: string; label: string; tone?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <dd className={`font-mono font-semibold text-lg leading-none tnum ${tone}`}>{value}</dd>
      <dt className="eyebrow !text-[9px] !tracking-[0.14em]">{label}</dt>
    </div>
  )
}
