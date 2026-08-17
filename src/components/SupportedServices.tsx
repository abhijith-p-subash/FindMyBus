interface Service {
  name: string
  example: string
  active: boolean
}

const SERVICES: Service[] = [
  { name: 'Trackingo',       example: 'bus.trackingo.in', active: true },
  { name: 'Trackingo short', example: 'trkg.in',          active: true },
  { name: 'Bare code',       example: 'AB1234',           active: true },
  { name: 'More operators',  example: 'soon',             active: false },
]

/** The "works with" list — an accepted-formats reference, not a feature grid. */
export function SupportedServices() {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="eyebrow">Works with</p>
      <ul className="flex flex-col gap-px rounded-tile overflow-hidden border border-line-soft">
        {SERVICES.map(service => (
          <li
            key={service.name}
            className={`flex items-center justify-between gap-3 px-4 py-3.5 bg-surface-2
                        ${service.active ? '' : 'opacity-60'}`}
          >
            <span className="text-sm text-ink-2">{service.name}</span>
            <span className="font-mono text-[12px] text-ink-4 truncate">{service.example}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * One-line variant for places that cannot afford the full list — the add sheet
 * and the trip-list footer. Same source of truth, no extra vertical cost.
 */
export function ServicesNote({ className = '' }: { className?: string }) {
  const active = SERVICES.filter(s => s.active)

  return (
    <p className={`text-[11px] leading-relaxed text-ink-4 ${className}`}>
      <span className="text-ink-3">Works with </span>
      {active.map((service, i) => (
        <span key={service.name}>
          <span className="font-mono text-ink-3">{service.example}</span>
          {i < active.length - 2 ? ', ' : i === active.length - 2 ? ' or ' : ''}
        </span>
      ))}
      <span> · more operators soon</span>
    </p>
  )
}
