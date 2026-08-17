interface EcoToggleProps {
  enabled: boolean
  onToggle: () => void
}

export function EcoToggle({ enabled, onToggle }: EcoToggleProps) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-tile bg-surface
                 border border-line hover:border-line-strong transition-colors cursor-pointer text-left"
    >
      <span className="flex flex-col gap-0.5">
        <span className="font-medium text-[13px] leading-none text-ink">Eco mode</span>
        <span className="text-[11px] text-ink-4">Refresh every {enabled ? '60s' : '30s'}</span>
      </span>

      <span
        className={`relative w-11 h-[26px] rounded-full shrink-0 transition-colors
                    ${enabled ? 'bg-signal' : 'bg-line'}`}
      >
        <span
          className={`absolute top-[3px] w-5 h-5 rounded-full transition-all
                      ${enabled ? 'right-[3px] bg-signal-ink' : 'left-[3px] bg-ink-3'}`}
        />
      </span>
    </button>
  )
}
