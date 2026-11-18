import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, TriangleAlert, X } from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { latestCandidateObservationForZone } from '../engine'
import { StatusBadge } from './common'
import { useDialogFocus } from './useDialogFocus'

const METHODS = [
  'Direct visual contact by rescue personnel',
  'Physical contact and manual confirmation',
  'Direct voice contact by rescue personnel',
]

export function VerificationModal() {
  const { verifyZone, closeVerification, confirmVerification, state, busy } = useRfFense()
  const [method, setMethod] = useState(METHODS[0])
  const [name, setName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useDialogFocus(Boolean(verifyZone), dialogRef)

  useEffect(() => {
    if (verifyZone) {
      setMethod(METHODS[0])
      setName('')
      setConfirmed(false)
    }
  }, [verifyZone])

  useEffect(() => {
    if (!verifyZone) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeVerification()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [verifyZone, closeVerification])

  if (!verifyZone) return null
  const zone = state.zones.find((item) => item.id === verifyZone)
  if (!zone) return null
  const candidate = latestCandidateObservationForZone(state, zone.id)
  const latest = [...state.observations].reverse().find((item) => item.zoneId === zone.id) ?? null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeVerification()
      }}
    >
      <div
        ref={dialogRef}
        className="modal rf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-verify-title"
        aria-describedby="rf-verify-desc"
        tabIndex={-1}
      >
        <div className="modal__head">
          <span className="modal__icon">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="rf-verify-title">Record human verification · Zone {zone.id}</h2>
            <p id="rf-verify-desc">
              This does not turn a sensor reading into a survivor. It records that rescue personnel independently
              confirmed the candidate in the simulated scenario.
            </p>
          </div>
          <button type="button" className="modal__close" onClick={closeVerification} aria-label="Close verification dialog">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="rf-verify-summary">
          <div>
            <span>Zone</span>
            <strong>
              {zone.label} · {zone.name}
            </strong>
          </div>
          <div>
            <span>Current status</span>
            <StatusBadge status={zone.status} compact />
          </div>
          <div>
            <span>Candidate observation</span>
            <strong>{candidate ? `${candidate.id} · ${candidate.sensorId}` : 'None on record'}</strong>
          </div>
          {candidate && <p>{candidate.observationDescription}</p>}
          {latest && candidate && latest.id !== candidate.id && (
            <p className="rf-verify-latest">
              Later rescan {latest.id} ({latest.observationType.replaceAll('_', ' ')}) is also on record. It does not
              erase the candidate above, which remains the observation under human review.
            </p>
          )}
        </div>

        <form
          className="rf-verify-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (!confirmed || !name.trim() || busy) return
            confirmVerification(method, name)
          }}
        >
          <label className="rf-field">
            <span>Verification method</span>
            <select value={method} onChange={(event) => setMethod(event.target.value)} data-control="verification-method">
              {METHODS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="rf-field">
            <span>Confirmed by</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name or role of the person who confirmed"
              autoFocus
              required
              data-control="verification-name"
            />
          </label>

          <label className="rf-checkbox">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              data-control="verification-confirm-checkbox"
            />
            <span>
              I confirm that a human independently verified this candidate in the simulation. I understand this
              status cannot be set from sensor data alone.
            </span>
          </label>

          <div className="rf-verify-warning">
            <TriangleAlert size={14} aria-hidden="true" />
            <p>
              This is a simulated record, not a real rescue. No medical outcome, identity or real-world survivor
              status is claimed.
            </p>
          </div>

          <div className="modal__actions">
            <button type="button" className="secondary-button" onClick={closeVerification}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={!confirmed || !name.trim() || Boolean(busy)}
              data-control="confirm-human-verification"
            >
              <ShieldCheck size={14} aria-hidden="true" />
              Record human verification
            </button>
          </div>
          {!confirmed && <p className="rf-control__reason">Tick the confirmation statement to enable this action.</p>}
        </form>
      </div>
    </div>
  )
}
