import { useEffect, useRef, useState } from 'react'
import { Crosshair, ExternalLink } from 'lucide-react'

interface MapPanelProps {
  lat: number
  lng: number
  speed: number
  location: string
  /** Data is stale — desaturate the tiles and freeze the marker pulse. */
  frozen?: boolean
  /** Clock label shown on the frozen chip. */
  frozenAt?: string
  /** `bleed` sits behind the header on phones; `panel` is a bordered card. */
  variant?: 'bleed' | 'panel'
  className?: string
}

let L: typeof import('leaflet') | null = null

const busIconHtml = (frozen: boolean) => `
  <div style="position:relative;width:40px;height:40px">
    ${frozen ? '' : `<span style="position:absolute;inset:0;border-radius:50%;background:var(--fmb-signal);opacity:.35" class="pulse-ring"></span>`}
    <span style="position:absolute;left:8px;top:8px;width:24px;height:24px;border-radius:50%;
                 background:${frozen ? 'var(--fmb-ink-3)' : 'var(--fmb-signal)'};
                 border:3px solid var(--fmb-bg);display:flex;align-items:center;justify-content:center">
      <svg width="12" height="12" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M32 6a2.6 2.6 0 0 1 2.4 1.6l19.4 46.8a2.6 2.6 0 0 1-3.5 3.3L32 49.4 13.7 57.7a2.6 2.6 0 0 1-3.5-3.3L29.6 7.6A2.6 2.6 0 0 1 32 6Z" fill="var(--fmb-signal-ink)"/>
      </svg>
    </span>
  </div>`

export function MapPanel({
  lat,
  lng,
  speed,
  location,
  frozen = false,
  frozenAt,
  variant = 'panel',
  className = '',
}: MapPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markerRef = useRef<import('leaflet').Marker | null>(null)
  const userMarkerRef = useRef<import('leaflet').Marker | null>(null)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)

  // Init once. Leaflet owns its own DOM, so this must never re-run.
  useEffect(() => {
    if (mapRef.current || !hostRef.current) return

    import('leaflet').then(leaflet => {
      import('leaflet/dist/leaflet.css')
      L = leaflet

      const map = L.map(hostRef.current!, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      L.control.attribution({ prefix: '© OSM' }).addTo(map)

      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: busIconHtml(frozen),
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).addTo(map)

      mapRef.current = map
      markerRef.current = marker
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
      userMarkerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the bus.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    const pos: [number, number] = [lat, lng]
    markerRef.current.setLatLng(pos)
    mapRef.current.panTo(pos, { animate: true, duration: 0.8 })
  }, [lat, lng])

  // Swap the marker when freshness changes.
  useEffect(() => {
    if (!markerRef.current || !L) return
    markerRef.current.setIcon(
      L.divIcon({
        html: busIconHtml(frozen),
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    )
  }, [frozen])

  // The panel changes size at the desktop breakpoint; Leaflet needs telling.
  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => mapRef.current?.invalidateSize())
    ro.observe(host)
    return () => ro.disconnect()
  }, [])

  const locateMe = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        setUserPos({ lat: latitude, lng: longitude })
        setLocating(false)
        if (!mapRef.current || !L) return

        const icon = L.divIcon({
          html: `<div style="width:26px;height:26px;border-radius:50%;background:#3B82F6;
                             border:2.5px solid var(--fmb-bg);box-shadow:0 2px 10px rgb(59 130 246 / .5)"></div>`,
          className: '',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        if (userMarkerRef.current) userMarkerRef.current.setLatLng([latitude, longitude])
        else {
          userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapRef.current)
          userMarkerRef.current.bindTooltip('You', { direction: 'top', offset: [0, -16] })
        }
      },
      () => setLocating(false),
      { timeout: 8000 },
    )
  }

  const openInMaps = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const url = isIOS
      ? `maps://maps.apple.com/?q=${lat},${lng}`
      : `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const bleed = variant === 'bleed'
  const ctl =
    'w-9 h-9 flex items-center justify-center rounded-ctl bg-surface/85 backdrop-blur-md ' +
    'border border-line-strong text-ink-3 hover:text-ink active:scale-95 transition-all cursor-pointer'

  // `isolate z-0` is load-bearing: Leaflet gives its panes and controls z-indexes
  // up to 1000, and with no stacking context here they escape this element and
  // paint over the hero card and timeline below.
  const root = `relative isolate z-0 overflow-hidden bg-surface-3 ${frozen ? 'map-frozen' : ''} ${className}`

  return (
    <div className={root}>
      <div ref={hostRef} className="absolute inset-0" />

      {/* On phones the map runs edge to edge and dissolves into the page so the
          hero card can overlap it. On desktop it is a contained panel instead. */}
      {bleed && (
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none lg:hidden"
          style={{ background: 'linear-gradient(180deg, transparent, var(--fmb-bg))' }}
        />
      )}

      <div className="absolute top-3 left-3 right-3 z-[900] flex items-start justify-between gap-2 pointer-events-none">
        <span
          className="max-w-[62%] truncate px-2.5 py-1.5 rounded-chip bg-surface/85 backdrop-blur-md
                         border border-line-strong text-[12px] text-ink-2"
        >
          {location}
        </span>
        {!frozen && (
          <span
            className="shrink-0 px-2.5 py-1.5 rounded-chip bg-surface/85 backdrop-blur-md
                           border border-line-strong font-mono text-[12px] font-semibold text-ink tnum"
          >
            {speed}
            <span className="text-ink-4 font-normal"> km/h</span>
          </span>
        )}
      </div>

      <div className="absolute bottom-3 left-3 z-[900] flex items-center gap-2">
        <button onClick={openInMaps} title="Open in Maps" aria-label="Open in Maps" className={ctl}>
          <ExternalLink size={14} />
        </button>
        <button
          onClick={locateMe}
          disabled={locating}
          title="Show my location"
          aria-label="Show my location"
          className={`${ctl} disabled:opacity-50`}
        >
          {locating ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-line-strong border-t-signal animate-spin" />
          ) : (
            <Crosshair size={14} className={userPos ? 'text-signal-text' : ''} />
          )}
        </button>
      </div>

      {frozen && frozenAt && (
        <span
          className="absolute bottom-3 right-3 z-[900] px-2.5 py-1.5 rounded-chip
                         bg-surface/85 backdrop-blur-md border border-line-strong
                         font-mono text-[11px] text-ink-3"
        >
          frozen · {frozenAt}
        </span>
      )}
    </div>
  )
}
