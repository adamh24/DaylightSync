import Card from './Card'
import { useEffect, useRef, useState } from 'react'

const ZONE_LABELS = {
  bar_counter: 'Bar Counter',
  seating: 'Seating',
  accent: 'Accent',
  window: 'Window',
  entry: 'Entry',
  back_wall: 'Back Wall',
}

export default function ZonesCard({ zones, api, fullWidth }) {
  const [localBrightness, setLocalBrightness] = useState({})
  const [pendingBrightness, setPendingBrightness] = useState({})
  const [draggingZone, setDraggingZone] = useState(null)
  const debounceRef = useRef({})
  const pendingClearRef = useRef({})

  useEffect(() => {
    setLocalBrightness((prev) => {
      const next = { ...prev }
      for (const [name, zone] of Object.entries(zones)) {
        const isObject = typeof zone === 'object' && zone !== null
        const brightness = isObject ? Number(zone.brightness ?? 0) : 0
        if (draggingZone !== name) {
          next[name] = pendingBrightness[name] ?? brightness
        }
      }
      return next
    })

    setPendingBrightness((prev) => {
      const next = { ...prev }
      let changed = false

      for (const [name, zone] of Object.entries(zones)) {
        if (next[name] == null) continue
        const isObject = typeof zone === 'object' && zone !== null
        const serverBrightness = isObject ? Number(zone.brightness ?? 0) : 0

        if (serverBrightness === next[name]) {
          delete next[name]
          changed = true

          if (pendingClearRef.current[name]) {
            clearTimeout(pendingClearRef.current[name])
            delete pendingClearRef.current[name]
          }
        }
      }

      return changed ? next : prev
    })
  }, [zones, draggingZone, pendingBrightness])

  useEffect(() => {
    return () => {
      for (const timerId of Object.values(debounceRef.current)) {
        clearTimeout(timerId)
      }
      for (const timerId of Object.values(pendingClearRef.current)) {
        clearTimeout(timerId)
      }
    }
  }, [])

  async function toggle(name, enabled) {
    await api(`/zone/${name}`, { enabled })
  }

  async function setZoneBrightness(name, brightness) {
    await api(`/zone/${name}/brightness`, { brightness })
  }

  function handleSliderChange(name, value) {
    setLocalBrightness((prev) => ({ ...prev, [name]: value }))

    if (debounceRef.current[name]) {
      clearTimeout(debounceRef.current[name])
    }

    debounceRef.current[name] = setTimeout(() => {
      setZoneBrightness(name, value)
    }, 100)
  }

  function handleSliderStart(name) {
    setDraggingZone(name)
  }

  function handleSliderEnd(name, value) {
    setDraggingZone(null)
    setLocalBrightness((prev) => ({ ...prev, [name]: value }))
    setPendingBrightness((prev) => ({ ...prev, [name]: value }))

    if (pendingClearRef.current[name]) {
      clearTimeout(pendingClearRef.current[name])
    }
    pendingClearRef.current[name] = setTimeout(() => {
      setPendingBrightness((prev) => {
        if (prev[name] == null) return prev
        const next = { ...prev }
        delete next[name]
        return next
      })
      delete pendingClearRef.current[name]
    }, 1200)

    if (debounceRef.current[name]) {
      clearTimeout(debounceRef.current[name])
    }
    setZoneBrightness(name, value)
  }

  return (
    <Card title="Lighting Zones" fullWidth={fullWidth}>
      <div className="zone-deck">
        {Object.entries(zones).map(([name, zone]) => {
          const isObject = typeof zone === 'object' && zone !== null
          const zoneConnected = isObject ? Boolean(zone.connected ?? true) : true
          const enabled = isObject ? Boolean(zone.enabled) : Boolean(zone)
          const serverBrightness = isObject ? Number(zone.brightness ?? 0) : 0
          const brightness = localBrightness[name] ?? pendingBrightness[name] ?? serverBrightness
          const zoneIsActive = zoneConnected && enabled && brightness > 0
          const zoneStatusClass = !zoneConnected
            ? 'zone-activity-dot--offline'
            : zoneIsActive
              ? 'zone-activity-dot--active'
              : 'zone-activity-dot--inactive'
          const zoneStatusLabel = !zoneConnected
            ? 'Zone disconnected'
            : zoneIsActive
              ? 'Zone active'
              : 'Zone inactive'

          return (
            <div key={name} className="zone-strip">
              <span
                className={`zone-activity-dot ${zoneStatusClass}`}
                title={zoneStatusLabel}
                aria-label={zoneStatusLabel}
              />
              <span className="zone-strip__name">{ZONE_LABELS[name] ?? name}</span>
              <div className="zone-strip__slider-wrap">
                <input
                  className="zone-strip__slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={brightness}
                  disabled={!enabled}
                  onPointerDown={() => handleSliderStart(name)}
                  onTouchStart={() => handleSliderStart(name)}
                  onMouseDown={() => handleSliderStart(name)}
                  onFocus={() => handleSliderStart(name)}
                  onChange={(e) => handleSliderChange(name, Number(e.target.value))}
                  onPointerUp={(e) => handleSliderEnd(name, Number(e.currentTarget.value))}
                  onTouchEnd={(e) => handleSliderEnd(name, Number(e.currentTarget.value))}
                  onMouseUp={(e) => handleSliderEnd(name, Number(e.currentTarget.value))}
                  onBlur={(e) => handleSliderEnd(name, Number(e.currentTarget.value))}
                />
              </div>
              <span className="zone-strip__value">{brightness}%</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggle(name, e.target.checked)}
                />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
