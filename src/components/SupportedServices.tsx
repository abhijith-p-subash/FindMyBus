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
    </p>
  )
}
