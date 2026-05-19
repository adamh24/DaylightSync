import Card from './Card'

export default function ActivityLog({ log }) {
  return (
    <Card title="Activity Log" fullWidth>
      <div className="log-list">
        {log.length === 0
          ? <div className="log-empty">Waiting for server…</div>
          : [...log].reverse().map((line, i) => (
            <div key={i} className="log-entry">{line}</div>
          ))
        }
      </div>
    </Card>
  )
}
