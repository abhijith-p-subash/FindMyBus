import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle size={20} className="text-red-400 light:text-red-500" />
      </div>
      <div>
        <p className="text-zinc-300 light:text-zinc-700 font-medium">Unable to load</p>
        <p className="text-sm text-zinc-500 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 text-sm text-zinc-300 light:text-zinc-700 bg-zinc-800 light:bg-zinc-100 hover:bg-zinc-700 light:hover:bg-zinc-200 border border-zinc-700 light:border-zinc-300 px-4 py-2 rounded-lg transition-colors cursor-pointer"
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  )
}
