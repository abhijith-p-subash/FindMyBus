import { SupportedServices } from './SupportedServices'

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4 animate-view-in">
      <div className="w-20 h-20 rounded-3xl bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 flex items-center justify-center shadow-sm light:shadow-zinc-200/60">
        <img src="/bus.svg" alt="" className="w-12 h-12 object-contain" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-200 light:text-zinc-800">No trips yet</h2>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          Paste the tracking URL from your travel agency to start following your bus in real time.
        </p>
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Track a bus
      </button>

      <div className="w-full max-w-sm">
        <SupportedServices />
      </div>
    </div>
  )
}
