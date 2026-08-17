/**
 * Sample trip — the "try it before you have a link" path.
 *
 * A simulated bus running Kozhikode → Bengaluru via Wayanad. It advances stop by
 * stop while you watch, so a first-time visitor sees the app actually working
 * rather than a frozen screenshot.
 *
 * Deliberately isolated from real app state:
 *   · nothing is written to the trip list — the Trip object is synthesised per render
 *   · no request reaches /api, so the service worker's cache is untouched
 *   · `lastKnown` updates are dropped rather than persisted
 */

import { ApiResponse, ApiCompleted, Stop, StopColor, Trip } from '../types'

export const DEMO_KEY = 'DEMO'
export const DEMO_NAME = 'Kozhikode → Bengaluru'

/** Faster than a real trip so progress is visible within seconds. */
export const DEMO_REFRESH_MS = 5_000

/** Polls spent between one stop and the next. 4 × 5s ≈ 20s per stop. */
const POLLS_PER_STOP = 4

/** Where the sample bus starts — mid-route, so there is history and future both. */
const START_INDEX = 6

export const isDemoKey = (key: string) => key.toUpperCase() === DEMO_KEY

/** A Trip shaped like the real thing but never persisted. */
export const makeDemoTrip = (): Trip => ({
  key: DEMO_KEY,
  name: DEMO_NAME,
  originalUrl: DEMO_KEY,
  addedAt: new Date().toISOString(),
  lastKnown: null,
})

// ── Route ─────────────────────────────────────────────────────────────────────

interface RouteStop {
  name: string
  /** Minutes from this stop to the next. */
  gap: number
  lat: number
  lng: number
}

const ROUTE: RouteStop[] = [
  { name: 'Kozhikode (Palayam)',  gap: 14, lat: 11.2588, lng: 75.7804 },
  { name: 'Thondayad',            gap: 16, lat: 11.2760, lng: 75.8180 },
  { name: 'Ramanattukara',        gap: 17, lat: 11.1780, lng: 75.8480 },
  { name: 'Kunnamangalam',        gap: 22, lat: 11.3140, lng: 75.8830 },
  { name: 'Thamarassery',         gap: 22, lat: 11.4130, lng: 75.9350 },
  { name: 'Adivaram',             gap: 26, lat: 11.4560, lng: 75.9720 },
  { name: 'Lakkidi',              gap: 22, lat: 11.5089, lng: 76.0247 },
  { name: 'Vythiri',              gap: 22, lat: 11.5540, lng: 76.0430 },
  { name: 'Kalpetta',             gap: 16, lat: 11.6090, lng: 76.0830 },
  { name: 'Meenangadi',           gap: 16, lat: 11.6560, lng: 76.1650 },
  { name: 'Sultan Bathery',       gap: 40, lat: 11.6650, lng: 76.2610 },
  { name: 'Gundlupet',            gap: 43, lat: 11.8100, lng: 76.6900 },
  { name: 'Nanjangud',            gap: 40, lat: 12.1180, lng: 76.6830 },
  { name: 'Mysuru',               gap: 25, lat: 12.2958, lng: 76.6394 },
  { name: 'Srirangapatna',        gap: 25, lat: 12.4180, lng: 76.6840 },
  { name: 'Mandya',               gap: 25, lat: 12.5220, lng: 76.8950 },
  { name: 'Maddur',               gap: 25, lat: 12.5860, lng: 77.0450 },
  { name: 'Channapatna',          gap: 20, lat: 12.6520, lng: 77.2060 },
  { name: 'Ramanagara',           gap: 20, lat: 12.7210, lng: 77.2800 },
  { name: 'Bidadi',               gap: 45, lat: 12.7980, lng: 77.3860 },
  { name: 'Bengaluru (Majestic)', gap: 0,  lat: 12.9767, lng: 77.5713 },
]

const LAST_INDEX = ROUTE.length - 1

