import { useState, type CSSProperties } from 'react'
import { Activity, AudioLines, Radar } from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import type { SensorKind } from '../types'
import { Sparkline } from './ui/Charts'
import { SensorInspectionDialog } from './modals/SensorInspectionDialog'
import { tacticalAudio } from '../utils/audio'

const CARDS: Array<{
  key: SensorKind
  id: string
  label: string
  count: number
  icon: typeof Radar
  color: string
}> = [
  { key: 'radar', id: 'R-01', label: 'Radar', count: 3, icon: Radar, color: '#2df08a' },
  { key: 'acoustic', id: 'R-02', label: 'Acoustic', count: 2, icon: AudioLines, color: '#3fdcff' },
  { key: 'vibration', id: 'R-03', label: 'Vibration', count: 2, icon: Activity, color: '#b78cff' },
]

export function SensorCards() {
  const { state, ui, selectSensor } = useSimulation()
  const [inspectedId, setInspectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleSensorClick = (cardId: string) => {
    tacticalAudio.playClick()
    const next = ui.selectedSensor === cardId ? null : cardId
    selectSensor(next)
    if (next) {
      setInspectedId(next)
      setDialogOpen(true)
    }
  }

  return (
    <>
      <section className="sensor-cards" aria-label="Sensor arrays">
        {CARDS.map((card) => {
          const Icon = card.icon
          const active = state.channels[card.key]
          const selected = ui.selectedSensor === card.id
          const values = state.history.length
            ? state.history.map((sample) => sample[card.key])
            : [0.08, 0.12, 0.09, 0.14, 0.1, 0.16, 0.12, 0.18, 0.14, 0.2]
          const status =
            state.status === 'complete'
              ? 'Complete'
              : active && state.status === 'paused'
                ? 'Held'
                : active
                  ? 'Active'
                  : 'Standby'

          return (
            <button
              key={card.key}
              className={`sensor-card ${selected ? 'is-selected' : ''}`}
              style={{ '--sensor-color': card.color } as CSSProperties}
              onClick={() => handleSensorClick(card.id)}
              aria-pressed={selected}
              aria-label={`${card.label} ${card.id}, ${status}. Click to inspect telemetry.`}
              title={`${card.label} ${card.id} — Click to inspect live telemetry`}
            >
              <span className="sensor-icon">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <span className="sensor-copy">
                <span className="sensor-name">
                  {card.label} <em>({card.count})</em>
                </span>
                <span className="sensor-status">
                  <i className={active ? '' : 'is-off'} />
                  {status}
                </span>
              </span>
              <span className="sensor-spark" aria-hidden="true">
                <Sparkline values={values} color={active ? card.color : '#5d7d6c'} />
              </span>
            </button>
          )
        })}
      </section>

      <SensorInspectionDialog
        sensorId={inspectedId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
