import { useEffect, useRef, useState } from 'react'
import { Crosshair, ExternalLink } from 'lucide-react'
import {
  bearingDeg,
  distanceM,
  nearestIndex,
  pathLengths,
  shortestTurn,
  walkPath,
  LatLng,
} from '../utils'

interface MapPanelProps {
  lat: number
  lng: number
  speed: number
  location: string
  /** Data is stale — desaturate the tiles and freeze the marker pulse. */
  frozen?: boolean
  /** Clock label shown on the frozen chip. */
  frozenAt?: string
  /** Learned route corridor, if one has been observed. See useRoutePath. */
  routePathRef?: React.RefObject<LatLng[]>
  /** `bleed` sits behind the header on phones; `panel` is a bordered card. */
  variant?: 'bleed' | 'panel'
  className?: string
}

let L: typeof import('leaflet') | null = null

/**
 * Ease a number toward a new value instead of snapping to it.
 *
 * Readings arrive once every 30 s, so a raw swap reads as a glitch. Sweeping
 * between them reads like a needle — the point is liveness, not decoration, so
 * it is short and it honours prefers-reduced-motion.
 */
function useTweenedNumber(value: number, ms = 600): number {
  // Read once via lazy state: derive the reduced-motion path rather than writing
  // state for it, so the effect never calls setState synchronously.
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef(0)

  useEffect(() => {
    if (reduced) return
    fromRef.current = shown
    startRef.current = performance.now()
    let raf = 0
    const tick = () => {
      const p = Math.min((performance.now() - startRef.current) / ms, 1)
      const eased = 1 - (1 - p) ** 3
      setShown(fromRef.current + (value - fromRef.current) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // `shown` is read as the start point only; depending on it would restart the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ms, reduced])

  return reduced ? value : shown
}

const busIconHtml = (frozen: boolean) => `
  <div style="position:relative;width:40px;height:40px">
    ${frozen ? '' : `<span style="position:absolute;inset:0;border-radius:50%;background:var(--fmb-signal);opacity:.35" class="pulse-ring"></span>`}
    <span style="position:absolute;left:8px;top:8px;width:24px;height:24px;border-radius:50%;
                 background:${frozen ? 'var(--fmb-ink-3)' : 'var(--fmb-signal)'};
                 border:3px solid var(--fmb-bg);display:flex;align-items:center;justify-content:center">
      <svg data-arrow width="12" height="12" viewBox="0 0 64 64" aria-hidden="true" style="transition:transform 120ms linear">
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
  routePathRef,
  variant = 'panel',
  className = '',
}: MapPanelProps) {
  const shownSpeed = useTweenedNumber(speed)
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

  // ── Motion ────────────────────────────────────────────────────────────────
  //
  // The upstream reports once every 30 s, which at 30 km/h is ~275 m of travel.
  // Driven straight from props the marker teleports twice a minute, so instead we
  // carry it forward along its last known heading and let each new fix correct it.
  //
  // Everything here is deliberately outside React: the loop runs at animation
  // frame rate and must never trigger a render, or the whole timeline re-renders
  // sixty times a second. See doc/PROPOSALS.md §3.
  /**
   * The last few observed positions.
   *
   * The marker no longer extrapolates past the newest fix. It replays the
   * segment *between* the two most recent ones, so it is always somewhere the
   * bus provably was. Guessing ahead is what put it on the wrong road: any error
   * in heading or speed placed it in territory the bus had never entered.
   *
   * The cost is that the marker trails reality by about one poll interval. For
   * "where is my bus" that is a good trade, and the payload is already stale by
   * an unknown amount anyway — see `details.timestamp`.
   */
  const historyRef = useRef<{ pos: LatLng; at: number }[]>([])
  const shownRef = useRef<LatLng | null>(null)
  const headingRef = useRef(0)
  /** The stretch of learned road joining the last two fixes, if we know it. */
  const legRef = useRef<{ pts: LatLng[]; cum: number[] } | null>(null)

  useEffect(() => {
    const pos: LatLng = [lat, lng]
    const hist = historyRef.current
    const prev = hist[hist.length - 1]

    // Ignore a repeated fix: it carries no new information and would collapse
    // the segment to a point, freezing the marker.
    if (prev && distanceM(prev.pos, pos) < 1) return

    hist.push({ pos, at: performance.now() })
    if (hist.length > 4) hist.shift()

    if (!shownRef.current) shownRef.current = pos

    // Look up the road between the previous fix and this one. Done here, once
    // every 30 s, because the search is linear over the whole corridor and has
    // no business running inside the animation loop.
    legRef.current = null
    const road = routePathRef?.current
    if (prev && road && road.length > 10) {
      const i = nearestIndex(road, prev.pos)
      const j = nearestIndex(road, pos)
      if (j > i + 1) {
        const pts = road.slice(i, j + 1)
        const { cum, total } = pathLengths(pts)
        const chord = distanceM(prev.pos, pos)
        // Trust the corridor only when its length is plausible for this leg.
        // A much longer match means we latched onto the return journey or an
        // unrelated pass through the same area; a much shorter one is noise.
        if (total > chord * 0.9 && total < chord * 2.5) legRef.current = { pts, cum }
      }
    }

    mapRef.current?.panTo(pos, { animate: true, duration: 0.8 })
  }, [lat, lng, routePathRef])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const marker = markerRef.current
      if (!marker || historyRef.current.length === 0) return

      // Replay the most recent observed segment rather than projecting beyond it.
      const hist = historyRef.current
      const b = hist[hist.length - 1]
      const a = hist[hist.length - 2]

      let target: LatLng
      if (frozen || reduced || !a) {
        target = b.pos
      } else {
        // Traverse a → b over the interval that produced it, so the marker moves
        // at the speed the bus actually moved. Clamped at 1: once the segment is
        // consumed the marker waits at b for the next fix instead of inventing.
        const span = Math.max(b.at - a.at, 1000)
        const u = Math.min((performance.now() - b.at) / span, 1)

        const leg = legRef.current
        if (leg) {
          // Follow the road we have actually watched the bus take.
          target = walkPath(leg.pts, leg.cum, u)
        } else {
          // Nothing learned for this stretch yet. A straight chord cuts bends,
          // but it is bounded at both ends by somewhere the bus provably was —
          // which guessing ahead never is. A curve fitted from the incoming
          // heading was tried and measured up to 125 m worse on a bend where the
          // turn had already completed, so it is deliberately not used.
          target = [a.pos[0] + (b.pos[0] - a.pos[0]) * u, a.pos[1] + (b.pos[1] - a.pos[1]) * u]
        }

        // Point the arrow along the leg, once it is long enough to mean something.
        if (distanceM(a.pos, b.pos) > 15) headingRef.current = bearingDeg(a.pos, b.pos)
      }

      const shown = shownRef.current ?? target
      const gap = distanceM(shown, target)
      if (gap < 0.4) return

      // Exponential smoothing handles both jobs at once: it eases onto a
      // corrected fix and trails the extrapolation without any state machine.
      // A large gap means a glitch or a long stall — snap rather than glide.
      const next: LatLng =
        gap > 2000
          ? target
          : [shown[0] + (target[0] - shown[0]) * 0.12, shown[1] + (target[1] - shown[1]) * 0.12]

      shownRef.current = next
      marker.setLatLng(next)

      const arrow = marker.getElement()?.querySelector<HTMLElement>('[data-arrow]')
      if (arrow) {
        const current = Number(arrow.dataset.deg ?? 0)
        const turned = current + shortestTurn(current, headingRef.current) * 0.2
        arrow.dataset.deg = String(turned)
        arrow.style.transform = `rotate(${turned}deg)`
      }
    }

    // No point animating a screen nobody is looking at.
    const onVisibility = () => {
      cancelAnimationFrame(raf)
      if (document.visibilityState === 'visible') raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [frozen])

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
          className="max-w-[68%] px-2.5 py-1.5 rounded-chip bg-surface/85 backdrop-blur-md
                     border border-line-strong text-[12px] leading-snug text-ink-2
                     line-clamp-2 text-left"
          title={location}
        >
          {location}
        </span>
        {!frozen && (
          <span
            className="shrink-0 px-2.5 py-1.5 rounded-chip bg-surface/85 backdrop-blur-md
                           border border-line-strong font-mono text-[12px] font-semibold text-ink tnum"
          >
            {Math.round(shownSpeed)}
            <span className="text-ink-4 font-normal"> km/h</span>
          </span>
        )}
      </div>

      <div className="absolute bottom-12 lg:bottom-3 left-3 z-[900] flex items-center gap-2">
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
          className="absolute bottom-12 lg:bottom-3 right-3 z-[900] px-2.5 py-1.5 rounded-chip
                         bg-surface/85 backdrop-blur-md border border-line-strong
                         font-mono text-[11px] text-ink-3"
        >
          frozen · {frozenAt}
        </span>
      )}
    </div>
  )
}
