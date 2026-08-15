import { useState, useCallback } from 'react'

const KEY = 'bus-tracker-data-saver'
export const LIVE_INTERVAL = 30_000
export const ECO_INTERVAL  = 60_000

export function useDataSaver() {
  const [dataSaver, setDataSaverState] = useState(() =>
    localStorage.getItem(KEY) === 'true'
  )

  const toggleDataSaver = useCallback(() => {
    setDataSaverState(prev => {
      const next = !prev
      localStorage.setItem(KEY, String(next))
      return next
    })
  }, [])

  return {
    dataSaver,
    toggleDataSaver,
    refreshInterval: dataSaver ? ECO_INTERVAL : LIVE_INTERVAL,
  }
}
