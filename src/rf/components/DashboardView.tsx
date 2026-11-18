import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  Gauge,
  Radio,
  Radar,
  ScanLine,
  ShieldCheck,
  Signal,
  Users,
} from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { formatClock, latestObservationForZone, missionTime, zoneStatusDetail } from '../engine'
import { ZONE_STATUS_META, sensorMeta } from '../data'
import { BatteryState, Metric, NodeState, PanelTitle, SignalBars, StatusBadge } from './common'
import { ZoneMap } from './ZoneMap'

const OBS_LABEL: Record<string, string> = {
  possible_survivor: 'Possible survivor candidate',
  needs_verification: 'Needs verification',
  no_candidate: 'No additional candidate',
  communication_error: 'Communication error',
}

export function DashboardView() {
  const { state, report, setTab, openObservation, selectedZone, selectZone } = useRfFense()
  const events = [...state.events]
  const activeZone = state.zones.find((zone) => zone.id === selectedZone) ?? null

  return (
    <div className="rf-dashboard">
      <header className="rf-view-head">
        <div>
          <p className="rf-eyebrow">Rescue dashboard</p>
          <h2>Zone, sensor and gateway state</h2>
          <p>
            Every figure below is derived from the shared simulation ledger. No confidence percentages,
            battery readings or survivor counts are invented.
          </p>
        </div>
        <div className="rf-view-head__actions">
          <button type="button" className="secondary-button" onClick={() => setTab('operation')}>
            <ScanLine size={14} aria-hidden="true" />
            Open operation
          </button>
          <button type="button" className="secondary-button" onClick={() => setTab('report')}>
            <ClipboardList size={14} aria-hidden="true" />
            Open report
          </button>
        </div>
      </header>

      <section className="rf-kpi-grid" aria-label="Key derived metrics">
        <Metric label="Search zones" value={report.totalZones} foot="Example zone grid" icon={<Crosshair size={13} />} />
        <Metric
          label="Valid scans"
          value={report.validScanZones}
          foot="Gateway-accepted measurement zones"
          tone="success"
          icon={<CheckCircle2 size={13} />}
        />
        <Metric
          label="Candidate signals"
          value={report.candidateObservationCount}
          foot={`Across ${report.candidateSignalZones} candidate zone${report.candidateSignalZones === 1 ? '' : 's'}`}
          tone="warning"
          icon={<Activity size={13} />}
        />
        <Metric
          label="Unverified zones"
          value={report.unverifiedZones}
          foot="Not evidence that the area is empty"
          tone="danger"
          icon={<AlertTriangle size={13} />}
        />
        <Metric
          label="Sensor failures"
          value={report.sensorFailures}
          foot={`${report.disconnectedNodes} disconnected node${report.disconnectedNodes === 1 ? '' : 's'}`}
          tone={report.sensorFailures > 0 ? 'danger' : 'muted'}
          icon={<Radar size={13} />}
        />
        <Metric
          label="Human verified"
          value={report.humanVerifiedSurvivors}
          foot="Independently confirmed by personnel"
          tone="success"
          icon={<ShieldCheck size={13} />}
        />
      </section>

      <div className="rf-dashboard__map-row">
        <section className="panel rf-map-panel" aria-label="Site map">
          <PanelTitle
            icon={<Crosshair size={16} />}
            title="Site map"
            aside={<span className="rf-mini-count">Illustrative coordinates</span>}
          />
          <ZoneMap />
          {activeZone && (
            <div className="rf-map-selection">
              <span className="rf-zone-letter">{activeZone.id}</span>
              <div>
                <strong>
                  {activeZone.name} · <StatusBadge status={activeZone.status} compact />
                </strong>
                <p>{zoneStatusDetail(activeZone.status)}</p>
              </div>
              <button type="button" className="rf-text-button" onClick={() => selectZone(null)}>
                Clear
              </button>
            </div>
          )}
          <div className="rf-legend rf-legend--map">
            {Object.entries(ZONE_STATUS_META).map(([status, meta]) => (
              <span key={status}>
                <i style={{ background: meta.color }} aria-hidden="true" />
                {meta.label}
              </span>
            ))}
          </div>
        </section>

        <section className="panel rf-gateway-panel" aria-label="Central gateway">
          <PanelTitle
            icon={<Radio size={16} />}
            title="Central gateway"
            aside={
              <span className={`rf-connection ${state.gateway.online ? 'is-online' : 'is-offline'}`}>
                <i aria-hidden="true" />
                {state.gateway.online ? 'Online' : 'Offline'}
              </span>
            }
          />
          <dl className="rf-facts">
            <div>
              <dt>Messages received</dt>
              <dd>{state.gateway.messagesReceived}</dd>
            </div>
            <div>
              <dt>Rejected payloads</dt>
              <dd>{state.gateway.droppedMessages}</dd>
            </div>
            <div>
              <dt>Last contact</dt>
              <dd>
                {state.gateway.lastMessageAt === null
                  ? '—'
                  : formatClock(missionTime(state, state.gateway.lastMessageAt))}
              </dd>
            </div>
            <div>
              <dt>Zone config</dt>
              <dd>{state.gateway.zoneConfigReceivedAt === null ? 'Not received' : 'Received'}</dd>
            </div>
            <div>
              <dt>Battery telemetry</dt>
              <dd>N/A</dd>
            </div>
          </dl>
          <p className="rf-gateway-message">{state.gateway.lastMessage}</p>
          <div className="rf-gateway-rule">
            <ShieldCheck size={13} aria-hidden="true" />
            <p>
              A rejected payload cannot change a zone to <strong>Checked</strong>. If no valid measurement is
              available, the zone stays <strong>Unverified</strong>.
            </p>
          </div>
        </section>
      </div>

      <section className="panel rf-table-panel" aria-labelledby="rf-zone-table-title">
        <PanelTitle icon={<Crosshair size={16} />} title="Zone status" />
        <div className="rf-table-wrap">
          <table className="rf-table">
            <caption id="rf-zone-table-title" className="rf-sr-only">
              Zone status derived from accepted observations
            </caption>
            <thead>
              <tr>
                <th scope="col">Zone</th>
                <th scope="col">Status</th>
                <th scope="col">Assigned node</th>
                <th scope="col">Latest observation</th>
                <th scope="col">Meaning</th>
                <th scope="col">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {state.zones.map((zone) => {
                const node = state.nodes.find((item) => item.zoneId === zone.id && item.health !== 'offline')
                const observation = latestObservationForZone(state, zone.id)
                return (
                  <tr key={zone.id} className={selectedZone === zone.id ? 'is-selected' : ''}>
                    <th scope="row">
                      <button
                        type="button"
                        className="rf-zone-table-button"
                        onClick={() => selectZone(selectedZone === zone.id ? null : zone.id)}
                      >
                        <span className="rf-zone-letter">{zone.id}</span>
                        <span>
                          <strong>{zone.name}</strong>
                          <small>Safe area {zone.safeAreaIds.join(', ')}</small>
                        </span>
                      </button>
                    </th>
                    <td>
                      <StatusBadge status={zone.status} compact />
                    </td>
                    <td className="rf-mono">{node?.id ?? '—'}</td>
                    <td>
                      {observation ? (
                        <>
                          <strong>{OBS_LABEL[observation.observationType]}</strong>
                          <small className="rf-cell-sub">
                            {formatClock(missionTime(state, observation.timestamp))} ·{' '}
                            {observation.accepted ? 'accepted' : 'rejected'}
                          </small>
                        </>
                      ) : (
                        <span className="rf-muted">No measurement</span>
                      )}
                    </td>
                    <td className="rf-cell-copy">{zoneStatusDetail(zone.status)}</td>
                    <td>
                      {observation ? (
                        <button
                          type="button"
                          className="rf-text-button"
                          onClick={() => openObservation(observation.id)}
                        >
                          Review
                        </button>
                      ) : (
                        <span className="rf-muted">None</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="rf-table-note">
          <AlertTriangle size={12} aria-hidden="true" />
          Zone C is shown as Unverified when its node fails. The UI never converts missing data into “no survivor”.
        </p>
      </section>

      <div className="rf-dashboard__split">
        <section className="panel rf-table-panel" aria-labelledby="rf-node-table-title">
          <PanelTitle icon={<Radar size={16} />} title="Sensor nodes" />
          {state.nodes.length === 0 ? (
            <p className="rf-empty">No nodes deployed yet. Deployment becomes available in Scene 5.</p>
          ) : (
            <div className="rf-table-wrap">
              <table className="rf-table rf-table--nodes">
                <caption id="rf-node-table-title" className="rf-sr-only">
                  Deployed sensor node status and battery availability
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Node</th>
                    <th scope="col">Sensor</th>
                    <th scope="col">Zone / area</th>
                    <th scope="col">Health</th>
                    <th scope="col">Signal</th>
                    <th scope="col">Battery</th>
                    <th scope="col">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {state.nodes.map((node) => (
                    <tr key={node.id} className={state.failureNodes.includes(node.id) ? 'is-failed' : ''}>
                      <th scope="row" className="rf-mono">
                        {node.id}
                      </th>
                      <td>{sensorMeta(node.sensorType).label}</td>
                      <td>
                        Zone {node.zoneId} · {node.safeAreaId}
                      </td>
                      <td>
                        <NodeState node={node} />
                      </td>
                      <td>
                        <SignalBars quality={node.signalQuality} />
                      </td>
                      <td>
                        <BatteryState node={node} />
                      </td>
                      <td>
                        {node.lastSeenAt === null
                          ? '—'
                          : formatClock(missionTime(state, node.lastSeenAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel rf-alerts-panel" aria-label="Persistent alerts">
          <PanelTitle
            icon={<AlertTriangle size={16} />}
            title="Alerts"
            aside={<span className="rf-mini-count">{state.alerts.length} persistent</span>}
          />
          {state.alerts.length === 0 ? (
            <p className="rf-empty">No alerts recorded. Sensor and communication faults will remain visible here.</p>
          ) : (
            <ul className="rf-alert-list">
              {state.alerts.map((alert) => (
                <li key={alert.id} className={`rf-alert-item rf-alert-item--${alert.severity}`}>
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>
                    <strong>{alert.title}</strong>
                    <small>{alert.message}</small>
                    <em>
                      {formatClock(missionTime(state, alert.at))}
                      {alert.nodeId ? ` · ${alert.nodeId}` : ''}
                    </em>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="rf-honesty">
            <Users size={14} aria-hidden="true" />
            <p>
              An alert about a failed sensor describes missing coverage. It does not describe an empty area, and
              it never marks a zone as checked.
            </p>
          </div>
        </section>
      </div>

      <section className="panel rf-ledger" aria-labelledby="rf-ledger-title">
        <PanelTitle
          icon={<Gauge size={16} />}
          title="Chronological event ledger"
          aside={
            <span className="rf-mini-count">
              {state.events.length} events · {state.observations.length} observations
            </span>
          }
        />
        <h3 id="rf-ledger-title" className="rf-sr-only">
          Chronological event ledger
        </h3>
        <div className="rf-ledger__scroll">
          <table className="rf-table rf-table--ledger">
            <caption className="rf-sr-only">All simulation events in chronological order</caption>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Type</th>
                <th scope="col">Event</th>
                <th scope="col">Detail</th>
                <th scope="col">Zone / node</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="rf-mono">{formatClock(missionTime(state, event.at))}</td>
                  <td>
                    <span className={`rf-type-chip rf-type-chip--${event.tone}`}>{event.type}</span>
                  </td>
                  <td>
                    <strong>{event.title}</strong>
                  </td>
                  <td className="rf-cell-copy">{event.detail}</td>
                  <td className="rf-mono">
                    {event.zoneId ? `Zone ${event.zoneId}` : ''}
                    {event.zoneId && event.nodeId ? ' · ' : ''}
                    {event.nodeId ?? ''}
                    {!event.zoneId && !event.nodeId ? '—' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rf-table-note">
          <Signal size={12} aria-hidden="true" />
          Ledger timestamps are mission-relative. All entries are pre-programmed simulation events.
        </p>
      </section>
    </div>
  )
}
