interface Service {
  name: string
  url: string
  description: string
  icon: string
  active: boolean
}

const SERVICES: Service[] = [
  {
    name: 'Trackingo',
    url: 'bus.trackingo.in',
    description: 'Inter-city & state bus tracking',
    icon: '🚌',
    active: true,
  },
  {
    name: 'More coming soon',
    url: '',
    description: 'Additional operators will be added',
    icon: '🔜',
    active: false,
  },
]

interface SupportedServicesProps {
  compact?: boolean
}

export function SupportedServices({ compact = false }: SupportedServicesProps) {
  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-zinc-800 light:bg-zinc-200" />
        <p className="text-xs font-semibold text-zinc-600 light:text-zinc-400 uppercase tracking-widest px-1">
          Supported services
        </p>
        <div className="h-px flex-1 bg-zinc-800 light:bg-zinc-200" />
      </div>

      <div className="space-y-2">
        {SERVICES.map(service => (
          <ServiceCard key={service.name} service={service} compact={compact} />
        ))}
      </div>
    </div>
  )
}

function ServiceCard({ service, compact }: { service: Service; compact: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border transition-colors
        ${service.active
          ? 'bg-zinc-900 light:bg-white border-zinc-800 light:border-zinc-200'
          : 'bg-zinc-900/40 light:bg-zinc-50 border-zinc-800/50 light:border-zinc-200/60'
        }
        ${compact ? 'px-3 py-2.5' : 'px-4 py-3'}
      `}
    >
      {/* Icon */}
      <span className={`shrink-0 ${compact ? 'text-base' : 'text-xl'}`} role="img" aria-label={service.name}>
        {service.icon}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold truncate ${
            service.active
              ? 'text-zinc-100 light:text-zinc-900'
              : 'text-zinc-600 light:text-zinc-400'
          } ${compact ? 'text-xs' : 'text-sm'}`}>
            {service.name}
          </span>
        </div>
        {!compact && (
          <p className={`text-xs mt-0.5 truncate ${
            service.active ? 'text-zinc-500' : 'text-zinc-700 light:text-zinc-400'
          }`}>
            {service.active ? service.url : service.description}
          </p>
        )}
        {compact && service.active && (
          <p className="text-xs text-zinc-600 light:text-zinc-400 truncate font-mono">{service.url}</p>
        )}
      </div>

      {/* Status badge */}
      {service.active ? (
        <div className="flex items-center gap-1.5 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse shrink-0" />
          <span className="text-xs font-semibold text-emerald-400 light:text-emerald-600">Live</span>
        </div>
      ) : (
        <div className="shrink-0 bg-zinc-800/60 light:bg-zinc-100 border border-zinc-700/50 light:border-zinc-300 rounded-full px-2 py-0.5">
          <span className="text-xs font-medium text-zinc-600 light:text-zinc-400">Soon</span>
        </div>
      )}
    </div>
  )
}
