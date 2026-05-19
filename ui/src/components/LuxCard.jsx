import Card from './Card'

export default function LuxCard({ lux }) {
  const pct = Math.min((lux / 50000) * 100, 100)

  const label =
    lux > 10000 ? 'Bright sunny day' :
    lux > 2000  ? 'Overcast'         :
    lux > 200   ? 'Dusk / golden hour' :
                  'Night / dark'

  return (
    <Card title="Outdoor Lux">
      <div className="big-num">
        {Math.round(lux).toLocaleString()}
        <span className="big-num__unit"> lux</span>
      </div>
      <p className="lux-label">{label}</p>
      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-labels">
        <span>0</span><span>25 000</span><span>50 000</span>
      </div>
    </Card>
  )
}
