export function LoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-5 animate-view-in"
      aria-busy="true"
      aria-label="Loading live data"
    >
      <div className="shimmer h-56 !rounded-card" />

      <div className="p-5 rounded-hero bg-surface border border-line-strong flex flex-col gap-[18px]">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="shimmer h-2.5 w-20" />
            <div className="shimmer h-7 w-2/3" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="shimmer h-9 w-14" />
            <div className="shimmer h-2.5 w-16" />
          </div>
        </div>
        <div className="shimmer h-[5px] !rounded-full" />
        <div className="flex gap-2">
          <div className="shimmer h-[76px] flex-1 !rounded-tile" />
          <div className="shimmer h-[76px] flex-1 !rounded-tile" />
          <div className="shimmer h-[76px] flex-1 !rounded-tile" />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex gap-3.5 items-start">
            <div className="shimmer w-3 h-3 !rounded-full mt-1 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="shimmer h-4" style={{ width: `${70 - i * 12}%` }} />
              <div className="shimmer h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
