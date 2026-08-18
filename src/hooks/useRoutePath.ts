import { useCallback, useEffect, useRef } from 'react'
import { LatLng, distanceM } from '../utils'

const KEY = (tripKey: string) => `bus-tracker-path-v1-${tripKey}`

/** Points closer together than this add nothing but bytes. */
const MIN_SPACING_M = 20

/** ~1500 points at 20 m spacing covers roughly 30 km of distinct road. */
const MAX_POINTS = 1500

/** 5 decimal places is about 1.1 m — far finer than the source data. */
const round = (n: number) => Math.round(n * 1e5) / 1e5

/**
 * Remembers where the bus has actually been, per trip.
 *
 * The upstream gives no stop coordinates and no route shape, so the road's
 * geometry can only be learned by observation. Breadcrumbs accumulate across
 * journeys under the same trip key; once a corridor is known, the map can move
 * the marker *along the road* between two fixes instead of straight across the
 * bend between them.
 *
 * Entirely local: this is vehicle position, never the user's, and it never
 * leaves the device. See doc/PROPOSALS.md §0.
 */
export function useRoutePath(tripKey: string) {
  const pathRef = useRef<LatLng[]>([])
  const dirtyRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(tripKey))
      pathRef.current = raw ? (JSON.parse(raw) as LatLng[]) : []
    } catch {
      pathRef.current = []
    }
  }, [tripKey])

  const persist = useCallback(() => {
    if (!dirtyRef.current) return
    dirtyRef.current = false
    try {
      localStorage.setItem(KEY(tripKey), JSON.stringify(pathRef.current))
    } catch {
      // Storage full or unavailable — the corridor is an optimisation, not data
      // worth failing a render over.
    }
  }, [tripKey])

  const record = useCallback((pos: LatLng) => {
    const path = pathRef.current
    const last = path[path.length - 1]
    if (last && distanceM(last, pos) < MIN_SPACING_M) return

    path.push([round(pos[0]), round(pos[1])])
    if (path.length > MAX_POINTS) path.shift()
    dirtyRef.current = true
  }, [])

  // Batch the writes rather than serialising the whole corridor on every fix.
  useEffect(() => {
    const id = setInterval(persist, 30_000)
    document.addEventListener('visibilitychange', persist)
    window.addEventListener('pagehide', persist)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', persist)
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [persist])

  return { pathRef, record }
}
