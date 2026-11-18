import { useEffect, useRef } from 'react'
import {
  AlertTriangle,
  BatteryMedium,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  X,
  XCircle,
} from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { formatClock, missionTime } from '../engine'
import { sensorMeta } from '../data'
import { IllustrativeTag } from './common'
import { useDialogFocus } from './useDialogFocus'

const RESULT_ICON = {
  pass: CheckCircle2,
  fail: XCircle,
  warning: AlertTriangle,
}

export function ObservationModal() {
  const { state, reviewObservationId, openObservation } = useRfFense()
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogFocus(Boolean(reviewObservationId), dialogRef)
  const observation = state.observations.find((item) => item.id === reviewObservationId) ?? null

  useEffect(() => {
    if (!reviewObservationId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') openObservation(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [reviewObservationId, openObservation])

  if (!observation) return null
  const node = state.nodes.find((item) => item.id === observation.sensorId)
  const zone = state.zones.find((item) => item.id === observation.zoneId)

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) openObservation(null)
      }}
    >
      <div
        ref={dialogRef}
        className="modal rf-modal rf-observation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-obs-title"
        aria-describedby="rf-obs-desc"
        tabIndex={-1}
      >
        <div className="modal__head">
          <span className="modal__icon">
            <FileSearch size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="rf-obs-title">Observation {observation.id}</h2>
            <p>
              {observation.sensorId} · Zone {observation.zoneId}
              {zone ? ` · ${zone.name}` : ''}
            </p>
          </div>
          <button type="button" className="modal__close" onClick={() => openObservation(null)} aria-label="Close observation review">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="rf-obs-badges">
          <IllustrativeTag />
          <span className={`rf-observation-result ${observation.accepted ? 'is-accepted' : 'is-rejected'}`}>
            {observation.accepted ? 'Accepted by gateway' : 'Rejected · no measurement payload'}
          </span>
          <span className="rf-obs-time">{formatClock(missionTime(state, observation.timestamp))}</span>
        </div>

        <p className="rf-obs-description" id="rf-obs-desc">
          {observation.observationDescription}
        </p>

        <dl className="rf-facts rf-facts--grid">
          <div>
            <dt>Observation type</dt>
            <dd>{observation.observationType.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt>Signal quality</dt>
            <dd>{observation.signalQuality}</dd>
          </div>
          <div>
            <dt>Sensor health</dt>
            <dd>{observation.sensorHealth}</dd>
          </div>
          <div>
            <dt>Connection</dt>
            <dd>{observation.connectionStatus}</dd>
          </div>
          <div>
            <dt>Sensor</dt>
            <dd>{node ? `${node.id} · ${sensorMeta(node.sensorType).label}` : observation.sensorId}</dd>
          </div>
          <div>
            <dt>Battery</dt>
            <dd className="rf-battery">
              <BatteryMedium size={13} aria-hidden="true" /> N/A
            </dd>
          </div>
        </dl>

        <div className="rf-gateway-table">
          <h3>
            <ClipboardList size={14} aria-hidden="true" />
            Gateway validation
          </h3>
          <ul>
            {observation.gatewayChecks.map((check) => {
              const Icon = RESULT_ICON[check.result]
              return (
                <li key={check.key} className={`is-${check.result}`}>
                  <Icon size={14} aria-hidden="true" />
                  <div>
                    <strong>{check.label}</strong>
                    <small>{check.detail}</small>
                  </div>
                  <span>{check.result}</span>
                </li>
              )
            })}
          </ul>
        </div>

        {!observation.accepted && (
          <div className="rf-verify-warning">
            <AlertTriangle size={14} aria-hidden="true" />
            <p>
              This payload contained no usable measurement. The zone stays Unverified. A communication error is
              not evidence that the area is empty.
            </p>
          </div>
        )}

        <p className="rf-obs-footnote">
          Pre-programmed illustrative observation. This record does not demonstrate real radar penetration,
          validated survivor detection or measured accuracy.
        </p>

        <div className="modal__actions">
          <button type="button" className="secondary-button" onClick={() => openObservation(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
