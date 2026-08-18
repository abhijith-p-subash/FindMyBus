import { Download, Share, X, MonitorDown } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const COPY = {
  prompt: { icon: Download, hint: 'Full screen, works offline' },
  ios: { icon: Share, hint: 'Share → Add to Home Screen' },
  safari: { icon: MonitorDown, hint: 'File → Add to Dock' },
} as const

/**
 * Install affordance. Only Chromium can trigger the native sheet, so Safari on
 * either platform gets the manual instruction instead of a button that would do
 * nothing.
 */
export function InstallCard() {
  const { mode, install, dismiss } = useInstallPrompt()

  if (!mode) return null

  const { icon: Icon, hint } = COPY[mode]

  return (
    <div
      className="relative flex animate-view-in items-center gap-3 rounded-tile border
                 border-line bg-surface-2 px-4 py-3.5"
    >
      <span
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[9px]
                   bg-signal-wash text-signal-text"
      >
        <Icon size={13} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[13px] font-semibold leading-tight text-ink">Install FindMyBus</p>
        <p className="truncate text-[11px] text-ink-3">{hint}</p>
      </div>

      {mode === 'prompt' && (
        <button
          onClick={install}
          className="shrink-0 cursor-pointer rounded-badge bg-signal px-3 py-1.5 text-[12px]
                     font-semibold text-signal-ink transition-all hover:brightness-105 active:scale-95"
        >
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-badge
                   text-ink-4 transition-colors hover:bg-surface-3 hover:text-ink"
      >
        <X size={13} />
      </button>
    </div>
  )
}
