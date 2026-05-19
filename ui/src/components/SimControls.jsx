import { useState } from 'react'
import Card from './Card'

export default function SimControls({ simSpeed, simTimeOfDay, simLuxManual, api }) {
  const [luxManual, setLuxManual] = useState(simLuxManual !== null)
  const [luxVal, setLuxVal] = useState(5000)
  const [jumpHour, setJumpHour] = useState(8)

  const hh = String(Math.floor(simTimeOfDay)).padStart(2, '0')
  const mm = String(Math.floor((simTimeOfDay % 1) * 60)).padStart(2, '0')

  async function handleLuxAuto() {
    setLuxManual(false)
    await api('/sim/lux', { lux: -1 })
  }

  async function handleLuxManual() {
    setLuxManual(true)
    await api('/sim/lux', { lux: luxVal })
  }

  async function handleLuxRelease(v) {
    setLuxVal(v)
    if (luxManual) await api('/sim/lux', { lux: v })
  }

  return (
    <Card title="Simulation Controls">
      {/* Time display */}
      <div className="sim-time">{hh}:{mm}</div>
      <div className="progress-wrap" style={{ marginBottom: 4 }}>
        <div className="progress-fill tod-fill" style={{ width: `${(simTimeOfDay / 24) * 100}%` }} />
      </div>
      <div className="progress-labels" style={{ marginBottom: 16 }}>
        <span>00:00</span><span>12:00</span><span>24:00</span>
      </div>

      {/* Speed */}
      <div className="sim-row">
        <span className="label">Speed</span>
        <input
          type="range" min="1" max="600" defaultValue={simSpeed}
          onMouseUp={(e) => api('/sim/speed', { speed: e.target.value })}
          onTouchEnd={(e) => api('/sim/speed', { speed: e.target.value })}
          style={{ flex: 1 }}
        />
        <span className="sim-speed-label">{simSpeed}×</span>
      </div>

      {/* Jump to hour */}
      <div className="sim-row">
        <span className="label">Jump to hour</span>
        <input
          type="number" min="0" max="23" step="0.5"
          value={jumpHour}
          onChange={(e) => setJumpHour(e.target.value)}
          className="num-input"
        />
        <button className="btn btn--sm" onClick={() => api('/sim/time', { hour: jumpHour })}>Go</button>
      </div>

      <hr className="divider" />

      {/* Lux source toggle */}
      <div className="sim-row sim-row--between" style={{ marginBottom: 10 }}>
        <span className="label">Lux source</span>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <button
            className={!luxManual ? 'btn btn--sm btn--active' : 'btn btn--sm'}
            onClick={handleLuxAuto}
          >Auto cycle</button>
          <button
            className={luxManual ? 'btn btn--sm btn--active btn--blue' : 'btn btn--sm'}
            onClick={handleLuxManual}
          >Manual</button>
        </div>
      </div>

      {/* Lux slider */}
      <div className="sim-row">
        <span className="label">Lux</span>
        <input
          type="range" min="0" max="50000" step="100"
          value={luxVal}
          onChange={(e) => setLuxVal(Number(e.target.value))}
          onMouseUp={(e) => handleLuxRelease(Number(e.target.value))}
          onTouchEnd={(e) => handleLuxRelease(Number(e.target.value))}
          style={{ flex: 1, opacity: luxManual ? 1 : 0.45 }}
          disabled={!luxManual}
        />
        <span className="sim-speed-label" style={{ color: 'var(--accent2)' }}>
          {luxVal.toLocaleString()}
        </span>
      </div>
      <div className="progress-labels">
        <span>0</span><span>25 000</span><span>50 000 lux</span>
      </div>

      <p className="hint">1× = real time · 60× = 24 min/day · 600× = ~2.4 min/day</p>
    </Card>
  )
}
