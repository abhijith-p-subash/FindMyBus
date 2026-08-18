/**
 * The standing disclosure line.
 *
 * Two claims that must stay accurate, because overstating either is its own
 * legal problem (see doc/LEGAL.md §6):
 *
 *  · trips really do stay on the device — say that, and only that
 *  · the app is not affiliated with Bitla Software, who own the live data
 *
 * Do not shorten this to "all data stays in your browser". Tracking requests are
 * proxied through our host, so that sentence is not true.
 */
export function AppFooter({ prefix }: { prefix?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <p className="text-[11px] text-ink-5">
        {prefix ? `${prefix} · ` : ''}Your trips stay on this device
      </p>
      <p className="text-[10px] leading-relaxed text-ink-5">
        Live data by{' '}
        <a
          href="http://trackingo.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line-strong underline-offset-2 hover:text-ink-4"
        >
          Trackingo
        </a>{' '}
        · not affiliated with Bitla Software
      </p>
    </div>
  )
}
