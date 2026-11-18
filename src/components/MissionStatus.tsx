import { Check, Gauge } from 'lucide-react'
import { STAGES } from '../data/scenarios'
import { useSimulation } from '../state/SimulationContext'

export function MissionStatus() {
  const { state } = useSimulation()
  const complete = state.status === 'complete'
  const stage = STAGES[state.stage - 1]
  const progress = Math.min(100, Math.round(state.progress * 10) / 10)

  return (
    <section className="status-panel panel" aria-label="Mission status">
      <div className="panel-heading">
        <span className="panel-icon">
          <Gauge size={17} />
        </span>
        <h2>Mission Status</h2>
      </div>

      <div className="stage-row">
        <span>Current Stage</span>
        <span className="stage-pill">{complete ? 'Rescue Confirmed' : stage.label}</span>
      </div>

      <div className="stage-stepper" aria-label={`Stage ${state.stage} of 8`}>
        {STAGES.map((item) => {
          const done = complete || item.id < state.stage
          const current = !complete && item.id === state.stage
          return (
            <span
              key={item.id}
              className={`stage-dot ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}
              title={`${item.id}. ${item.label}`}
            >
              {done && <Check size={8} strokeWidth={3.4} />}
            </span>
          )
        })}
      </div>

      <div className="progress-row">
        <span>Overall Progress</span>
        <strong>{progress.toFixed(progress % 1 === 0 ? 0 : 1)}%</strong>
      </div>
      <div className="meter meter--lg" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Overall mission progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <p className="sr-only" aria-live="polite">
        {complete
          ? 'Autonomous run complete. Rescue confirmed and report ready.'
          : `${stage.label}. ${state.status === 'paused' ? 'Simulation paused.' : 'Live scanning in progress.'}`}
      </p>
    </section>
  )
}
