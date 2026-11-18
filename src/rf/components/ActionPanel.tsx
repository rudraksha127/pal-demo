import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDashed,
  Crosshair,
  FileText,
  Gauge,
  LoaderCircle,
  MapPin,
  Play,
  Radar,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useRfFense } from '../RfFenseContext'
import {
  REASSESSMENT_ALTERNATIVES,
  SENSOR_TYPES,
  ZONES,
  sensorMeta,
} from '../data'
import { connectedNodeForZone, formatClock, latestObservationForZone, missionTime } from '../engine'
import type { SafetyCheckState, SensorType } from '../types'
import { StatusBadge } from './common'

function Control({
  id,
  label,
  icon,
  onClick,
  disabled,
  reason,
  primary = false,
  danger = false,
}: {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  disabled: boolean
  reason?: string
  primary?: boolean
  danger?: boolean
}) {
  return (
    <div className="rf-control">
      <button
        type="button"
        className={`${primary ? 'primary-button' : 'secondary-button'} rf-control__button${
          danger ? ' rf-control__button--danger' : ''
        }`}
        onClick={onClick}
        disabled={disabled}
        aria-describedby={reason ? `${id}-reason` : undefined}
        data-control={id}
      >
        {icon}
        <span>{label}</span>
      </button>
      {reason && (
        <p className="rf-control__reason" id={`${id}-reason`}>
          {reason}
        </p>
      )}
    </div>
  )
}

function StepList({
  steps,
}: {
  steps: Array<{ label: string; detail: string; done: boolean; active?: boolean }>
}) {
  return (
    <ol className="rf-steps">
      {steps.map((step) => (
        <li
          key={step.label}
          className={`rf-steps__item${step.done ? ' is-done' : ''}${step.active ? ' is-active' : ''}`}
        >
          <span className="rf-steps__mark" aria-hidden="true">
            {step.done ? <Check size={11} /> : <CircleDashed size={11} />}
          </span>
          <span>
            <strong>{step.label}</strong>
            <small>{step.detail}</small>
          </span>
        </li>
      ))}
    </ol>
  )
}

const CHECK_LABEL: Record<SafetyCheckState, string> = {
  pending: 'Pending',
  clear: 'Clear',
  controlled: 'Controlled',
  hazard: 'Hazard',
}

