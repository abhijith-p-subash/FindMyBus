/**
 * Measured floor: below ~28px the window band and wheels merge into a smudge,
 * so the pin goes solid instead. Verified by rendering at 20/24/28/32/48.
 */
const DETAIL_FLOOR = 28

const PIN =
  'M32 5c-11.6 0-21 9.1-21 20.4 0 14.7 17.8 32.6 19.9 34.7a1.6 1.6 0 0 0 2.2 0C35.2 58 53 40.1 53 25.4 53 14.1 43.6 5 32 5Z'

const BUS = [
  'M23 17.5H41A3 3 0 0 1 44 20.5V31.5A3 3 0 0 1 41 34.5H23A3 3 0 0 1 20 31.5V20.5A3 3 0 0 1 23 17.5Z',
  'M25.5 21H38.5A2 2 0 0 1 40.5 23V26A2 2 0 0 1 38.5 28H25.5A2 2 0 0 1 23.5 26V23A2 2 0 0 1 25.5 21Z',
  'M23.8 31.5a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 1 0-4.4 0Z',
  'M35.8 31.5a2.2 2.2 0 1 0 4.4 0 2.2 2.2 0 1 0-4.4 0Z',
].join(' ')

interface MarkProps {
  size?: number
  /** Set on an amber ground — the mark inverts to ink. */
  onSignal?: boolean
  className?: string
}

/**
 * The FindMyBus mark: a location pin with a bus cut out of it.
 *
 * One path with `fillRule="evenodd"`, so nesting alternates fill → hole → fill.
 * The bus body is a genuine hole, which is why the same drawing is correct on any
 * background instead of needing a variant per ground. Keep it that way.
 *
 * Mirrors `public/mark.svg`. Change one, change the other.
 */
export function Mark({ size = 26, onSignal = false, className = '' }: MarkProps) {
  const d = size >= DETAIL_FLOOR ? `${PIN} ${BUS}` : PIN

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="FindMyBus"
      className={`shrink-0 ${className}`}
    >
      <path
        d={d}
        fillRule="evenodd"
        fill={onSignal ? 'var(--fmb-signal-ink)' : 'var(--fmb-signal)'}
      />
    </svg>
  )
}

interface LogoProps {
  /** Mark height in px. The wordmark scales with it. */
  size?: number
  showWordmark?: boolean
}

/** The lockup: bare mark plus wordmark, as used in the header and rail. */
export function Logo({ size = 28, showWordmark = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <Mark size={size} />
      {showWordmark && (
        <span
          className="font-display font-semibold text-ink leading-none"
          style={{ fontSize: size * 0.54, letterSpacing: '-0.02em' }}
        >
          findmybus
        </span>
      )}
    </div>
  )
}
