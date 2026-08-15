import { useState, useCallback } from 'react'
import { Trip, TripLastKnown } from '../types'
import { parseTrackingKey } from '../utils'

const STORAGE_KEY = 'bus-tracker-trips-v1'

function load(): Trip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const trips: Trip[] = raw ? (JSON.parse(raw) as Trip[]) : []

    // Deep-link cold-start: if URL is /track/:key and the key isn't saved yet, add it now
    // so the very first render already has the trip — no blank screen, no effect needed.
    const match = window.location.pathname.match(/^\/track\/([A-Za-z0-9]{4,10})$/)
    if (match) {
      const key = match[1].toUpperCase()
      if (!trips.find(t => t.key === key)) {
        const trip: Trip = {
          key,
          name: key,
          originalUrl: key,
          addedAt: new Date().toISOString(),
          lastKnown: null,
        }
        const next = [trip, ...trips]
        persist(next)
        return next
      }
    }

    return trips
  } catch {
    return []
  }
}

function persist(trips: Trip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {}
}

export interface AddTripResult {
  success: boolean
  trip?: Trip
  error?: string
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(load)

  const addTrip = useCallback((rawInput: string, name: string): AddTripResult => {
    const key = parseTrackingKey(rawInput)
    if (!key) return { success: false, error: 'Invalid URL or tracking code' }

    // Check duplicate
    const existing = trips.find(t => t.key === key)
    if (existing) return { success: false, error: `Already tracking ${key}` }

    const trip: Trip = {
      key,
      name: name.trim() || key,
      originalUrl: rawInput.trim(),
      addedAt: new Date().toISOString(),
      lastKnown: null,
    }

    setTrips(prev => {
      const next = [trip, ...prev]
      persist(next)
      return next
    })

    return { success: true, trip }
  }, [trips])

  const removeTrip = useCallback((key: string) => {
    setTrips(prev => {
      const next = prev.filter(t => t.key !== key)
      persist(next)
      return next
    })
  }, [])

  const updateLastKnown = useCallback((key: string, lastKnown: TripLastKnown) => {
    setTrips(prev => {
      const next = prev.map(t => {
        if (t.key !== key) return t
        // Auto-name: if user left the name blank (defaults to key), derive it from the route
        const autoName =
          t.name === key && lastKnown.firstStop && lastKnown.lastStop
            ? `${lastKnown.firstStop} → ${lastKnown.lastStop}`
            : t.name
        return { ...t, name: autoName, lastKnown }
      })
      persist(next)
      return next
    })
  }, [])

  return { trips, addTrip, removeTrip, updateLastKnown }
}
