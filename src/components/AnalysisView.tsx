import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  AudioLines,
  Check,
  Download,
  FileText,
  Gauge as GaugeIcon,
  ListChecks,
  Radar,
  ShieldCheck,
  Waves,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { STAGES } from '../data/scenarios'
import { useSimulation } from '../state/SimulationContext'
import { formatClock, missionClock, stageProgress } from '../simulation/engine'
import type { SensorKind } from '../types'
import { Gauge, Sparkline, TelemetryChart } from './ui/Charts'

const HEALTH: Array<{ key: SensorKind; label: string; icon: typeof Radar; color: string }> = [
  { key: 'radar', label: 'Radar array', icon: Radar, color: '#2df08a' },
  { key: 'acoustic', label: 'Acoustic array', icon: AudioLines, color: '#3fdcff' },
  { key: 'vibration', label: 'Vibration array', icon: Activity, color: '#b78cff' },
]

const BANDS: Record<SensorKind, string> = {
  radar: '2.4 GHz doppler',
  acoustic: '480 Hz band',
  vibration: '18 Hz harmonic',
}

const ARRAYS: Record<SensorKind, string> = {
  radar: 'R-01',
  acoustic: 'R-02',
  vibration: 'R-03',
}

export function AnalysisView() {
  const { state, scenario, setTab, addToast, runFullSimulation } = useSimulation()
  const complete = state.status === 'complete'
  const progress = Math.min(100, Math.round(state.progress * 10) / 10)
  const integrity = (Object.values(state.sensorHealth).reduce((total, value) => total + value, 0) / 3) * 100
  const confidenceSeries = state.history.map((sample) => sample.confidence)
  const radarSeries = state.history.map((sample) => sample.radar)
  const lastSample = state.history[state.history.length - 1]
  const previousSample = state.history[state.history.length - 2]
  const confidenceDelta = lastSample && previousSample ? (lastSample.confidence - previousSample.confidence) * 100 : 0

  const exportCsv = () => {
    if (state.history.length === 0) {
      addToast('Nothing to export', 'Run the simulation to collect telemetry samples first.', 'warning')
      return
    }
    const header = 'time_seconds,radar,acoustic,vibration,confidence'
    const rows = state.history.map((sample) =>
      [sample.t, sample.radar, sample.acoustic, sample.vibration, sample.confidence].map((value) => value.toFixed(4)).join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${scenario.opId}-telemetry.csv`
    link.click()
    URL.revokeObjectURL(url)
    addToast('Telemetry exported', `${state.history.length} samples written to ${scenario.opId}-telemetry.csv.`, 'success')
  }

  return (
    <div className="page-view">
      <header className="view-head">
        <div>
          <span className="view-eyebrow">
            <Activity size={12} /> Mission telemetry
          </span>
          <h1>Signal Analysis</h1>
          <p>
            Live fusion of radar micro-motion, acoustic contact and structural vibration for {scenario.opId} —{' '}
            {scenario.sector}. Evidence is cross-correlated every 250 ms by the autonomous fusion core.
          </p>
        </div>
        <div className="view-actions">
          <button className="secondary-button" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </button>
          <button className="secondary-button" onClick={() => setTab('report')}>
            <FileText size={14} /> Open report
          </button>
          <button className="primary-button" onClick={runFullSimulation}>
            <Waves size={14} /> Run full simulation
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        <article className="kpi-card panel">
          <div className="kpi-label">
            <Radar size={13} /> Detection confidence
          </div>
          <div className="kpi-value">
            <strong>
              {state.evidence.toFixed(1)}
              <small>%</small>
            </strong>
            <span>of 100</span>
          </div>
          <div className="kpi-foot">
            <span className="kpi-delta">
              {confidenceDelta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {confidenceDelta >= 0 ? '+' : ''}
              {confidenceDelta.toFixed(2)}
            </span>
            vs previous sample
          </div>
          <div className="kpi-spark" aria-hidden="true">
            <Sparkline values={confidenceSeries.length ? confidenceSeries : [0.1, 0.2]} color="#2df08a" />
          </div>
        </article>

        <article className="kpi-card panel">
          <div className="kpi-label">
            <GaugeIcon size={13} /> Location uncertainty
          </div>
          <div className="kpi-value">
            <strong>
              ±{state.location.uncertainty.toFixed(2)}
              <small>m</small>
            </strong>
            <span>envelope</span>
          </div>
          <div className="kpi-foot">
            <span className="kpi-delta">
              <ArrowDownRight size={10} /> narrowing
            </span>
            triangulated position
          </div>
          <div className="kpi-spark" aria-hidden="true">
            <Sparkline values={confidenceSeries.length ? confidenceSeries : [0.1, 0.2]} color="#ffd447" />
          </div>
        </article>

        <article className="kpi-card panel">
          <div className="kpi-label">
            <ShieldCheck size={13} /> Sensor integrity
          </div>
          <div className="kpi-value">
            <strong>
              {integrity.toFixed(1)}
              <small>%</small>
            </strong>
            <span>mesh health</span>
          </div>
          <div className="kpi-foot">
            <span className="kpi-delta">
              <ArrowUpRight size={10} /> +1.2
            </span>
            3 arrays reporting
          </div>
          <div className="kpi-spark" aria-hidden="true">
            <Sparkline values={radarSeries.length ? radarSeries : [0.2, 0.3]} color="#3fdcff" />
          </div>
        </article>

        <article className="kpi-card panel">
          <div className="kpi-label">
            <ListChecks size={13} /> Mission progress
          </div>
          <div className="kpi-value">
            <strong>
              {progress.toFixed(progress % 1 === 0 ? 0 : 1)}
              <small>%</small>
            </strong>
            <span>{complete ? 'complete' : `stage ${state.stage}/8`}</span>
          </div>
          <div className="kpi-foot">
            <span className="kpi-delta">{formatClock(missionClock(state))}</span>
            mission clock
          </div>
          <div className="kpi-spark" aria-hidden="true">
            <Sparkline values={state.history.map((sample) => sample.radar)} color="#b78cff" />
          </div>
        </article>
      </div>

      <div className="analysis-grid">
        <div className="analysis-stack">
          <section className="chart-panel panel" aria-label="Multi-channel telemetry">
            <div className="panel-heading">
              <span className="panel-icon">
                <Waves size={17} />
              </span>
              <h2>Multi-channel telemetry</h2>
              <div className="chart-legend">
                <span style={{ '--legend-color': '#2df08a' } as CSSProperties}>
                  <i /> Radar
                </span>
                <span style={{ '--legend-color': '#3fdcff' } as CSSProperties}>
                  <i /> Acoustic
                </span>
                <span style={{ '--legend-color': '#b78cff' } as CSSProperties}>
                  <i /> Vibration
                </span>
                <span style={{ '--legend-color': '#ffd447' } as CSSProperties}>
                  <i /> Confidence
                </span>
              </div>
            </div>
            <div className="telemetry-chart">
              <TelemetryChart history={state.history} />
            </div>
            <div className="chart-foot">
              <span>
                Window <strong>{state.history.length} samples</strong> · 250 ms tick
              </span>
              <span>
                Latest packet <strong>{lastSample ? formatClock(lastSample.t) : '—'}</strong>
              </span>
              <span>
                Fusion mode <strong>{state.mode === 'autonomous' ? 'Autonomous' : 'Live ambient'}</strong>
              </span>
            </div>
          </section>

          <section className="chart-panel panel" aria-label="Workflow evidence log">
            <div className="panel-heading">
              <span className="panel-icon">
                <ListChecks size={17} />
              </span>
              <h2>Workflow evidence log</h2>
              <span className="panel-tag">{complete ? '8/8' : `${state.stage}/8`}</span>
            </div>
            <ul className="evidence-timeline">
              {STAGES.map((stage) => {
                const done = complete || stage.id < state.stage
                const active = !complete && stage.id === state.stage
                const pct = active ? Math.round(stageProgress(state.progress, stage.id) * 100) : done ? 100 : 0
                return (
                  <li key={stage.id} className="timeline-item">
                    <span className={`timeline-marker ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
                      {done && <Check size={9} strokeWidth={3} />}
                    </span>
                    <div className="timeline-copy">
                      <strong>
                        {stage.id}. {stage.label}
                        {active ? ` · ${pct}%` : done ? ' · complete' : ' · queued'}
                      </strong>
                      <span>{stage.detail}</span>
                    </div>
                    <span className="panel-tag" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
                      T+{formatClock((stage.start / 100) * 334)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className="analysis-stack">
          <section className="gauge-panel panel" aria-label="Evidence gauge">
            <div className="panel-heading">
              <span className="panel-icon">
                <Radar size={17} />
              </span>
              <h2>Evidence fusion</h2>
              <span className="panel-tag">{state.channels.radar && state.channels.acoustic && state.channels.vibration ? '3/3' : 'PARTIAL'}</span>
            </div>
            <div className="gauge-wrap">
              <Gauge value={state.evidence} label="Detection confidence" />
              <div className="gauge-center">
                <strong>{Math.round(state.evidence)}%</strong>
                <span>confidence</span>
              </div>
            </div>
            <div className="gauge-meta">
              <div>
                <span>Triangulation</span>
                <strong>{state.evidence >= 84 ? 'Locked' : state.evidence >= 60 ? 'Converging' : 'Pending'}</strong>
              </div>
              <div>
                <span>Envelope</span>
                <strong>±{state.location.uncertainty.toFixed(2)} m</strong>
              </div>
              <div>
                <span>Contact</span>
                <strong>{state.evidence >= 60 ? scenario.victim.id : '—'}</strong>
              </div>
              <div>
                <span>Stage</span>
                <strong>{complete ? 'Complete' : `${state.stage} / 8`}</strong>
              </div>
            </div>
          </section>

          <section className="chart-panel panel" aria-label="Sensor health">
            <div className="panel-heading">
              <span className="panel-icon">
                <ShieldCheck size={17} />
              </span>
              <h2>Sensor health</h2>
              <span className="panel-tag">MESH</span>
            </div>
            <div className="health-list">
              {HEALTH.map((item) => {
                const Icon = item.icon
                const value = state.sensorHealth[item.key] * 100
                return (
                  <div key={item.key} className="health-row">
                    <span className="health-icon" style={{ '--health-color': item.color } as CSSProperties}>
                      <Icon size={14} />
                    </span>
                    <div className="health-copy">
                      <div className="health-top">
                        <span>
                          {item.label} · {ARRAYS[item.key]}
                        </span>
                        <strong>{value.toFixed(1)}%</strong>
                      </div>
                      <div className="health-bar" style={{ '--health-color': item.color } as CSSProperties}>
                        <span style={{ width: `${Math.min(100, value)}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="chart-foot">
              <span>
                Uplink <strong>Nominal</strong>
              </span>
              <span>
                Drift <strong>&lt; 0.4%</strong>
              </span>
            </div>
          </section>
        </div>
      </div>

      <section className="table-panel panel" aria-label="Channel sample table">
        <div className="panel-heading">
          <span className="panel-icon">
            <Activity size={17} />
          </span>
          <h2>Channel sample register</h2>
          <span className="panel-tag">{state.history.length} SAMPLES</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Array</th>
              <th>Band</th>
              <th>Status</th>
              <th>Integrity</th>
              <th>Samples</th>
              <th>Last packet</th>
            </tr>
          </thead>
          <tbody>
            {HEALTH.map((item) => {
              const active = state.channels[item.key]
              const status = complete ? 'Complete' : active ? 'Active' : 'Standby'
              const badgeClass = complete ? 'badge--green' : active ? 'badge--green' : 'badge--amber'
              return (
                <tr key={item.key}>
                  <td className="strong">{item.label.replace(' array', '')}</td>
                  <td className="mono">{ARRAYS[item.key]}</td>
                  <td className="mono">{BANDS[item.key]}</td>
                  <td>
                    <span className={`badge ${badgeClass}`}>{status}</span>
                  </td>
                  <td className="num">{(state.sensorHealth[item.key] * 100).toFixed(1)}%</td>
                  <td className="num">{state.history.length}</td>
                  <td className="num">{lastSample ? formatClock(lastSample.t) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
