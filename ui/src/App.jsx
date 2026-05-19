import { useState } from 'react'
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

  return (
    <div className="app">
      <header className="header">
        <h1 className="header__title">
          Daylight<span>Sync</span>
        </h1>
        <div className={`conn-dot ${connected ? 'conn-dot--live' : ''}`} title={connected ? 'Connected' : 'Disconnected'} />
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
