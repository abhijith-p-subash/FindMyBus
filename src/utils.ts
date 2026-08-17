import { Stop, ApiResponse, TripLastKnown, TripStatus, Trip } from './types'

// ─── URL / Key parsing ────────────────────────────────────────────────────────

export function parseTrackingKey(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let url: URL | null = null
  try {
    url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`)
  } catch {
    // not a URL — try as plain key
  }

  if (url) {
    // https://bus.trackingo.in/customer/track_vehicle?AB1234
    if (url.hostname.includes('trackingo.in')) {
      const search = url.search.slice(1) // drop leading '?'
      if (search && !search.includes('=')) return search.toUpperCase()
      const keyed = url.searchParams.get('key')
      if (keyed) return keyed.toUpperCase()
      return null
    }

    // http://trkg.in/OPERATOR/CD5678  (last path segment is the key)
    if (url.hostname.includes('trkg.in')) {
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts.length > 0) return parts[parts.length - 1].toUpperCase()
      return null
    }

    return null // unknown host
  }

  // Plain key: 4–10 alphanumeric chars
  if (/^[A-Z0-9]{4,10}$/i.test(trimmed)) return trimmed.toUpperCase()

  return null
}

// ─── Stop deduplication ───────────────────────────────────────────────────────

export function dedupeStops(stops: Stop[], currentId?: number): Stop[] {
  const seen = new Map<string, Stop>()
  for (const stop of stops) {
    const key = stop.service_place_name.trim().toLowerCase()
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, stop)
    } else {
      const keepNew =
        stop.id === currentId || // always keep the current stop
        (stop.arrival_time && !existing.arrival_time && existing.id !== currentId)
      if (keepNew) seen.set(key, stop)
    }
  }
  return Array.from(seen.values())
}

// ─── Route helpers ────────────────────────────────────────────────────────────

const cleanName = (s: string) => s.replace(/\s*[([][^)\]]*[)\]]\s*$/, '').trim()

export const stopName = (stop: Stop | null | undefined) =>
  stop ? cleanName(stop.service_place_name) : ''

export function computeProgress(data: ApiResponse): number {
  const stops = dedupeStops(data.eta_map_data, data.current_sp_id)
  const idx = stops.findIndex(s => s.id === data.current_sp_id)
  if (idx === -1 || stops.length <= 1) return 0
  return Math.round((idx / (stops.length - 1)) * 100)
}

/** The next stop the bus has not reached yet, skipping stops it will not serve. */
export function findNextStop(data: ApiResponse): Stop | null {
  const stops = dedupeStops(data.eta_map_data, data.current_sp_id)
  const idx = stops.findIndex(s => s.id === data.current_sp_id)
  if (idx === -1) return null
  return stops.find((s, i) => i > idx && !s.skipped) ?? null
}

export function computeLastKnown(data: ApiResponse): TripLastKnown {
  const stops = dedupeStops(data.eta_map_data, data.current_sp_id)
  const currentStop = data.eta_map_data.find(s => s.id === data.current_sp_id)
  const idx = stops.findIndex(s => s.id === data.current_sp_id)
  const next = findNextStop(data)

  return {
    at: new Date().toISOString(),
    currentStop: stopName(currentStop),
    firstStop: stopName(stops[0]),
    lastStop: stopName(stops[stops.length - 1]),
    delay: currentStop?.delay_time ?? null,
    progress: computeProgress(data),
    stopIndex: idx === -1 ? 0 : idx + 1,
    stopCount: stops.length,
    nextStop: stopName(next),
    nextEta: next
      ? formatClock(next.expected_time || next.arrival_time || next.scheduled_time)
      : '',
  }
}

// ─── Stop status ──────────────────────────────────────────────────────────────

export type StopStatus = 'ontime' | 'delayed' | 'skipped' | 'upcoming'

export function getStopStatus(color: Stop['color'], skipped: boolean): StopStatus {
  if (skipped) return 'skipped'
  switch (color) {
    case 'color_green':
      return 'ontime'
    case 'color_yellow':
      return 'delayed'
    default:
      return 'upcoming'
  }
}

/** Liveness of a saved trip, driving the status dot on the trip list. */
export function tripStatus(trip: Trip): TripStatus {
  const lk = trip.lastKnown
  if (!lk) return 'new'
  const ageMins = (Date.now() - new Date(lk.at).getTime()) / 60_000
  if (ageMins > 20) return 'idle'
  if (lk.delay !== null && lk.delay > 0) return 'live'
  return 'ontime'
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/** "09:47:00" / "09:47" → "9:47". Returns '' for anything unparseable. */
export function formatClock(timeStr: string): string {
  if (!timeStr) return ''
  const m = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return timeStr.trim()
  return `${parseInt(m[1], 10)}:${m[2]}`
}

export function formatLastUpdated(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/** Short elapsed form for the offline banner: "2m 40s", "48s". */
export function elapsedShort(from: Date): string {
  const secs = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000))
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Parse "HH:MM" into a Date set to today (or tomorrow if the time has passed by >4 h). */
export function parseTimeToday(timeStr: string): Date | null {
  if (!timeStr) return null
  const m = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const d = new Date()
  d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0)
  if (d.getTime() < Date.now() - 4 * 60 * 60 * 1000) d.setDate(d.getDate() + 1)
  return d
}

/** Whole minutes from now until a "HH:MM" clock time. Negative if already past. */
export function minutesUntil(timeStr: string): number | null {
  const d = parseTimeToday(timeStr)
  if (!d) return null
  return Math.round((d.getTime() - Date.now()) / 60_000)
}

/** "1h 12m" — spaced, for prose. */
export function formatDuration(totalMinutes: number): string {
  const abs = Math.abs(Math.round(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

/** "1h12" — compact, for large data figures. */
export function formatDurationTight(totalMinutes: number): string {
  const abs = Math.abs(Math.round(totalMinutes))
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m}m`
}
