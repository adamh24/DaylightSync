import { useState, useEffect, useRef, useCallback } from 'react'

const INITIAL = {
  lux: 0,
  brightness: 50,
  mode: 'auto',
  zones: { bar_counter: true, seating: true, accent: true },
  sim_speed: 60,
  sim_time_of_day: 8,
  sim_lux_manual: null,
  log: [],
}

export function useSimState() {
  const [state, setState] = useState(INITIAL)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const retryRef = useRef(null)

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(`ws://${location.host}/ws`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)

      ws.onmessage = (e) => {
        try { setState(JSON.parse(e.data)) } catch {}
      }

      ws.onclose = () => {
        setConnected(false)
        retryRef.current = setTimeout(connect, 2000)
      }
    }

    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [])

  const api = useCallback(async (path, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString()
    await fetch(`${path}${qs ? '?' + qs : ''}`, { method: 'POST' })
  }, [])

  return { state, connected, api }
}
