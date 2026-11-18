import { ChevronDown, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { STAGES } from '../data/scenarios'
import { useSimulation } from '../state/SimulationContext'
import { formatClock, missionClock } from '../simulation/engine'
import { Waveform } from './ui/Charts'

const SPEEDS = [1, 2, 4, 8]

export function SimulationBar() {
  const { state, togglePause, setSpeed, runFullSimulation } = useSimulation()
  const stage = STAGES[state.stage - 1]
  const complete = state.status === 'complete'
  const paused = state.status === 'paused'

  const statusTitle = complete ? 'Mission Complete' : paused ? 'Simulation Paused' : 'Simulation Running'
  const statusSub = complete
    ? 'Autonomous run complete · report ready'
    : paused
      ? `Held at stage ${state.stage} of 8 · ${stage.label}`
      : 'Collecting multi-sensor data...'

  const evidenceLevel = Math.min(0.92, Math.max(0.3, state.evidence / 100))
  const waveform = Array.from({ length: 48 }).map((_, index) => {
    const envelope = 0.44 + Math.sin(index * 0.31 + 0.7) * 0.17 + Math.sin(index * 0.83) * 0.09
    const carrier = Math.sin(index * 1.62) * 0.14 + Math.sin(index * 2.7 + 1.2) * 0.06
    return Math.min(0.96, Math.max(0.12, envelope * (0.55 + evidenceLevel * 0.55) + carrier))
  })

  const handlePrimary = () => {
    if (complete) {
      runFullSimulation()
      return
    }
    togglePause()
  }

  return (
    <section className="sim-bar panel" aria-label="Simulation controls">
      <button
        className={`sim-toggle ${complete ? 'sim-toggle--complete' : ''}`}
        onClick={handlePrimary}
        aria-label={complete ? 'Run simulation again' : paused ? 'Resume simulation' : 'Pause simulation'}
        title={complete ? 'Run again' : paused ? 'Resume (Space)' : 'Pause (Space)'}
      >
        {complete ? <RotateCcw size={18} /> : paused ? <Play size={18} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
      </button>

      <div className="sim-copy">
        <strong>
          <i className={state.status === 'running' ? '' : 'is-idle'} />
          {statusTitle}
        </strong>
        <span>{statusSub}</span>
      </div>

      <div className="sim-wave" aria-hidden="true">
        <Waveform values={waveform} color={complete ? '#3fdcff' : paused ? '#ffd447' : '#2df08a'} variant="line" />
      </div>

      <div className="sim-clock" aria-label={`Mission clock ${formatClock(missionClock(state))}`}>
        <Timer size={14} />
        {formatClock(missionClock(state))}
      </div>

      <label className="speed-control">
        <span className="sr-only">Simulation speed</span>
        <select value={state.speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="Simulation speed">
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
    </section>
  )
}