/** Wanders between roughly 6 and 17 minutes so the delay trend has something to report. */
const delayAt = (index: number) => 8 + ((index * 7) % 10)

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

const clock = (minutesFromNow: number) => hhmm(new Date(Date.now() + minutesFromNow * 60_000))

/** Signed minutes from now to `index`, walking the gap list out from `current`. */
function offsetTo(index: number, current: number, segmentProgress: number): number {
  if (index === current) return -2 // the bus pulled out of here two minutes ago

  if (index > current) {
    let mins = ROUTE[current].gap * (1 - segmentProgress)
    for (let i = current + 1; i < index; i++) mins += ROUTE[i].gap
    return Math.round(mins)
  }

  let mins = 0
  for (let i = index; i < current; i++) mins += ROUTE[i].gap
  return -Math.round(mins) - 2
}

function buildStops(current: number, segmentProgress: number): Stop[] {
  return ROUTE.map((entry, i) => {
    const isPast = i < current
    const isCurrent = i === current
    const delay = delayAt(i)
    const offset = offsetTo(i, current, segmentProgress)

    const expected = clock(offset)
    const scheduled = clock(offset - delay)

    const color: StopColor = isPast || isCurrent
      ? (delay > 0 ? 'color_yellow' : 'color_green')
      : 'color_gray'

    return {
      geofence_name: entry.name,
      id: 1000 + i,
      scheduled_time: scheduled,
      service_place_name: entry.name,
      color,
      delay_time: delay,
      expected_time: expected,
      skipped: false,
      running_status: isCurrent ? `Running ${delay} min late` : null,
      is_pick_up: i === 0 ? 1 : 0,
      arrival_time: isPast || isCurrent ? expected : '',
      departure_time: isPast || isCurrent ? expected : '',
    }
  })
}

// ── Simulation state ──────────────────────────────────────────────────────────

let pollCount = 0

/** Called on entry so the sample trip always begins from the same place. */
export function resetDemo() {
  pollCount = 0
}

const COMPLETED: ApiCompleted = {
  status: 302,
  message: 'reached Bengaluru (Majestic) and completed its trip.',
}

function buildResponse(current: number, segmentProgress: number): ApiResponse {
  const stops = buildStops(current, segmentProgress)
  const here = ROUTE[current]
  const next = ROUTE[Math.min(current + 1, LAST_INDEX)]

  // Slide the marker along the segment so the bus visibly moves between stops.
  const lat = here.lat + (next.lat - here.lat) * segmentProgress
  const lng = here.lng + (next.lng - here.lng) * segmentProgress

  return {
    status: 200,
    eta_map_data: stops,
    current_sp_id: 1000 + current,
    is_passed: false,
    current_status_details: {
      lat_long: [lat, lng],
      details: {
        speed: 34 + ((current * 5 + Math.round(segmentProgress * 10)) % 22),
        timestamp: new Date().toLocaleString('en-IN'),
        location: segmentProgress < 0.35 ? `Near ${here.name}` : `${here.name} → ${next.name}`,
        astl_id: 84213,
        class_name: 'AC Sleeper',
      },
    },
    last_dropoff_id: 1000 + LAST_INDEX,
    last_boarding_id: 1000,
  }
}

/**
 * Stands in for `fetch()` on the live endpoint, returning real `Response`
 * objects so `useBusTracker` needs no branching beyond which function it calls.
 */
export async function demoFetch(): Promise<Response> {
  await new Promise(r => setTimeout(r, 380)) // let the loading skeleton register

  const advanced = Math.floor(pollCount / POLLS_PER_STOP)
  const current = START_INDEX + advanced
  const segmentProgress = (pollCount % POLLS_PER_STOP) / POLLS_PER_STOP
  pollCount += 1

  const body = current >= LAST_INDEX
    ? JSON.stringify(COMPLETED)
    : JSON.stringify(buildResponse(current, segmentProgress))

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
