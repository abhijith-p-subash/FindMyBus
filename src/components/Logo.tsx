interface LogoProps {
  /** Tile edge in px. The wordmark scales with it. */
  size?: number
  showWordmark?: boolean
}

/**
 * The mark: an amber tile carrying a monoline "f", drawn as geometry rather than
 * type so it renders identically before webfonts load and when rasterised to PNG.
 */
export function Logo({ size = 26, showWordmark = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="FindMyBus"
        className="shrink-0"
      >
        <rect width="64" height="64" rx="19" fill="var(--fmb-signal)" />
        <g
          stroke="var(--fmb-signal-ink)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M40.5 18.5c-5.5-2.4-9.5 0.2-9.5 6.6v23.4" />
          <path d="M24 29.5h14.5" />
        </g>
      </svg>
      {showWordmark && (
        <span
          className="font-display font-semibold text-ink leading-none"
          style={{ fontSize: size * 0.58, letterSpacing: '-0.02em' }}
        >
          findmybus
        </span>
      )}
    </div>
  )
}
