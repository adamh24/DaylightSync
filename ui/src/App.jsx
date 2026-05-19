import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

import './App.css'
import { useSimState } from './hooks/useSimState'
import LuxCard       from './components/LuxCard'
import BrightnessCard from './components/BrightnessCard'
import ModeCard      from './components/ModeCard'
import ZonesCard     from './components/ZonesCard'

export default function App() {
  const { state, connected, api } = useSimState()

  const zoneEntries = Object.values(state.zones ?? {})
  const totalZones = zoneEntries.length
  const connectedZones = zoneEntries.filter((zone) => {
    const isObject = typeof zone === 'object' && zone !== null
    if (!isObject) return Boolean(zone)
    return Boolean(zone.connected ?? true)
  }).length

  let statusClass = 'conn-dot--none'
  let statusTitle = 'No connected zones'

  if (connected && totalZones > 0 && connectedZones === totalZones) {
    statusClass = 'conn-dot--all'
    statusTitle = 'All zones connected'
  } else if (connected && connectedZones > 0) {
    statusClass = 'conn-dot--some'
    statusTitle = 'Some zones connected'
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">
          Daylight<span>Sync</span>
        </h1>
        <div className={`conn-dot ${statusClass}`} title={statusTitle} />
      </header>

      <div className="grid">
        <LuxCard lux={state.lux} />
        <BrightnessCard brightness={state.brightness} />
        <ModeCard mode={state.mode} brightness={state.brightness} api={api} />
      </div>
      <div className="zones-row">
        <ZonesCard zones={state.zones} api={api} fullWidth />
      </div>
    </div>
  )
}
