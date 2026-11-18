import { AudioWaveform, Check, Play, RotateCcw, Save } from 'lucide-react'
import { STAGES } from '../data/scenarios'
import { useSimulation } from '../state/SimulationContext'
import { stageProgress } from '../simulation/engine'
import { tacticalAudio } from '../utils/audio'

export function WorkflowSidebar() {
  const { state, runFullSimulation, resetSimulation, saveMission, addToast } = useSimulation()
  const complete = state.status === 'complete'
  const activeStage = complete ? 0 : state.stage
  const completedCount = complete ? 8 : Math.max(0, state.stage - 1)
  const runLabel = complete ? 'Run Again' : state.mode === 'autonomous' && state.status === 'running' ? 'Restart Simulation' : 'Run Full Simulation'

  const handleRun = () => {
    tacticalAudio.playStageChime()
    runFullSimulation()
  }

  const handleReset = () => {
    tacticalAudio.playClick()
    resetSimulation()
  }

  const handleSave = () => {
    tacticalAudio.playClick()
    saveMission()
  }

  return (
    <aside className="workflow panel" aria-label="Mission workflow">
      <div className="panel-heading">
        <span className="panel-icon">
          <AudioWaveform size={18} />
        </span>
        <h2>Mission Workflow</h2>
        <span className="workflow-count">{completedCount}/8</span>
      </div>

      <ol className="workflow-list">
        {STAGES.map((stage) => {
          const isDone = complete || stage.id < state.stage
          const isActive = !complete && stage.id === activeStage
          const status = isDone ? 'done' : isActive ? 'active' : 'pending'
          const pct = isActive ? Math.round(stageProgress(state.progress, stage.id) * 100) : 0

          return (
            <li
              key={stage.id}
              className={`workflow-step workflow-step--${status}`}
              onClick={() => {
                tacticalAudio.playClick()
                addToast(`Workflow Step ${stage.id}`, `${stage.label} · ${isDone ? 'Completed' : isActive ? 'In Progress' : 'Pending'}`, 'info')
              }}
              style={{ cursor: 'pointer' }}
              title={`Step ${stage.id}: ${stage.label}`}
            >
              <span className="step-index">
                {isActive ? <AudioWaveform size={15} strokeWidth={2.2} /> : stage.id}
              </span>
              <span className="step-label">{stage.label}</span>
              {isDone && <Check size={12} className="step-check" strokeWidth={3} />}
              {!isDone && !isActive && <span className="step-pending-dot" aria-hidden="true" />}
              {isActive && (
                <span className="step-progress" aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <div className="workflow-actions">
        <button
          className={`run-button ${state.mode === 'autonomous' && state.status === 'running' ? 'run-button--active' : ''}`}
          onClick={handleRun}
          title="Run the complete eight-stage rescue workflow autonomously"
        >
          <span className="run-icon">
            <Play size={17} fill="currentColor" strokeWidth={1.5} />
          </span>
          <span className="run-copy">
            <strong>{runLabel}</strong>
            <small>(Autonomous Mode)</small>
          </span>
        </button>

        <div className="secondary-actions">
          <button className="ghost-button" onClick={handleReset} title="Reset to the live scanning snapshot (R)">
            <RotateCcw size={14} /> Reset
          </button>
          <button className="ghost-button" onClick={handleSave} title="Save mission snapshot locally">
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </aside>
  )
}
