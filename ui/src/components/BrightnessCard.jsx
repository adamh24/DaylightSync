import Card from './Card'

const R = 70
const CX = 80
const CY = 90
const ARC_LEN = Math.PI * R   // half-circle circumference ≈ 219.9

function arcColor(pct) {
  if (pct < 35) return 'hsl(210, 80%, 60%)'
  if (pct < 65) return 'hsl(40, 90%, 60%)'
  return 'hsl(50, 100%, 72%)'
}

export default function BrightnessCard({ brightness }) {
  const filled = (brightness / 100) * ARC_LEN

  return (
    <Card title="Indoor Brightness">
      <div className="arc-wrap">
        <svg width="160" height="105" viewBox="0 0 160 105" overflow="visible">
          {/* track */}
          <path
            d={`M${CX - R},${CY} A${R},${R} 0 0,1 ${CX + R},${CY}`}
            fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round"
          />
          {/* fill */}
          <path
            d={`M${CX - R},${CY} A${R},${R} 0 0,1 ${CX + R},${CY}`}
            fill="none"
            stroke={arcColor(brightness)}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={ARC_LEN - filled}
            style={{ transition: 'stroke-dashoffset .5s ease, stroke .4s' }}
          />
          <text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="middle"
                fill="var(--text)" fontSize="28" fontWeight="800">
            {brightness}
          </text>
          <text x={CX} y={CY + 4} textAnchor="middle" dominantBaseline="middle"
                fill="var(--muted)" fontSize="13">
            %
          </text>
        </svg>
      </div>
    </Card>
  )
}
