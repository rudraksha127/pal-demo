import { CheckCircle2, ClipboardList, Download, FileText, MapPin, Printer, Radar, Route, ShieldCheck, TriangleAlert } from 'lucide-react'
import { STAGES } from '../data/scenarios'
import { useSimulation } from '../state/SimulationContext'
import { formatClock, missionClock } from '../simulation/engine'
import type { SensorKind } from '../types'

const ARRAYS: Array<{ key: SensorKind; label: string; array: string; band: string }> = [
  { key: 'radar', label: 'Radar micro-motion', array: 'R-01', band: '2.4 GHz doppler' },
  { key: 'acoustic', label: 'Acoustic voice pattern', array: 'R-02', band: '480 Hz band' },
  { key: 'vibration', label: 'Vibration resonance', array: 'R-03', band: '18 Hz harmonic' },
]

function ReportMark() {
  return (
    <svg viewBox="0 0 48 30" width="34" height="30" aria-hidden="true">
      <path
        d="M1 15 H8 L11 15 L13 5 L16 25 L19 9 L21 15 H28 L30 8 L33 22 L35 15 H47"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ReportView() {
  const { state, scenario, addToast, setTab } = useSimulation()
  const complete = state.status === 'complete'
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const statusLabel = complete ? 'Complete' : state.status === 'paused' ? 'Paused' : 'In progress'
  const confidence = state.evidence.toFixed(1)

  const downloadJson = () => {
    const report = {
      reportId: `${scenario.opId}-RPT-${dateLabel.replace(/\s/g, '').toUpperCase()}`,
      generatedAt: now.toISOString(),
      scenario,
      status: state.status,
      progress: state.progress,
      stage: state.stage,
      evidence: state.evidence,
      location: state.location,
      channels: state.channels,
      sensorHealth: state.sensorHealth,
      telemetrySamples: state.history.length,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${scenario.opId}-mission-report.json`
    link.click()
    URL.revokeObjectURL(url)
    addToast('Report exported', 'Machine-readable mission report saved as JSON.', 'success')
  }

  return (
    <div className="page-view">
      <header className="view-head">
        <div>
          <span className="view-eyebrow">
            <ClipboardList size={12} /> After-action documentation
          </span>
          <h1>Mission Report</h1>
          <p>
            Auto-generated incident record for {scenario.opId}. The report is assembled from the live simulation state and
            updates as the autonomous workflow advances.
          </p>
        </div>
        <div className="view-actions">
          <button className="secondary-button" onClick={() => setTab('analysis')}>
            <Radar size={14} /> Signal analysis
          </button>
          <button className="secondary-button" onClick={downloadJson}>
            <Download size={14} /> Export JSON
          </button>
          <button className="primary-button" onClick={() => window.print()}>
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </header>

      <article className="report-doc" aria-label="Mission report document">
        <div className="report-head">
          <div className="report-brand">
            <ReportMark />
            <div>
              <strong>AFTERSHOCK</strong>
              <span>Disaster search &amp; rescue simulation</span>
            </div>
          </div>
          <div className="report-meta">
            Report <strong>{scenario.opId}-RPT</strong>
            <br />
            Generated <strong>{dateLabel}</strong> · <strong>{timeLabel}</strong>
            <br />
            Classification <strong>Synthetic exercise</strong>
          </div>
        </div>

        <div className="report-title-row">
          <h2>{scenario.name}</h2>
          <span className={`badge ${complete ? 'badge--green' : state.status === 'paused' ? 'badge--amber' : 'badge--green'}`}>
            {statusLabel}
          </span>
          <span className="badge badge--red">{scenario.difficulty}</span>
        </div>

        <p className="report-summary">
          {scenario.summary} The autonomous fusion core completed {complete ? 'all eight workflow stages' : `${state.stage} of 8 workflow stages`} with
          a detection confidence of {confidence}% and a location uncertainty envelope of ±{state.location.uncertainty.toFixed(2)} m.
        </p>

        <div className="report-grid">
          <div className="report-fact">
            <span>Operation ID</span>
            <strong>{scenario.opId}</strong>
          </div>
          <div className="report-fact">
            <span>Sector</span>
            <strong>{scenario.sector}</strong>
          </div>
          <div className="report-fact">
            <span>Structure</span>
            <strong>{scenario.structure}</strong>
          </div>
          <div className="report-fact">
            <span>Floors / collapse</span>
            <strong>
              {scenario.floors} · {scenario.collapse}
            </strong>
          </div>
          <div className="report-fact">
            <span>Weather</span>
            <strong>
              {scenario.temperature}°C · {scenario.weather}
            </strong>
          </div>
          <div className="report-fact">
            <span>Mission clock</span>
            <strong>{formatClock(missionClock(state))}</strong>
          </div>
          <div className="report-fact">
            <span>Detection confidence</span>
            <strong>{confidence}%</strong>
          </div>
          <div className="report-fact">
            <span>Sensor arrays</span>
            <strong>{scenario.sensors.length} deployed</strong>
          </div>
        </div>

        <section className="report-section">
          <h3>
            <TriangleAlert size={13} /> Incident overview
          </h3>
          <p>
            At the time of registration, {scenario.sector.toLowerCase()} was placed under a {scenario.difficulty.toLowerCase()} risk
            classification. {scenario.timeline} The affected structure is a {scenario.floors}-storey {scenario.structure.toLowerCase()}{' '}
            building with a {scenario.collapse.toLowerCase()} collapse pattern. Search operations are constrained to the surveyed
            access corridors and the voids classified during stage three of the workflow.
          </p>
        </section>

        <section className="report-section">
          <h3>
            <Radar size={13} /> Detection &amp; localisation
          </h3>
          <p>
            {state.evidence >= 60
              ? `Multi-sensor fusion produced a viable contact at ${scenario.victim.zoneId}, floor ${scenario.victim.floor}. Cross-correlation of radar micro-motion, acoustic voice patterns and structural vibration converged on a single position with ${confidence}% confidence. The current estimate is X ${state.location.x.toFixed(1)} m, Y ${state.location.y.toFixed(1)} m, Z ${state.location.z.toFixed(1)} m with ±${state.location.uncertainty.toFixed(2)} m uncertainty.`
              : `The sensor mesh has not yet accumulated sufficient cross-channel evidence for a confirmed contact. The current confidence is ${confidence}% and the estimated envelope remains ±${state.location.uncertainty.toFixed(2)} m. Collection continues across all deployed arrays.`}
          </p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Array</th>
                <th>Band</th>
                <th>Status</th>
                <th>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {ARRAYS.map((channel) => {
                const active = state.channels[channel.key]
                return (
                  <tr key={channel.key}>
                    <td className="strong">{channel.label}</td>
                    <td className="mono">{channel.array}</td>
                    <td className="mono">{channel.band}</td>
                    <td>
                      <span className={`badge ${active ? 'badge--green' : 'badge--amber'}`}>{complete ? 'Complete' : active ? 'Acquired' : 'Pending'}</span>
                    </td>
                    <td className="num">{(state.sensorHealth[channel.key] * 100).toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="report-section">
          <h3>
            <MapPin size={13} /> Estimated survivor location
          </h3>
          <div className="report-grid">
            <div className="report-fact">
              <span>X coordinate</span>
              <strong>{state.evidence >= 60 ? `${state.location.x.toFixed(1)} m` : '—'}</strong>
            </div>
            <div className="report-fact">
              <span>Y coordinate</span>
              <strong>{state.evidence >= 60 ? `${state.location.y.toFixed(1)} m` : '—'}</strong>
            </div>
            <div className="report-fact">
              <span>Z coordinate</span>
              <strong>{state.evidence >= 60 ? `${state.location.z.toFixed(1)} m` : '—'}</strong>
            </div>
            <div className="report-fact">
              <span>Floor / zone</span>
              <strong>{state.evidence >= 60 ? `${scenario.victim.floor} · ${scenario.victim.zoneId}` : '—'}</strong>
            </div>
            <div className="report-fact">
              <span>Uncertainty</span>
              <strong>±{state.location.uncertainty.toFixed(2)} m</strong>
            </div>
            <div className="report-fact">
              <span>Contact ID</span>
              <strong>{state.evidence >= 60 ? scenario.victim.id : 'Unconfirmed'}</strong>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h3>
            <ClipboardList size={13} /> Workflow execution
          </h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Description</th>
                <th>Timestamp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {STAGES.map((stage) => {
                const done = complete || stage.id < state.stage
                const active = !complete && stage.id === state.stage
                return (
                  <tr key={stage.id}>
                    <td className="strong">
                      {stage.id}. {stage.label}
                    </td>
                    <td className="mono">{stage.detail}</td>
                    <td className="num">T+{formatClock((stage.start / 100) * 334)}</td>
                    <td>
                      <span className={`badge ${done ? 'badge--green' : active ? 'badge--amber' : ''}`}>
                        {done ? 'Complete' : active ? 'Active' : 'Queued'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        <section className="report-section">
          <h3>
            <Route size={13} /> Rescue recommendation
          </h3>
          <p>
            {complete
              ? `Viable contact is confirmed. Rescue Team Alpha should approach ${scenario.victim.zoneId} via the east stair core, establish voice contact, and begin controlled void stabilisation before extraction. Medical support should stage at the north perimeter.`
              : `The mission remains in progress. Continue multi-channel collection until confidence exceeds 90% and the uncertainty envelope is below ±1.0 m. Do not commit extraction resources until the contact is confirmed by the fusion core.`}
          </p>
        </section>

        <div className="report-signoff">
          <div className="signoff-block">
            <span>Prepared by</span>
            <strong>Autonomous Fusion Core · AFC-7</strong>
            <small>Deterministic simulation engine</small>
          </div>
          <div className="signoff-block">
            <span>Reviewed by</span>
            <strong>Rescue Commander · Alpha Unit</strong>
            <small>Command uplink authenticated</small>
          </div>
          <div className="signoff-block">
            <span>Generated</span>
            <strong>
              {dateLabel} · {timeLabel}
            </strong>
            <small>Report {scenario.opId}-RPT</small>
          </div>
          <div className="report-seal">
            <ShieldCheck size={18} />
            <div>
              <strong>{complete ? 'Verified record' : 'Working record'}</strong>
              <span>Synthetic exercise · not operational</span>
            </div>
          </div>
        </div>
      </article>

      <div className="scenario-note">
        <FileText size={14} />
        <span>
          This report is generated entirely from the in-browser simulation state. All names, coordinates, sensor readings and
          victims are synthetic. Use the print action to produce a paginated PDF copy of this record.
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--green)' }}>
          <CheckCircle2 size={13} /> Auto-updating
        </span>
      </div>
    </div>
  )
}
