import { Download, Share, X } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

/**
 * Install affordance. Chromium gets a real button; iOS gets the manual
 * instruction, because Safari exposes no install API at all.
 */
export function InstallCard() {
  const { canInstall, iosHint, install, dismiss } = useInstallPrompt()

  if (!canInstall && !iosHint) return null

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3.5 rounded-tile bg-surface-2
                    border border-line animate-view-in"
    >
      <span
        className="w-[26px] h-[26px] shrink-0 rounded-[9px] bg-signal-wash
                       flex items-center justify-center text-signal-text"
      >
        {iosHint ? <Share size={13} /> : <Download size={13} />}
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <p className="font-semibold text-[13px] leading-tight text-ink">Install FindMyBus</p>
        <p className="text-[11px] text-ink-3 truncate">
          {iosHint ? 'Share → Add to Home Screen' : 'Full screen, works offline'}
        </p>
      </div>

      {canInstall && (
        <button
          onClick={install}
          className="shrink-0 px-3 py-1.5 rounded-badge bg-signal text-signal-ink
                     font-semibold text-[12px] hover:brightness-105 active:scale-95
                     transition-all cursor-pointer"
        >
          Install
        </button>
      )}

      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-badge text-ink-4
                   hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
      >
        <X size={13} />
      </button>
    </div>
  )
}
