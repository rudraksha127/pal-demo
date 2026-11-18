import { useMemo } from 'react'
import {
  Building2,
  Check,
  CloudSun,
  Compass,
  Info,
  Layers,
  MapPin,
  Play,
  Radar,
  RotateCcw,
  Users,
} from 'lucide-react'
import { SCENARIOS } from '../data/scenarios'
import { useSimulation } from '../state/SimulationContext'
import { mulberry32, randomBetween } from './scene/utils'

function ScenarioSkyline({ seed }: { seed: number }) {
  const buildings = useMemo(() => {
    const random = mulberry32(seed + 12)
    return Array.from({ length: 8 }).map((_, index) => ({
      x: 14 + index * 50 + randomBetween(random, -6, 6),
      width: randomBetween(random, 26, 42),
      height: randomBetween(random, 26, 66),
      windows: Array.from({ length: 5 }).map(() => random() > 0.55),
    }))
  }, [seed])

  return (
    <svg viewBox="0 0 420 104" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2a1c" />
          <stop offset="100%" stopColor="#07130d" />
        </linearGradient>
      </defs>
      <rect width="420" height="104" fill={`url(#sky-${seed})`} />
      {buildings.map((building, index) => (
        <g key={index}>
          <rect
            x={building.x}
            y={104 - building.height}
            width={building.width}
            height={building.height}
            fill="#12291f"
            stroke="rgba(80,190,140,0.16)"
            strokeWidth="0.8"
          />
          {building.windows.map((lit, windowIndex) => (
            <rect
              key={windowIndex}
              x={building.x + 6 + (windowIndex % 3) * 9}
              y={104 - building.height + 8 + Math.floor(windowIndex / 3) * 12}
              width="4"
              height="5"
              fill={lit ? 'rgba(120,255,190,0.42)' : 'rgba(40,90,70,0.4)'}
            />
          ))}
        </g>
      ))}
      <g>
        <path d="M 176 104 L 176 48 L 214 40 L 238 62 L 250 58 L 258 104 Z" fill="#1a2f25" stroke="rgba(120,220,175,0.25)" />
        <path d="M 176 48 L 214 40 L 238 62" fill="none" stroke="rgba(255,95,86,0.5)" strokeWidth="1.2" strokeDasharray="4 3" />
        <path d="M 214 40 L 206 78 L 238 62" fill="none" stroke="rgba(255,95,86,0.35)" strokeWidth="0.8" />
        <circle cx="206" cy="84" r="2.4" fill="#ff5f56" opacity="0.9" />
        <circle cx="222" cy="92" r="1.8" fill="#ff5f56" opacity="0.7" />
        <circle cx="196" cy="96" r="1.4" fill="#ff5f56" opacity="0.55" />
        <path d="M 168 104 L 168 66 L 182 62 L 182 104 Z" fill="#163025" />
      </g>
      <line x1="0" y1="103" x2="420" y2="103" stroke="rgba(120,220,175,0.25)" />
    </svg>
  )
}

export function ScenariosView() {
  const { scenario, state, selectScenario, resetSimulation, runFullSimulation } = useSimulation()
  const progress = Math.round(state.progress)

  return (
    <div className="page-view">
      <header className="view-head">
        <div>
          <span className="view-eyebrow">
            <Compass size={12} /> Training environment
          </span>
          <h1>Scenario Library</h1>
          <p>
            Four synthetic collapse environments for exercising the autonomous rescue workflow. Loading a scenario resets the
            sensor mesh, search zones and mission clock to that incident's live snapshot.
          </p>
        </div>
        <div className="view-actions">
          <button className="secondary-button" onClick={resetSimulation}>
            <RotateCcw size={14} /> Reset current
          </button>
          <button className="primary-button" onClick={runFullSimulation}>
            <Play size={14} /> Run current scenario
          </button>
        </div>
      </header>

      <div className="scenario-grid">
        {SCENARIOS.map((item) => {
          const active = item.id === scenario.id
          const badgeClass = item.difficulty === 'Critical' ? 'badge--red' : item.difficulty === 'High' ? 'badge--amber' : 'badge--green'
          return (
            <article key={item.id} className={`scenario-card panel ${active ? 'is-active' : ''}`}>
              <div className="scenario-visual">
                <span className="scenario-status">
                  <i /> {active ? `Active · ${progress}%` : 'Ready'}
                </span>
                <ScenarioSkyline seed={item.seed} />
              </div>

              <div className="scenario-body">
                <div className="scenario-topline">
                  <h3>{item.name}</h3>
                  <span className={`badge ${badgeClass}`}>{item.difficulty}</span>
                </div>
                <div className="scenario-op">
                  {item.opId} · {item.sector}
                </div>
                <p className="scenario-desc">{item.summary}</p>

                <div className="scenario-stats">
                  <span className="scenario-stat">
                    <Building2 size={11} /> <strong>{item.structure}</strong>
                  </span>
                  <span className="scenario-stat">
                    <Layers size={11} /> <strong>{item.floors} floors</strong>
                  </span>
                  <span className="scenario-stat">
                    <Users size={11} /> <strong>{item.estimatedVictims} estimated</strong>
                  </span>
                  <span className="scenario-stat">
                    <MapPin size={11} /> <strong>{item.zones.length} zones</strong>
                  </span>
                  <span className="scenario-stat">
                    <Radar size={11} /> <strong>{item.sensors.length} arrays</strong>
                  </span>
                  <span className="scenario-stat">
                    <CloudSun size={11} /> <strong>{item.temperature}°C {item.weather}</strong>
                  </span>
                </div>

                <div className="scenario-foot">
                  <button className="scenario-load" disabled={active} onClick={() => selectScenario(item.id)}>
                    {active ? <Check size={13} /> : <Play size={13} />}
                    {active ? 'Active scenario' : 'Load scenario'}
                  </button>
                  <span className="scenario-timeline">{item.timeline}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="scenario-note">
        <Info size={14} />
        <span>
          Every scenario uses the same deterministic eight-stage workflow but changes building geometry, floor count, zone
          classification and sensor placement. All incident data is synthetic and intended for interface research only.
        </span>
      </div>
    </div>
  )
}
