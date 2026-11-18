import { Box, Building2, Cloud, CloudFog, CloudRain, CloudSun, Layers, MapPin, TriangleAlert } from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'

function WeatherIcon({ kind }: { kind: 'clear' | 'cloud' | 'rain' | 'smoke' }) {
  if (kind === 'rain') return <CloudRain size={34} strokeWidth={1.4} />
  if (kind === 'smoke') return <CloudFog size={34} strokeWidth={1.4} />
  if (kind === 'cloud') return <Cloud size={34} strokeWidth={1.4} />
  return <CloudSun size={34} strokeWidth={1.4} />
}

export function MissionHeader() {
  const { scenario } = useSimulation()

  return (
    <section className="mission-card panel" aria-label="Mission overview">
      <div className="mission-title-row">
        <span className="op-pill">{scenario.opId}</span>
        <h1>{scenario.name}</h1>
      </div>
      <div className="mission-meta">
        <span>
          <MapPin size={13} /> {scenario.sector}
        </span>
        <span>
          <Building2 size={13} /> {scenario.structure}
        </span>
        <span>
          <Layers size={13} /> Floors: {scenario.floors}
        </span>
        <span className="meta-warn">
          <TriangleAlert size={13} /> Collapse: {scenario.collapse}
        </span>
      </div>
      <div className="weather" aria-label={`Weather: ${scenario.temperature} degrees, ${scenario.weather}`}>
        <span className="weather-icon">
          <WeatherIcon kind={scenario.weatherKind} />
        </span>
        <span className="weather-copy">
          <strong>{scenario.temperature}°C</strong>
          <span>{scenario.weather}</span>
        </span>
      </div>
    </section>
  )
}

export function ModeCard() {
  return (
    <section className="mode-card panel" aria-label="Simulation mode">
      <span className="mode-icon">
        <Box size={21} strokeWidth={1.6} />
      </span>
      <span className="mode-copy">
        <span className="mode-title">SIMULATION MODE</span>
        <span className="mode-sub">Synthetic data · Research demo</span>
      </span>
    </section>
  )
}
