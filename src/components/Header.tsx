import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, Plus, RefreshCw, Sun, Moon, Share2, Check, Link2, MessageCircle } from 'lucide-react'
import { formatLastUpdated } from '../utils'

type HeaderProps =
  | { mode: 'list'; onAdd: () => void; isDark: boolean; onToggleTheme: () => void }
  | {
      mode: 'tracking'
      tripKey: string
      tripName: string
      lastUpdated: Date | null
      countdown: number
      onRefresh: () => void
      onBack: () => void
      onShare: () => void
      onShareWhatsApp: () => void
      shareCopied: boolean
      loading: boolean
      isDark: boolean
      onToggleTheme: () => void
    }

export function Header(props: HeaderProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close share menu when clicking outside
  useEffect(() => {
    if (!showShareMenu) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowShareMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showShareMenu])

  const ThemeToggle = (
    <button
      onClick={props.onToggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 light:text-zinc-500 hover:text-zinc-50 light:hover:text-zinc-900 hover:bg-zinc-800 light:hover:bg-zinc-100 active:bg-zinc-700 light:active:bg-zinc-200 transition-all cursor-pointer shrink-0"
      aria-label={props.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {props.isDark
        ? <Sun size={16} />
        : <Moon size={16} />
      }
    </button>
  )

  if (props.mode === 'list') {
    return (
      <header className="sticky top-0 z-20 bg-zinc-950/90 light:bg-white/90 backdrop-blur-md border-b border-zinc-800/60 light:border-zinc-200/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img src="/bus.svg" alt="" className="w-8 h-8 object-contain shrink-0" />
            <span className="text-sm font-semibold text-zinc-50 light:text-zinc-900">FindMyBus</span>
          </div>

          <div className="flex items-center gap-1">
            {ThemeToggle}
            <button
              onClick={props.onAdd}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium transition-all cursor-pointer rounded-full h-9 px-3 sm:px-4 text-sm"
              aria-label="Add trip"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Add trip</span>
            </button>
          </div>
        </div>
      </header>
    )
  }

  const handleShareClick = () => {
    // On mobile with native share, use it directly; on desktop show dropdown
    if (typeof navigator.share === 'function') {
      props.onShare()
    } else {
      setShowShareMenu(prev => !prev)
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-zinc-950/90 light:bg-white/90 backdrop-blur-md border-b border-zinc-800/60 light:border-zinc-200/60">
      <div className="max-w-2xl mx-auto px-2 h-14 flex items-center justify-between gap-2">
        {/* Back + title */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            onClick={props.onBack}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-zinc-400 light:text-zinc-500 hover:text-zinc-50 light:hover:text-zinc-900 hover:bg-zinc-800 light:hover:bg-zinc-100 active:bg-zinc-700 light:active:bg-zinc-200 transition-all shrink-0 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-50 light:text-zinc-900 leading-none truncate">
              {props.tripName !== props.tripKey ? props.tripName : 'Tracking'}
            </p>
            <p className="text-xs font-mono text-zinc-500 light:text-zinc-500 mt-0.5">{props.tripKey}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {props.lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse inline-block" />
              <span className="hidden sm:inline font-mono">{formatLastUpdated(props.lastUpdated)} ·</span>
              <span className="tabular-nums">{props.countdown}s</span>
            </div>
          )}
          {ThemeToggle}

          {/* Share button + dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={handleShareClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 light:text-zinc-500 hover:text-zinc-50 light:hover:text-zinc-900 hover:bg-zinc-800 light:hover:bg-zinc-100 active:bg-zinc-700 light:active:bg-zinc-200 transition-all cursor-pointer"
              aria-label={props.shareCopied ? 'Link copied!' : 'Share trip'}
              title={props.shareCopied ? 'Link copied!' : 'Share trip link'}
            >
              {props.shareCopied
                ? <Check size={15} className="text-emerald-400" />
                : <Share2 size={15} />
              }
            </button>

            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 rounded-2xl shadow-xl shadow-black/40 light:shadow-zinc-300/40 overflow-hidden z-30 animate-view-in">
                <button
                  onClick={() => { props.onShare(); setShowShareMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-200 light:text-zinc-700 hover:bg-zinc-800 light:hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <Link2 size={14} className="text-zinc-400 shrink-0" />
                  Copy link
                </button>
                <div className="mx-3 h-px bg-zinc-800 light:bg-zinc-100" />
                <button
                  onClick={() => { props.onShareWhatsApp(); setShowShareMenu(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-200 light:text-zinc-700 hover:bg-zinc-800 light:hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <MessageCircle size={14} className="text-emerald-400 shrink-0" />
                  WhatsApp
                </button>
              </div>
            )}
          </div>

          <button
            onClick={props.onRefresh}
            disabled={props.loading}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 light:text-zinc-500 hover:text-zinc-50 light:hover:text-zinc-900 hover:bg-zinc-800 light:hover:bg-zinc-100 active:bg-zinc-700 light:active:bg-zinc-200 transition-all disabled:opacity-40 cursor-pointer"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={props.loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </header>
  )
}
