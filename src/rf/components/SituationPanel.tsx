import {
  AlertTriangle,
  BellRing,
  ChevronRight,
  FileSearch,
  Gauge,
  ListChecks,
  Radio,
} from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { formatClock, latestObservationForZone, missionTime } from '../engine'
import { StatusBadge } from './common'
import { PanelTitle } from './common'

const OBS_LABEL: Record<string, string> = {
  possible_survivor: 'Candidate signal',
  needs_verification: 'Ambiguous signal',
  no_candidate: 'No additional candidate',
  communication_error: 'Communication error',
}

function ToneDot({ tone }: { tone: 'info' | 'success' | 'warning' | 'danger' }) {
  return <i className={`rf-tone-dot rf-tone-dot--${tone}`} aria-hidden="true" />
}

export function SituationPanel() {
  const {
    state,
    selectedZone,
    selectZone,
    openObservation,
    setTab,
  } = useRfFense()

  const activeZone = state.zones.find((zone) => zone.id === selectedZone) ?? null
  const latest = activeZone ? latestObservationForZone(state, activeZone.id) : null
  const recentEvents = [...state.events].slice(-6).reverse()

  return (
    <aside className="rf-situation" aria-label="Situation summary">
      <section className="panel rf-sit-block">
        <PanelTitle
          icon={<ListChecks size={16} />}
          title="Zone status"
          aside={<span className="rf-mini-count">{state.zones.length} zones</span>}
        />
        <div className="rf-zone-list">
          {state.zones.map((zone) => {
            const node = state.nodes.find((item) => item.zoneId === zone.id)
            const observation = latestObservationForZone(state, zone.id)
            const selected = selectedZone === zone.id
            return (
              <button
                key={zone.id}
                type="button"
                className={`rf-zone-row${selected ? ' is-selected' : ''}`}
                onClick={() => selectZone(selected ? null : zone.id)}
                aria-pressed={selected}
                data-control={`select-zone-${zone.id}`}
              >
                <span className="rf-zone-letter" aria-hidden="true">
                  {zone.id}
                </span>
                <span className="rf-zone-row__main">
                  <strong>{zone.name}</strong>
                  <small>
                    {node ? node.id : 'No node'} ·{' '}
                    {observation
                      ? `${OBS_LABEL[observation.observationType] ?? observation.observationType} at ${formatClock(
                          missionTime(state, observation.timestamp),
                        )}`
                      : 'Not checked'}
                  </small>
                </span>
                <StatusBadge status={zone.status} compact />
              </button>
            )
          })}
        </div>

        {activeZone && (
          <div className="rf-zone-detail">
            <div className="rf-zone-detail__head">
              <strong>
                Zone {activeZone.id} · {activeZone.name}
              </strong>
              <StatusBadge status={activeZone.status} compact />
            </div>
            {latest ? (
              <>
                <p>{latest.observationDescription}</p>
                <div className="rf-zone-detail__meta">
                  <span>{latest.sensorId}</span>
                  <span>{latest.accepted ? 'Accepted by gateway' : 'Rejected · no measurement data'}</span>
                  <span>Illustrative</span>
                </div>
                <button
                  type="button"
                  className="rf-text-button"
                  onClick={() => openObservation(latest.id)}
                  data-control={`review-observation-${latest.id}`}
                >
                  <FileSearch size={12} aria-hidden="true" />
                  Review observation and gateway checks
                </button>
              </>
            ) : (
              <p>No observation has been received for this zone. It remains Not Checked.</p>
            )}
            {activeZone.notes.length > 0 && (
              <ul className="rf-note-list">
                {activeZone.notes.slice(-2).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button type="button" className="rf-text-button" onClick={() => setTab('dashboard')}>
          Open full rescue dashboard
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      </section>

      <section className="panel rf-sit-block">
        <PanelTitle
          icon={<BellRing size={16} />}
          title="Persistent alerts"
          aside={<span className="rf-mini-count">{state.alerts.length}</span>}
        />
        {state.alerts.length === 0 ? (
          <p className="rf-muted-note">No persistent alerts. Sensor errors and coverage loss will appear here and remain visible.</p>
        ) : (
          <ul className="rf-alert-list">
            {state.alerts.map((alert) => (
              <li key={alert.id} className={`rf-alert-item rf-alert-item--${alert.severity}`}>
                <AlertTriangle size={14} aria-hidden="true" />
                <span>
                  <strong>{alert.title}</strong>
                  <small>{alert.message}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel rf-sit-block">
        <PanelTitle
          icon={<Radio size={16} />}
          title="Gateway"
          aside={
            <span className={`rf-connection ${state.gateway.online ? 'is-online' : 'is-offline'}`}>
              <i aria-hidden="true" />
              {state.gateway.online ? 'Online' : 'Offline'}
            </span>
          }
        />
        <div className="rf-gateway-mini">
          <div>
            <span>Messages received</span>
            <strong>{state.gateway.messagesReceived}</strong>
          </div>
          <div>
            <span>Rejected</span>
            <strong>{state.gateway.droppedMessages}</strong>
          </div>
          <div>
            <span>Last contact</span>
            <strong>
              {state.gateway.lastMessageAt === null
                ? '—'
                : formatClock(missionTime(state, state.gateway.lastMessageAt))}
            </strong>
          </div>
        </div>
        <p className="rf-gateway-message">{state.gateway.lastMessage}</p>
      </section>

      <section className="panel rf-sit-block">
        <PanelTitle
          icon={<Gauge size={16} />}
          title="Recent ledger events"
          aside={<span className="rf-mini-count">{state.events.length} total</span>}
        />
        <ol className="rf-mini-events">
          {recentEvents.map((event) => (
            <li key={event.id}>
              <span className="rf-mini-events__time">{formatClock(missionTime(state, event.at))}</span>
              <ToneDot tone={event.tone} />
              <span>
                <strong>{event.title}</strong>
                <small>{event.zoneId ? `Zone ${event.zoneId}` : event.type}</small>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  )
}
