import { useState } from 'react'
import Card from './Card'

export default function ModeCard({ mode, brightness, api }) {
  const [sliderVal, setSliderVal] = useState(brightness)

  async function handleSetAuto() {
    await api('/auto')
  }

  async function handleManual() {
    await api('/override', { brightness: sliderVal })
  }

  async function handleSliderRelease(v) {
    setSliderVal(v)
    if (mode === 'manual') await api('/override', { brightness: v })
  }

  return (
    <Card title="Mode">
      <div className={`mode-badge mode-badge--${mode}`}>{mode}</div>

      <div className="btn-row">
        <button
          className={mode === 'auto' ? 'btn btn--active' : 'btn'}
          onClick={handleSetAuto}
        >Auto</button>
        <button
          className={mode === 'manual' ? 'btn btn--active btn--blue' : 'btn'}
          onClick={handleManual}
        >Manual</button>
      </div>

      <div className="slider-section">
        <div className="slider-header">
          <span className="label">Manual brightness</span>
          <span className="slider-val">{sliderVal}%</span>
        </div>
        <input
          type="range" min="1" max="100"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          onMouseUp={(e) => handleSliderRelease(Number(e.target.value))}
          onTouchEnd={(e) => handleSliderRelease(Number(e.target.value))}
        />
        <div className="progress-labels"><span>1%</span><span>100%</span></div>
      </div>
    </Card>
  )
}
