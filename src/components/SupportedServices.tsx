import { ArrowUpRight } from 'lucide-react'

interface Service {
  name: string
  /** Shown to the user. */
  domain: string
  /** Where the operator's own site lives. */
  href: string
}

/**
 * Operators FindMyBus can actually track — nothing aspirational, and no input
 * formats. The accepted URL shapes are the add sheet's job to explain, not this
 * list's; listing them here made three formats look like three services.
 *
 * Adding an operator means extending `parseTrackingKey` in src/utils.ts too.
 */
const SERVICES: Service[] = [
  { name: 'Trackingo', domain: 'trackingo.in', href: 'http://trackingo.in/' },
]

/** The "works with" list, shown on first run. */
export function SupportedServices() {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="eyebrow">Works with</p>
      <ul className="flex flex-col gap-px overflow-hidden rounded-tile border border-line-soft">
        {SERVICES.map(service => (
          <li key={service.name}>
            <a
              href={service.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 bg-surface-2 px-4 py-3.5
                         transition-colors hover:bg-surface"
            >
              <span className="text-sm text-ink-2">{service.name}</span>
              <span className="flex items-center gap-1.5 font-mono text-[12px] text-ink-4">
                {service.domain}
                <ArrowUpRight size={12} className="shrink-0" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Plain-language statement that this app is a presentation layer and nothing
 * more. Users never read a README, so the disclosure has to live in the product.
 *
 * It also does real UX work: it sets the right expectation for why a bus can
 * stop reporting, which is otherwise read as "this app is broken".
 */
export function DataSourceNote() {
  const [primary] = SERVICES

  return (
    <div className="flex flex-col gap-2 rounded-tile border border-line-soft bg-surface-2 px-4 py-3.5">
      <p className="text-[13px] font-semibold leading-tight text-ink">
        A better screen, not a tracker
      </p>
      <p className="text-[12px] leading-relaxed text-ink-3 text-pretty">
        Every position, stop time and delay you see comes from{' '}
        <a
          href={primary.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-signal-text underline decoration-signal-edge underline-offset-2"
        >
          {primary.name}
        </a>
        , your operator&rsquo;s tracking service. FindMyBus doesn&rsquo;t track buses itself — it
        just presents that same information more clearly. If {primary.name} is down or your bus
        isn&rsquo;t reporting, there is nothing for us to show.
      </p>
      <p className="text-[11px] leading-relaxed text-ink-4">
        Independent and unofficial · not affiliated with Bitla Software
      </p>
    </div>
  )
}

/**
 * One-line variant for places that cannot afford the full list — the add sheet,
 * the trip-list footer, and the desktop placeholder. Same source of truth.
 */
export function ServicesNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-4 ${className}`}>
      <span className="text-ink-3">Works with </span>
      {SERVICES.map((service, i) => (
        <span key={service.name}>
          {i > 0 && ', '}
          <span className="text-ink-3">{service.name}</span>
          <span className="font-mono"> {service.domain}</span>
        </span>
      ))}
      <span> — all live data comes from them</span>
    </p>
  )
}
