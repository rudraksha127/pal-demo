import {
  AlertTriangle,
  ClipboardList,
  Download,
  FileText,
  MapPin,
  Printer,
  Radar,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { SIMULATION_DISCLAIMER } from './DisclaimerBanner'
import { formatClock, latestCandidateObservationForZone, missionTime, zoneStatusDetail } from '../engine'
import { sensorMeta } from '../data'
import { IllustrativeTag, StatusBadge } from './common'

export function ReportView() {
  const { state, report } = useRfFense()
  const generated = state.reportGeneratedAt !== null
  const failedNodes = state.nodes.filter((node) => state.failureNodes.includes(node.id))

  function downloadJson() {
    const payload = {
      exportKind: 'RF FENSE illustrative simulation report',
      disclaimer: SIMULATION_DISCLAIMER,
      generatedAt: new Date().toISOString(),
      missionGeneratedAt: state.reportGeneratedAt,
      incident: state.incident,
      summary: report,
      zones: state.zones,
      nodes: state.nodes,
      observations: state.observations,
      events: state.events,
      alerts: state.alerts,
      reassessments: state.reassessments,
      verifications: state.verifications,
      extraction: state.extraction,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rf-fense-${state.incident.id}-${generated ? 'final' : 'preliminary'}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rf-report">
      <header className="rf-report__head panel">
        <div className="rf-report__head-main">
          <p className="rf-eyebrow">Final search report · illustrative simulation</p>
          <h2>{state.incident.name}</h2>
          <p className="rf-report__sub">
            <MapPin size={13} aria-hidden="true" />
            {state.incident.address} · {state.incident.id} · {state.incident.floors} floors
          </p>
          <div className="rf-report__status">
            <span className={`rf-report-state ${generated ? 'is-generated' : 'is-draft'}`}>
              <FileText size={13} aria-hidden="true" />
              {generated
                ? `Generated · mission ${formatClock(missionTime(state, state.reportGeneratedAt ?? 0))}`
                : 'Preliminary · not yet generated'}
            </span>
            <span className={`rf-operation-state ${report.operationStatus === 'Completed' ? 'is-complete' : 'is-progress'}`}>
              Search operation · {report.operationStatus}
            </span>
            <IllustrativeTag />
          </div>
        </div>
        <div className="rf-report__actions">
          <button type="button" className="secondary-button" onClick={downloadJson} data-control="download-report-json">
            <Download size={14} aria-hidden="true" />
            Download JSON
          </button>
          <button type="button" className="secondary-button" onClick={() => window.print()} data-control="print-report">
            <Printer size={14} aria-hidden="true" />
            Print / PDF
          </button>
        </div>
      </header>

      <section className="panel rf-report-outcome" aria-label="Operation outcome">
        <div className="rf-outcome-grid">
          <div>
            <span>Demonstrated rescue</span>
            <strong className={report.demonstratedRescueStatus === 'Completed' ? 'is-good' : 'is-amber'}>
              {report.demonstratedRescueStatus}
            </strong>
            <p>The simulated rescue sequence for the verified zone.</p>
          </div>
          <div>
            <span>Full search operation</span>
            <strong className={report.operationStatus === 'Completed' ? 'is-good' : 'is-amber'}>
              {report.operationStatus}
            </strong>
            <p>
              {report.operationStatus === 'In Progress'
                ? 'Unresolved zones remain. Completing one demonstrated rescue does not close the full search.'
                : 'All zones reached a resolved state in this run.'}
            </p>
          </div>
          <div>
            <span>Unresolved zones</span>
            <strong className={report.unresolvedZones.length > 0 ? 'is-red' : 'is-good'}>
              {report.unresolvedZones.length}
            </strong>
            <p>{report.unresolvedZones.map((zone) => `Zone ${zone.id}`).join(' · ') || 'None'}</p>
          </div>
        </div>
      </section>

      <section className="rf-report-metrics" aria-label="Report metrics">
        {[
          ['Zones', report.totalZones, 'Defined search zones'],
          ['Valid scans', report.validScanZones, 'Zones with accepted data'],
          ['Candidate signals', report.candidateObservationCount, 'Accepted candidate observations'],
          ['Unverified', report.unverifiedZones, 'No reliable coverage'],
          ['Sensor failures', report.sensorFailures, 'Offline nodes'],
          ['Human verified', report.humanVerifiedSurvivors, 'Independent confirmation'],
        ].map(([label, value, foot]) => (
          <div key={String(label)} className="rf-report-metric">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{foot}</small>
          </div>
        ))}
      </section>

      <section className="panel rf-report-section" aria-labelledby="rf-report-zones">
        <div className="rf-report-section__head">
          <h3 id="rf-report-zones">Zone outcomes</h3>
          <span>Derived from {state.observations.length} observations</span>
        </div>
        <div className="rf-table-wrap">
          <table className="rf-table">
            <caption className="rf-sr-only">Final zone outcome table</caption>
            <thead>
              <tr>
                <th scope="col">Zone</th>
                <th scope="col">Outcome</th>
                <th scope="col">Assigned node</th>
                <th scope="col">Latest observation</th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {state.zones.map((zone) => {
                const node = state.nodes.find((item) => item.zoneId === zone.id)
                const observation = [...state.observations].reverse().find((item) => item.zoneId === zone.id)
                const candidate = latestCandidateObservationForZone(state, zone.id)
                return (
                  <tr key={zone.id}>
                    <th scope="row">
                      <span className="rf-zone-letter">{zone.id}</span> {zone.name}
                    </th>
                    <td>
                      <StatusBadge status={zone.status} compact />
                    </td>
                    <td className="rf-mono">{node ? `${node.id}${state.failureNodes.includes(node.id) ? ' (offline)' : ''}` : '—'}</td>
                    <td>
                      {observation ? (
                        <>
                          {observation.observationType.replaceAll('_', ' ')} ·{' '}
                          {observation.accepted ? 'accepted' : 'rejected'} ·{' '}
                          {formatClock(missionTime(state, observation.timestamp))}
                          {candidate && candidate.id !== observation.id && (
                            <small className="rf-cell-sub">
                              Prior candidate {candidate.id} retained ·{' '}
                              {formatClock(missionTime(state, candidate.timestamp))}
                            </small>
                          )}
                        </>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td className="rf-cell-copy">{zoneStatusDetail(zone.status)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rf-report__split">
        <section className="panel rf-report-section" aria-labelledby="rf-report-failure">
          <div className="rf-report-section__head">
            <h3 id="rf-report-failure">Sensor failure and coverage</h3>
            <span>{failedNodes.length} failed node{failedNodes.length === 1 ? '' : 's'}</span>
          </div>
          {failedNodes.length === 0 ? (
            <p className="rf-empty">No sensor failure has occurred in the current run.</p>
          ) : (
            <>
              {failedNodes.map((node) => (
                <div key={node.id} className="rf-report-failure">
                  <div className="rf-report-failure__top">
                    <span className="rf-report-failure__icon">
                      <Radar size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>
                        {node.id} · Zone {node.zoneId}
                      </strong>
                      <p>
                        {sensorMeta(node.sensorType).label} · Battery N/A · Signal unknown ·{' '}
                        {node.failureAt === null ? 'Failure time unknown' : `Failed at ${formatClock(missionTime(state, node.failureAt))}`}
                      </p>
                    </div>
                    <span className="rf-fail-badge">Offline</span>
                  </div>
                  <p className="rf-failure-warning">
                    <AlertTriangle size={13} aria-hidden="true" />
                    The node stopped reporting. Zone {node.zoneId} is Unverified, not empty. The failure does not
                    justify clearing the zone or claiming no survivor is present.
                  </p>
                </div>
              ))}
              {state.reassessments.map((reassessment) => (
                <div key={reassessment.id} className="rf-reassessment">
                  <h4>Coverage reassessment · Zone {reassessment.zoneId}</h4>
                  <p>{reassessment.outcome}</p>
                  <ul>
                    {reassessment.alternatives.map((alternative) => (
                      <li key={alternative.label} className={`is-${alternative.state}`}>
                        <span>{alternative.state === 'available' ? 'Available' : 'Rejected'}</span>
                        <div>
                          <strong>{alternative.label}</strong>
                          <small>{alternative.detail}</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="rf-reassessment__result">
                    Replacement hardware available: {reassessment.replacementAvailable ? 'Yes' : 'No'} · Coverage
                    restored: {reassessment.coverageRestored ? 'Yes' : 'No'}
                  </p>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="panel rf-report-section" aria-labelledby="rf-report-verification">
          <div className="rf-report-section__head">
            <h3 id="rf-report-verification">Human verification and extraction</h3>
            <span>{state.verifications.length} verified</span>
          </div>
          {state.verifications.length === 0 ? (
            <p className="rf-empty">No human verification recorded. Candidate signals remain unverified.</p>
          ) : (
            <ul className="rf-verification-list">
              {state.verifications.map((verification) => (
                <li key={verification.id}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  <div>
                    <strong>
                      Zone {verification.zoneId} · Human Verified
                    </strong>
                    <p>
                      {verification.confirmedBy} · {verification.method} ·{' '}
                      {formatClock(missionTime(state, verification.confirmedAt))}
                    </p>
                    <small>Independent confirmation recorded from personnel; not a sensor-only conclusion.</small>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {state.extraction ? (
            <div className="rf-extraction-record">
              <Stethoscope size={16} aria-hidden="true" />
              <div>
                <strong>Extraction · Zone {state.extraction.zoneId}</strong>
                <p>{state.extraction.medicalSupport}</p>
                <p>{state.extraction.transportStatus}</p>
                <small>Mission time {formatClock(missionTime(state, state.extraction.completedAt))}</small>
              </div>
            </div>
          ) : (
            <p className="rf-empty">Extraction has not been recorded in this run.</p>
          )}
        </section>
      </div>

      <section className="panel rf-report-section" aria-labelledby="rf-report-ledger">
        <div className="rf-report-section__head">
          <h3 id="rf-report-ledger">Evidence ledger</h3>
          <span>{state.events.length} chronological events</span>
        </div>
        <ol className="rf-report-timeline">
          {state.events.map((event) => (
            <li key={event.id}>
              <span className="rf-report-timeline__time">{formatClock(missionTime(state, event.at))}</span>
              <span className={`rf-tone-dot rf-tone-dot--${event.tone}`} aria-hidden="true" />
              <div>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
              </div>
              <span className="rf-report-timeline__ref">
                {event.zoneId ? `Zone ${event.zoneId}` : event.type}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel rf-report-section" aria-labelledby="rf-report-limits">
        <div className="rf-report-section__head">
          <h3 id="rf-report-limits">Limitations and honest scope</h3>
          <span>Required reading</span>
        </div>
        <ul className="rf-limit-list">
          <li>Sensor events, readings and timings are pre-programmed examples, not measurements from hardware.</li>
          <li>The simulation does not demonstrate real radar penetration through concrete or rubble.</li>
          <li>It does not demonstrate validated survivor detection, measured accuracy, precision, recall or field performance.</li>
          <li>It does not use or demonstrate a trained machine-learning model.</li>
          <li>Human Verified is recorded only after explicit human confirmation. Sensor data alone cannot set it.</li>
          <li>Battery telemetry is unavailable. Battery values are shown as N/A rather than invented.</li>
          <li>A failed sensor yields Unverified, never “no survivor”. Missing coverage is not negative evidence.</li>
          <li>Zone B remains Needs Verification in the default path; the example records one verified survivor, not two.</li>
        </ul>
        <div className="rf-report-disclaimer">
          <ClipboardList size={15} aria-hidden="true" />
          <p>{SIMULATION_DISCLAIMER}</p>
        </div>
      </section>

      <p className="rf-final-line">
        RF FENSE <span>—</span> Beyond Detection, Towards Reliable Rescue Search.
      </p>
    </div>
  )
}
