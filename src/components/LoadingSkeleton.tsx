export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Live card skeleton */}
      <div className="rounded-2xl bg-zinc-900 light:bg-white border border-zinc-800 light:border-zinc-200 p-5 space-y-4">
        <div className="h-3 w-16 bg-zinc-800 light:bg-zinc-100 rounded-full" />
        <div className="h-4 w-3/4 bg-zinc-800 light:bg-zinc-100 rounded-full" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-xl bg-zinc-800/50 light:bg-zinc-100 border border-zinc-800 light:border-zinc-200 p-3 h-16" />
          ))}
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-4 h-4 rounded-full bg-zinc-800 light:bg-zinc-200 mt-0.5 shrink-0" />
            <div className="flex-1 flex justify-between">
              <div className="h-4 bg-zinc-800 light:bg-zinc-200 rounded-full" style={{ width: `${40 + (i * 7 % 40)}%` }} />
              <div className="h-4 w-14 bg-zinc-800 light:bg-zinc-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
