import { Stop, ApiResponse, TripLastKnown, TripStatus, Trip } from './types'

// ─── URL / Key parsing ────────────────────────────────────────────────────────
//
// Codes in examples throughout this repo (AB1234, CD5678) are illustrative and
// resolve to nothing. Never commit a real tracking code: it is a live handle on
// a real vehicle, and publishing one hands anyone the ability to follow it.

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

/**
 * The upstream sends 12-hour clock times with a meridiem: "04:45 PM".
 *
 * Dropping the "PM" is not cosmetic — it makes 4:45 PM indistinguishable from
 * 4:45 AM, and it silently broke every countdown in the app by twelve hours.
 * Parse it, keep it, and render it compactly.
 */
const CLOCK = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp])?\.?[Mm]?\.?/

/** "04:45 PM" → "4:45 pm" · "09:47" → "9:47". '' for anything unparseable. */
export function formatClock(timeStr: string): string {
  if (!timeStr) return ''
  const m = timeStr.match(CLOCK)
  if (!m) return timeStr.trim()
  const hour = parseInt(m[1], 10)
  const meridiem = m[3] ? (m[3].toLowerCase() === 'p' ? ' pm' : ' am') : ''
  return `${hour}:${m[2]}${meridiem}`
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

/**
 * The tracker stamps its own fix time as "Aug 18 17:06:54" — no year, 24-hour.
 *
 * This is the age of the *vehicle's* reading, which is not the same as how long
 * ago we polled. A position can be five minutes old the instant we fetch it, and
 * the user deserves to know that rather than trusting our own poll countdown.
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function parseTrackerTimestamp(stamp: string): Date | null {
  const m = stamp?.match(/^([A-Za-z]{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  const month = MONTHS.indexOf(m[1].toLowerCase())
  if (month === -1) return null

  const now = new Date()
  const d = new Date(
    now.getFullYear(),
    month,
    parseInt(m[2], 10),
    parseInt(m[3], 10),
    parseInt(m[4], 10),
    parseInt(m[5] ?? '0', 10),
  )
  // No year in the payload: a fix dated far in the future is last year's.
  if (d.getTime() - now.getTime() > 7 * 24 * 60 * 60 * 1000) d.setFullYear(now.getFullYear() - 1)
  return d
}

/** "just now" / "40s ago" / "6m ago" — how old the vehicle's own reading is. */
export function fixAge(stamp: string): string | null {
  const at = parseTrackerTimestamp(stamp)
  if (!at) return null
  const secs = Math.round((Date.now() - at.getTime()) / 1000)
  if (secs < 0) return 'just now'
  if (secs < 45) return `${secs}s ago`
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.round(mins / 60)}h ago`
}

/** Short elapsed form for the offline banner: "2m 40s", "48s". */
export function elapsedShort(from: Date): string {
  const secs = Math.max(0, Math.floor((Date.now() - from.getTime()) / 1000))
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a clock time onto today's date, honouring the AM/PM marker, and roll to
 * tomorrow when it is already more than 4 hours past — overnight services would
 * otherwise report large negative countdowns.
 */
export function parseTimeToday(timeStr: string): Date | null {
  if (!timeStr) return null
  const m = timeStr.match(CLOCK)
  if (!m) return null

  let hour = parseInt(m[1], 10)
  const meridiem = m[3]?.toLowerCase()
  if (meridiem === 'p' && hour < 12) hour += 12
  if (meridiem === 'a' && hour === 12) hour = 0

  const d = new Date()
  d.setHours(hour, parseInt(m[2], 10), 0, 0)
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
