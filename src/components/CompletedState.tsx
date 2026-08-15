import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface CompletedStateProps {
  message: string
  onDone: () => void
}

const AUTO_DISMISS_SECS = 5

export function CompletedState({ message, onDone }: CompletedStateProps) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_SECS)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(interval); onDone(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onDone])

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] gap-6 text-center px-6 animate-view-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-complete-bounce">
          <CheckCircle2 size={32} className="text-emerald-400 light:text-emerald-600" />
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h2 className="text-xl font-semibold text-zinc-100 light:text-zinc-900">Trip Complete</h2>
        <p className="text-sm text-zinc-400 light:text-zinc-500 leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <svg className="-rotate-90" width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#27272A" strokeWidth="3" className="light:hidden" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="#E4E4E7" strokeWidth="3" className="hidden light:block" />
          <circle
            cx="20" cy="20" r="16" fill="none" stroke="#7C3AED" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - remaining / AUTO_DISMISS_SECS)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <p className="text-xs text-zinc-600 light:text-zinc-400">Returning in {remaining}s</p>
      </div>

      <button
        onClick={onDone}
        className="px-6 py-2.5 bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 active:bg-zinc-600 light:active:bg-zinc-300 text-zinc-200 light:text-zinc-800 text-sm font-medium rounded-xl transition-all cursor-pointer"
      >
        Back to trips
      </button>
    </div>
  )
}
