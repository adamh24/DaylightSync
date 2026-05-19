import Card from './Card'

const ZONE_LABELS = {
  bar_counter: 'Bar Counter',
  seating: 'Seating',
  accent: 'Accent',
}

export default function ZonesCard({ zones, api, fullWidth }) {
  async function toggle(name, enabled) {
    await api(`/zone/${name}`, { enabled })
  }

  return (
    <Card title="Lighting Zones" fullWidth={fullWidth}>
      <div className="zone-list">
        {Object.entries(zones).map(([name, on]) => (
          <div key={name} className="zone-row">
            <span className="zone-name">{ZONE_LABELS[name] ?? name}</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => toggle(name, e.target.checked)}
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>
        ))}
      </div>
    </Card>
  )
}
