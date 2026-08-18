import { useState, useCallback } from 'react'

export function useMyStop(tripKey: string) {
  const storageKey = `bus-tracker-mystop-${tripKey}`

  const [myStopId, setMyStopIdState] = useState<number | null>(() => {
    const v = localStorage.getItem(storageKey)
    return v !== null ? parseInt(v, 10) : null
  })

  const setMyStop = useCallback(
    (id: number | null) => {
      setMyStopIdState(id)
      if (id === null) localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, String(id))
    },
    [storageKey],
  )

  return { myStopId, setMyStop }
}
