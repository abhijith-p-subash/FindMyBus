import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-5 py-20 px-4 animate-view-in">
      <span className="w-14 h-14 rounded-full bg-delay-wash flex items-center justify-center text-delay-text">
        <AlertTriangle size={22} />
      </span>
      <div className="flex flex-col gap-2 max-w-xs">
        <h2 className="font-display font-semibold text-xl tracking-tight text-ink">
          Couldn’t reach the bus
        </h2>
        <p className="text-sm leading-relaxed text-ink-3 text-pretty">
          The operator’s tracker didn’t respond. It may be offline between trips.
        </p>
        <p className="font-mono text-[11px] text-ink-5 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-3 rounded-field bg-signal text-signal-ink
                   font-semibold text-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
      >
        <RefreshCw size={14} strokeWidth={2.5} /> Try again
      </button>
    </div>
  )
}