export function ActionPanel() {
  const {
    state,
    scene,
    busy,
    triggerEarthquake,
    runSafetyAssessment,
    markSafeAreas,
    confirmZones,
    setSensorType,
    deploySensors,
    connectGateway,
    startScan,
    simulateSensorFailure,
    reassessCoverage,
    rescanZone,
    openVerification,
    completeExtraction,
    generateReport,
    setTab,
    restartSimulation,
  } = useRfFense()

  const busyReason = busy ? `${busy.label}. Please wait for this step to finish.` : undefined
  const zA = state.zones.find((zone) => zone.id === 'A')
  const zB = state.zones.find((zone) => zone.id === 'B')
  const zC = state.zones.find((zone) => zone.id === 'C')
  const failedNode = state.nodes.find((node) => state.failureNodes.includes(node.id))
  const verifiedZone = state.verifications[state.verifications.length - 1]?.zoneId ?? null
  const rescannedA = state.observations.some(
    (observation) => observation.zoneId === 'A' && observation.observationType === 'no_candidate',
  )
  const rescannedB = state.observations.some(
    (observation) => observation.zoneId === 'B' && observation.observationType === 'no_candidate',
  )
  const checkedNodes = state.nodes.filter((node) =>
    state.observations.some((observation) => observation.sensorId === node.id),
  ).length
  const failureTarget = state.nodes.find((node) => node.sequence === 3) ?? failedNode

  return (
    <section className="rf-actions panel" aria-label="Scene controls">
      <div className="rf-actions__head">
        <div>
          <p className="rf-eyebrow">Scene controls</p>
          <h2>Next action</h2>
        </div>
        <span className="rf-gate-pill">
          <ShieldCheck size={12} aria-hidden="true" />
          Gated
        </span>
      </div>

      {busy && (
        <div className="rf-actions__busy" role="status" aria-live="polite">
          <LoaderCircle size={14} className="rf-spin" aria-hidden="true" />
          <span>{busy.label}</span>
        </div>
      )}

      {scene === 1 && (
        <>
          <p className="rf-actions__lead">
            The building is operating normally. Starting the scenario registers the incident and runs the
            earthquake and collapse sequence.
          </p>
          <Control
            id="trigger-earthquake"
            label="Trigger Earthquake"
            icon={<Siren size={15} />}
            onClick={triggerEarthquake}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
          />
          <StepList
            steps={[
              { label: 'Normal building', detail: 'Five occupied floors, no incident.', done: true },
              { label: 'Earthquake', detail: 'Staged seismic event.', done: false, active: true },
              { label: 'Collapse', detail: 'Progressive east-wing failure.', done: false },
              { label: 'Rescue arrival', detail: 'Safety assessment required before deployment.', done: false },
            ]}
          />
        </>
      )}

      {scene === 2 && (
        <>
          <p className="rf-actions__lead">
            The staged collapse sequence is running. This scene advances automatically; no intervention is
            possible while the structure is moving.
          </p>
          <Control
            id="collapse-running"
            label={busy ? 'Collapse sequence running' : 'Collapse sequence'}
            icon={busy ? <LoaderCircle size={15} className="rf-spin" /> : <Siren size={15} />}
            onClick={() => undefined}
            disabled
            reason={busy ? busyReason : 'Waiting for rescue arrival before the safety assessment can begin.'}
            primary
          />
          <StepList
            steps={[
              {
                label: 'Earthquake registered',
                detail: state.incident.earthquakeAt ? 'Scene 2 started.' : 'Pending.',
                done: state.incident.earthquakeAt !== null,
              },
              {
                label: 'Progressive collapse',
                detail: state.incident.collapseCompleteAt ? 'Rubble field established.' : 'Structure is failing.',
                done: state.incident.collapseCompleteAt !== null,
                active: state.incident.collapseAt !== null && state.incident.collapseCompleteAt === null,
              },
              {
                label: 'Rescue team arrival',
                detail: state.incident.rescueArrivalAt ? 'Team at the perimeter.' : 'Awaiting arrival.',
                done: state.incident.rescueArrivalAt !== null,
              },
            ]}
          />
        </>
      )}

      {scene === 3 && (
        <>
          <p className="rf-actions__lead">
            Structural, fire, electrical and access hazards must be assessed before anyone or any sensor enters
            the site.
          </p>
          {!state.safety.completedAt && (
            <Control
              id="complete-safety-assessment"
              label="Complete Safety Assessment"
              icon={<ShieldAlert size={15} />}
              onClick={runSafetyAssessment}
              disabled={Boolean(busy)}
              reason={busyReason}
              primary
            />
          )}
          {state.safety.completedAt && !state.safety.markedAt && (
            <Control
              id="mark-safe-areas"
              label="Mark Approved Safe Areas"
              icon={<MapPin size={15} />}
              onClick={markSafeAreas}
              disabled={Boolean(busy)}
              reason={busyReason}
              primary
            />
          )}
          <ul className="rf-checks">
            {state.safety.checks.map((check) => (
              <li key={check.id}>
                <span className={`rf-check-state rf-check-state--${check.state}`}>{CHECK_LABEL[check.state]}</span>
                <span>
                  <strong>{check.label}</strong>
                  <small>{check.result}</small>
                </span>
              </li>
            ))}
          </ul>
          {state.safety.markedAt && (
            <div className="rf-area-chips">
              {state.safety.areas.map((area) => (
                <span key={area.id} className={`rf-area-chip rf-area-chip--${area.state}`}>
                  {area.id} · {area.state === 'safe' ? 'approved' : 'rejected'}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {scene === 4 && (
        <>
          <p className="rf-actions__lead">
            Divide the accessible area into three example search zones. Every zone begins as Not Checked; a status
            only changes after a valid gateway-accepted observation.
          </p>
          <Control
            id="confirm-search-zones"
            label="Confirm Search Zones"
            icon={<Crosshair size={15} />}
            onClick={confirmZones}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
          />
          <div className="rf-zone-preview">
            {ZONES.map((zone) => (
              <div key={zone.id}>
                <span className="rf-zone-letter">{zone.id}</span>
                <span>
                  <strong>{zone.name}</strong>
                  <small>
                    {zone.safeAreaIds.join(', ')} · No scan yet
                  </small>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {scene === 5 && (
        <>
          <p className="rf-actions__lead">
            Assign one illustrative sensor type to each approved safe area. Node positions are fixed by the safety
            assessment; changing hardware does not create a new access route.
          </p>
          <div className="rf-configs">
            {state.sensorConfigs.map((config) => {
              const meta = sensorMeta(config.sensorType)
              return (
                <div key={config.key} className="rf-config">
                  <div className="rf-config__top">
                    <strong>
                      Zone {config.zoneId} · {config.safeAreaId}
                    </strong>
                    <span>{meta.role}</span>
                  </div>
                  <label className="rf-field">
                    <span>Sensor type</span>
                    <select
                      value={config.sensorType}
                      onChange={(event) => setSensorType(config.key, event.target.value as SensorType)}
                      disabled={Boolean(busy)}
                      data-control={`sensor-type-${config.zoneId}`}
                    >
                      {SENSOR_TYPES.map((sensor) => (
                        <option key={sensor.id} value={sensor.id}>
                          {sensor.label} · {sensor.role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="rf-config__limit">{meta.limitation}</p>
                </div>
              )
            })}
          </div>
          <Control
            id="deploy-sensor-nodes"
            label="Deploy Sensor Nodes"
            icon={<Play size={15} />}
            onClick={deploySensors}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
          />
          <p className="rf-hint">Battery telemetry is not provided in this simulation, so battery status is shown as N/A.</p>
          <p className="rf-hint">
            Sensor selection is illustrative: it changes the hardware label only and does not alter the
            pre-programmed observations or outcomes.
          </p>
        </>
      )}

      {scene === 6 && (
        <>
          <p className="rf-actions__lead">
            The gateway validates node identity, zone configuration, timestamp, health, signal quality and
            duplicate messages before accepting an observation.
          </p>
          {!state.gateway.online ? (
            <Control
              id="connect-gateway"
              label="Connect Central Gateway"
              icon={<Radar size={15} />}
              onClick={connectGateway}
              disabled={Boolean(busy)}
              reason={busyReason}
              primary
            />
          ) : (
            <>
              <div className="rf-gateway-checks">
                {[
                  ['Node registration', `${state.nodes.length} nodes registered`],
                  ['Zone configuration', 'A1, B1 and C1 match approved areas'],
                  ['Timestamp ordering', 'Gateway clock synchronized'],
                  ['Health and signal', 'Nominal at check time'],
                  ['Duplicate detection', '0 duplicates at check'],
                ].map(([label, detail]) => (
                  <div key={label}>
                    <Check size={12} aria-hidden="true" />
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </div>
                ))}
              </div>
              {state.scanning.startedAt === null && (
                <Control
                  id="start-initial-scan"
                  label="Start Initial Scan"
                  icon={<ScanLine size={15} />}
                  onClick={startScan}
                  disabled={Boolean(busy)}
                  reason={busyReason}
                  primary
                />
              )}
            </>
          )}
        </>
      )}

      {scene === 7 && (
        <>
          <p className="rf-actions__lead">
            Observations are arriving one node at a time. Each payload is validated before it can change a zone
            status. The scan advances automatically.
          </p>
          <div className="rf-scan-progress">
            <div>
              <span>Messages processed</span>
              <strong>
                {checkedNodes} / {state.nodes.length}
              </strong>
            </div>
            <div className="rf-scan-progress__bar" aria-hidden="true">
              <span style={{ width: `${state.nodes.length ? (checkedNodes / state.nodes.length) * 100 : 0}%` }} />
            </div>
            <p>
              {state.scanning.activeNodeId
                ? `Receiving from ${state.scanning.activeNodeId}…`
                : 'Finalising message validation…'}
            </p>
          </div>
          <Control
            id="scan-in-progress"
            label="Collecting observations"
            icon={<LoaderCircle size={15} className="rf-spin" />}
            onClick={() => undefined}
            disabled
            reason="Scanning is automatic. Wait for the gateway to finish processing every connected node."
            primary
          />
        </>
      )}

      {scene === 8 && (
        <>
          <p className="rf-actions__lead">
            The initial scan is complete. Review the dashboard, then simulate the pre-programmed failure of the
            designated node to see how coverage loss is handled.
          </p>
          <div className="rf-mini-metrics">
            <div>
              <span>Candidate zones</span>
              <strong>{state.zones.filter((zone) => zone.status === 'possible_survivor' || zone.status === 'needs_verification').length}</strong>
            </div>
            <div>
              <span>Unverified</span>
              <strong>{state.zones.filter((zone) => zone.status === 'unverified').length}</strong>
            </div>
            <div>
              <span>Dropped messages</span>
              <strong>{state.gateway.droppedMessages}</strong>
            </div>
          </div>
          <Control
            id="open-rescue-dashboard"
            label="Review Rescue Dashboard"
            icon={<Gauge size={15} />}
            onClick={() => setTab('dashboard')}
            disabled={Boolean(busy)}
            reason={busyReason}
          />
          <Control
            id="simulate-sensor-failure"
            label={`Simulate Sensor Failure${failureTarget ? ` · ${failureTarget.id}` : ''}`}
            icon={<AlertTriangle size={15} />}
            onClick={simulateSensorFailure}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
            danger
          />
          <p className="rf-hint">
            Failure is injected at the designated node. Its assigned zone will remain Unverified; failure is never
            interpreted as an empty area.
          </p>
        </>
      )}

      {scene === 9 && (
        <>
          <p className="rf-actions__lead">
            Coverage was lost after the initial scan. Reassess whether a safe alternative measurement position or
            replacement node can restore coverage for the affected zone.
          </p>
          {failedNode && (
            <div className="rf-alert-card">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                <strong>
                  {failedNode.id} offline · Zone {failedNode.zoneId}
                </strong>
                <small>Battery: N/A · Signal: unknown · Zone remains Unverified</small>
              </span>
            </div>
          )}
          <Control
            id="reassess-coverage"
            label="Reassess Coverage Options"
            icon={<Wrench size={15} />}
            onClick={reassessCoverage}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
          />
          <ul className="rf-alternatives">
            {REASSESSMENT_ALTERNATIVES.map((alternative) => (
              <li key={alternative.label} className={`is-${alternative.state}`}>
                <span>{alternative.state === 'available' ? 'Available' : 'Rejected'}</span>
                <div>
                  <strong>{alternative.label}</strong>
                  <small>{alternative.detail}</small>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {scene === 10 && (
        <>
          <p className="rf-actions__lead">
            A candidate signal is not a survivor. Review the affected zones, rescan where coverage exists, and
            record independent human verification only after personnel have confirmed the candidate.
          </p>

          <div className="rf-candidate-grid">
            {[zA, zB].map((zone) =>
              zone ? (
                <div key={zone.id} className="rf-candidate-card">
                  <div>
                    <span className="rf-zone-letter">{zone.id}</span>
                    <strong>{zone.name}</strong>
                  </div>
                  <StatusBadge status={zone.status} compact />
                  <small>
                    {latestObservationForZone(state, zone.id)
                      ? `Last result ${formatClock(
                          missionTime(state, latestObservationForZone(state, zone.id)!.timestamp),
                        )}`
                      : 'No observation'}
                  </small>
                </div>
              ) : null,
            )}
          </div>

          <div className="rf-control-row">
            <Control
              id="rescan-zone-A"
              label="Rescan Zone A"
              icon={<ScanLine size={14} />}
              onClick={() => rescanZone('A')}
              disabled={Boolean(busy) || rescannedA || !connectedNodeForZone(state, 'A')}
              reason={
                rescannedA
                  ? 'Rescan completed. Prior candidate observation remains on record for verification.'
                  : !connectedNodeForZone(state, 'A')
                    ? 'No connected node covers Zone A.'
                    : busyReason
              }
            />
            <Control
              id="rescan-zone-B"
              label="Rescan Zone B"
              icon={<ScanLine size={14} />}
              onClick={() => rescanZone('B')}
              disabled={Boolean(busy) || rescannedB || !connectedNodeForZone(state, 'B')}
              reason={
                rescannedB
                  ? 'Rescan completed. Zone B remains ambiguous and still needs human investigation.'
                  : !connectedNodeForZone(state, 'B')
                    ? 'No connected node covers Zone B.'
                    : busyReason
              }
            />
          </div>

          <Control
            id="rescan-zone-C"
            label="Rescan Zone C"
            icon={<ScanLine size={14} />}
            onClick={() => rescanZone('C')}
            disabled
            reason={`No connected node covers Zone ${zC?.id ?? 'C'}. Rescanning cannot restore coverage; the zone remains Unverified.`}
          />

          <Control
            id="open-human-verification"
            label="Record Human Verification · Zone A"
            icon={<ShieldCheck size={15} />}
            onClick={() => openVerification('A')}
            disabled={Boolean(busy) || zA?.status !== 'possible_survivor'}
            reason={
              zA?.status !== 'possible_survivor'
                ? 'Zone A is not awaiting verification.'
                : busyReason
            }
            primary
          />
          <p className="rf-hint">
            Zone B remains unresolved in the example path. The demonstration records one human-verified survivor,
            not two.
          </p>
        </>
      )}

      {scene === 11 && (
        <>
          <p className="rf-actions__lead">
            A candidate has been independently verified by rescue personnel. Record the extraction sequence and
            medical handover as simulation events only; no clinical outcome is claimed.
          </p>
          {verifiedZone && (
            <div className="rf-verified-card">
              <ShieldCheck size={17} aria-hidden="true" />
              <span>
                <strong>Zone {verifiedZone} · Human Verified</strong>
                <small>Confirmed by rescue personnel, not inferred from sensor data.</small>
              </span>
            </div>
          )}
          <Control
            id="complete-extraction"
            label="Complete Extraction & Medical Handover"
            icon={<Stethoscope size={15} />}
            onClick={completeExtraction}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
          />
          <p className="rf-hint">
            Medical support and transport are recorded as illustrative workflow events. Outcomes are outside the
            scope of this simulation.
          </p>
        </>
      )}

      {scene === 12 && (
        <>
          <p className="rf-actions__lead">
            The demonstrated rescue is complete. Generate the final report derived from the event ledger, including
            every unresolved zone and the sensor failure.
          </p>
          <Control
            id="generate-final-report"
            label={state.reportGeneratedAt ? 'Open Final Report' : 'Generate Final Search Report'}
            icon={<FileText size={15} />}
            onClick={state.reportGeneratedAt ? () => setTab('report') : generateReport}
            disabled={Boolean(busy)}
            reason={busyReason}
            primary
          />
          <Control
            id="restart-from-report"
            label="Restart Simulation"
            icon={<RotateCcw size={15} />}
            onClick={restartSimulation}
            disabled={Boolean(busy)}
            reason={busyReason}
          />
          <div className="rf-mini-metrics">
            <div>
              <span>Zones</span>
              <strong>{state.zones.length}</strong>
            </div>
            <div>
              <span>Human verified</span>
              <strong>{state.verifications.length}</strong>
            </div>
            <div>
              <span>Unresolved</span>
              <strong>{state.zones.filter((zone) => zone.status !== 'human_verified' && zone.status !== 'checked').length}</strong>
            </div>
          </div>
        </>
      )}

      <div className="rf-actions__foot">
        <span>
          <ArrowRight size={12} aria-hidden="true" />
          {busy ? 'Processing a gated action' : 'All controls act on the shared simulation ledger'}
        </span>
        <button
          type="button"
          className="rf-text-button"
          onClick={restartSimulation}
          disabled={Boolean(busy)}
          data-control="restart-from-scene"
        >
          <RotateCcw size={12} aria-hidden="true" />
          Restart from this scene
        </button>
      </div>
    </section>
  )
}
