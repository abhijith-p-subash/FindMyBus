import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiResponse, ApiResult } from '../types'
import { isDemoKey, demoFetch } from '../demo/demoApi'

const DEFAULT_INTERVAL = 30_000

export type DelayTrend = 'improving' | 'worsening' | 'stable' | null

interface Options {
  onCompleted?: (message: string) => void
  onData?: (data: ApiResponse) => void
  refreshInterval?: number
}

export function useBusTracker(key: string, options: Options = {}) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [completedMessage, setCompletedMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(DEFAULT_INTERVAL / 1000)
  const [delayTrend, setDelayTrend] = useState<DelayTrend>(null)
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  /** True when the payload came from the service worker's cache, not the network. */
  const [stale, setStale] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevDelayRef = useRef<number | null>(null)
  const onCompletedRef = useRef(options.onCompleted)
  const onDataRef = useRef(options.onData)
  const refreshIntervalRef = useRef(options.refreshInterval ?? DEFAULT_INTERVAL)

  useEffect(() => {
    onCompletedRef.current = options.onCompleted
  }, [options.onCompleted])
  useEffect(() => {
    onDataRef.current = options.onData
  }, [options.onData])
  useEffect(() => {
    refreshIntervalRef.current = options.refreshInterval ?? DEFAULT_INTERVAL
  }, [options.refreshInterval])

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const startCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    const secs = refreshIntervalRef.current / 1000
    setCountdown(secs)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? refreshIntervalRef.current / 1000 : prev - 1))
    }, 1000)
  }, [])

  const fetchData = useCallback(async () => {
    if (!key) return
    try {
      const res = isDemoKey(key)
        ? await demoFetch()
        : await fetch(`/api/live/eta_map?current_status=true&key=${encodeURIComponent(key)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      // The service worker stamps replays it serves from cache.
      const fromCache = res.headers.get('X-FMB-Cache') === 'hit'
      const json: ApiResult = await res.json()

      if (json.status === 302) {
        setCompleted(true)
        setCompletedMessage(json.message)
        setLoading(false)
        setStale(false)
        clearTimers()
        onCompletedRef.current?.(json.message)
        return
      }

      const apiData = json as ApiResponse

      // Track delay trend across polls
      const currentStop = apiData.eta_map_data.find(s => s.id === apiData.current_sp_id)
      const currentDelay = currentStop?.delay_time ?? null
      if (prevDelayRef.current !== null && currentDelay !== null) {
        const diff = currentDelay - prevDelayRef.current
        setDelayTrend(diff < 0 ? 'improving' : diff > 0 ? 'worsening' : 'stable')
      }
      prevDelayRef.current = currentDelay

      setData(apiData)
      setStale(fromCache)
      // A cached replay is not a fresh reading — keep the old timestamp so the
      // staleness clock in the UI keeps counting up.
      if (!fromCache) setLastUpdated(new Date())
      setError(fromCache ? 'Offline — showing last known position' : null)
      setStartedAt(prev => prev ?? new Date())
      onDataRef.current?.(apiData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
      startCountdown()
    }
  }, [key, clearTimers, startCountdown])

  const refresh = useCallback(() => {
    if (completed) return
    clearTimers()
    setLoading(true)
    fetchData().then(() => {
      intervalRef.current = setInterval(fetchData, refreshIntervalRef.current)
    })
  }, [completed, clearTimers, fetchData])

  useEffect(() => {
    // Every field resets when the tracked key changes. The alternative is remounting
    // the whole subtree on a React key, which would also tear down the Leaflet map.
    setData(null)
    setLoading(true)
    setError(null)
    setCompleted(false)
    setCompletedMessage('')
    setLastUpdated(null)
    setCountdown(refreshIntervalRef.current / 1000)
    setDelayTrend(null)
    setStartedAt(null)
    setStale(false)
    prevDelayRef.current = null
    clearTimers()

    fetchData()
    intervalRef.current = setInterval(fetchData, refreshIntervalRef.current)

    return clearTimers
  }, [key, options.refreshInterval]) // eslint-disable-line react-hooks/exhaustive-deps

  // A returning connection should not wait out the poll interval.
  useEffect(() => {
    const onBack = () => {
      if (!completed) fetchData()
    }
    window.addEventListener('online', onBack)
    return () => window.removeEventListener('online', onBack)
  }, [completed, fetchData])

  return {
    data,
    loading,
    error,
    completed,
    completedMessage,
    lastUpdated,
    countdown,
    refresh,
    delayTrend,
    startedAt,
    stale,
  }
}
