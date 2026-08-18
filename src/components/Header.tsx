import { useRef, useState, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Sun,
  Moon,
  Share2,
  Check,
  Link2,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import { Logo } from './Logo'

const ctlClass =
  'w-9 h-9 flex items-center justify-center rounded-ctl border border-line bg-surface ' +
  'text-ink-3 hover:text-ink hover:border-line-strong active:scale-95 transition-all cursor-pointer shrink-0'

function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={ctlClass}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}

// ── List header ───────────────────────────────────────────────────────────────

interface ListHeaderProps {
  onAdd: () => void
  isDark: boolean
  onToggleTheme: () => void
}

export function ListHeader({ onAdd, isDark, onToggleTheme }: ListHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-app/90 backdrop-blur-md pt-safe">
      <div className="max-w-2xl lg:max-w-none mx-auto px-5 h-14 flex items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          <button
            onClick={onAdd}
            className="h-9 px-3 sm:px-4 flex items-center gap-2 rounded-ctl bg-signal text-signal-ink
                       font-semibold text-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Add trip"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span className="hidden sm:inline">Add trip</span>
          </button>
        </div>
      </div>
    </header>
  )
}

// ── Tracking header ───────────────────────────────────────────────────────────

interface TrackHeaderProps {
  tripKey: string
  tripName: string
  subtitle: string
  /** Renders translucent so it can sit over the full-bleed map. */
  overMap?: boolean
  onBack: () => void
  onShare: () => void
  onShareWhatsApp: () => void
  onRefresh: () => void
  shareCopied: boolean
  loading: boolean
  isDark: boolean
  onToggleTheme: () => void
}

export function TrackHeader({
  tripKey,
  tripName,
  subtitle,
  overMap = false,
  onBack,
  onShare,
  onShareWhatsApp,
  onRefresh,
  shareCopied,
  loading,
  isDark,
  onToggleTheme,
}: TrackHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const surface = overMap
    ? 'bg-surface/80 backdrop-blur-md border-line-strong'
    : 'bg-surface border-line'

  const handleShare = () => {
    if (typeof navigator.share === 'function') onShare()
    else setMenuOpen(o => !o)
  }

  return (
    <header className="relative z-20 px-4 sm:px-5 pt-safe-2 pb-3 flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label="Back to trips"
        className={`w-9 h-9 lg:hidden flex items-center justify-center rounded-ctl border
                    text-ink active:scale-95 transition-all cursor-pointer shrink-0 ${surface}`}
      >
        <ArrowLeft size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="font-display font-semibold text-[17px] leading-tight tracking-tight text-ink truncate">
          {tripName !== tripKey ? tripName : 'Tracking'}
        </h1>
        <p className="mt-0.5 font-mono text-[11px] leading-none text-ink-3 flex items-center gap-1.5 truncate">
          <span>{tripKey}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-ink-5 shrink-0" />
          <span className="truncate">{subtitle}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh now"
          className={`w-9 h-9 hidden sm:flex items-center justify-center rounded-ctl border
                      text-ink-3 hover:text-ink active:scale-95 transition-all cursor-pointer
                      disabled:opacity-40 ${surface}`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        <button
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`w-9 h-9 flex items-center justify-center rounded-ctl border
                      text-ink-3 hover:text-ink active:scale-95 transition-all cursor-pointer ${surface}`}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={handleShare}
            aria-label={shareCopied ? 'Link copied' : 'Share this trip'}
            className={`w-9 h-9 flex items-center justify-center rounded-ctl border
                        text-ink active:scale-95 transition-all cursor-pointer ${surface}`}
          >
            {shareCopied ? <Check size={15} className="text-go-text" /> : <Share2 size={15} />}
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-44 rounded-tile bg-surface border border-line
                            shadow-[var(--fmb-shadow-pop)] overflow-hidden z-30 animate-view-in"
            >
              <button
                onClick={() => {
                  onShare()
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-2
                           hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <Link2 size={14} className="text-ink-4 shrink-0" /> Copy link
              </button>
              <div className="mx-3 h-px bg-line-soft" />
              <button
                onClick={() => {
                  onShareWhatsApp()
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-2
                           hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <MessageCircle size={14} className="text-go-text shrink-0" /> WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
