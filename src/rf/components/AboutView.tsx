import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Radar,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { SIMULATION_DISCLAIMER } from './DisclaimerBanner'
import { SCENES, SENSOR_TYPES, ZONE_STATUS_META } from '../data'

export function AboutView() {
  return (
    <div className="rf-about">
      <header className="rf-view-head">
        <div>
          <p className="rf-eyebrow">About RF FENSE</p>
          <h2>Beyond detection, towards reliable rescue search</h2>
          <p>
            RF FENSE is presented here as an illustrative workflow simulation. It explores how a rescue team could
            configure sensors, validate messages, preserve uncertainty, request independent human verification and
            report unresolved zones honestly.
          </p>
        </div>
        <span className="rf-about__badge">
          <ShieldCheck size={14} aria-hidden="true" />
          Human-in-the-loop by design
        </span>
      </header>

      <div className="rf-about-grid">
        <section className="panel rf-about-card">
          <span className="rf-about-card__icon">
            <Layers size={18} aria-hidden="true" />
          </span>
          <h3>What the simulation demonstrates</h3>
          <ul className="rf-tick-list">
            <li>A 12-scene disaster-to-rescue workflow with gated controls.</li>
            <li>Gateway validation of node identity, zone configuration, timestamps, health, signal quality and duplicates.</li>
            <li>Honest zone states: Unverified and Needs Verification are preserved rather than forced into a binary answer.</li>
            <li>Independent human confirmation before any Human Verified status.</li>
            <li>A chronological ledger from which every dashboard and report figure is derived.</li>
          </ul>
        </section>

        <section className="panel rf-about-card rf-about-card--warning">
          <span className="rf-about-card__icon">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <h3>What it does not demonstrate</h3>
          <ul className="rf-cross-list">
            <li>Real radar penetration through concrete, soil or rubble.</li>
            <li>Validated survivor detection or breathing measurement.</li>
            <li>Measured accuracy, precision, recall, F1 or field performance.</li>
            <li>A trained machine-learning model or inference pipeline.</li>
            <li>Real battery telemetry, medical outcomes or transport status.</li>
          </ul>
        </section>
      </div>

      <section className="panel rf-report-section" aria-labelledby="rf-about-sensors">
        <div className="rf-report-section__head">
          <h3 id="rf-about-sensors">Illustrative sensor roles</h3>
          <span>Purpose and limitation</span>
        </div>
        <div className="rf-sensor-grid">
          {SENSOR_TYPES.map((sensor) => (
            <article key={sensor.id} className="rf-sensor-card">
              <div className="rf-sensor-card__head">
                <Radar size={15} aria-hidden="true" />
                <strong>{sensor.label}</strong>
                <span>{sensor.role}</span>
              </div>
              <p>{sensor.purpose}</p>
              <small>{sensor.limitation}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel rf-report-section" aria-labelledby="rf-about-status">
        <div className="rf-report-section__head">
          <h3 id="rf-about-status">Zone status definitions</h3>
          <span>No status is a claim of certainty beyond its evidence</span>
        </div>
        <div className="rf-status-defs">
          {Object.entries(ZONE_STATUS_META).map(([status, meta]) => (
            <div key={status} className="rf-status-def">
              <span className="rf-status-def__dot" style={{ background: meta.color }} aria-hidden="true" />
              <div>
                <strong>{meta.label}</strong>
                <p>{meta.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rf-honesty">
          <Info size={14} aria-hidden="true" />
          <p>
            A failed sensor produces <strong>Unverified</strong>. It never produces <strong>Checked</strong> or a
            survivor count. Missing coverage is not evidence that an area is empty.
          </p>
        </div>
      </section>

      <section className="panel rf-report-section" aria-labelledby="rf-about-human">
        <div className="rf-report-section__head">
          <h3 id="rf-about-human">Human verification rule</h3>
          <span>Enforced by the workflow</span>
        </div>
        <div className="rf-human-rule">
          <UserCheck size={22} aria-hidden="true" />
          <div>
            <strong>Human Verified requires an explicit human confirmation.</strong>
            <p>
              The verification dialog requires the confirming person and method, plus an explicit confirmation
              that the candidate was verified by rescue personnel. Sensor-only data cannot open or complete this
              step. In the default example, Zone A is verified and Zone B remains unresolved.
            </p>
          </div>
        </div>
      </section>

      <section className="panel rf-report-section" aria-labelledby="rf-about-scenes">
        <div className="rf-report-section__head">
          <h3 id="rf-about-scenes">The twelve scenes</h3>
          <span>Linear, gated workflow</span>
        </div>
        <ol className="rf-scene-list">
          {SCENES.map((scene) => (
            <li key={scene.id}>
              <span>{String(scene.id).padStart(2, '0')}</span>
              <div>
                <strong>{scene.label}</strong>
                <p>{scene.objective}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel rf-about-disclaimer" aria-label="Required disclaimer">
        <div className="rf-report-section__head">
          <h3>Required disclaimer</h3>
          <span>Applies to every view</span>
        </div>
        <p>{SIMULATION_DISCLAIMER}</p>
        <div className="rf-about-facts">
          <span>
            <CheckCircle2 size={13} aria-hidden="true" /> All readings labelled illustrative
          </span>
          <span>
            <XCircle size={13} aria-hidden="true" /> No invented battery values
          </span>
          <span>
            <XCircle size={13} aria-hidden="true" /> No accuracy or ML claims
          </span>
          <span>
            <ShieldCheck size={13} aria-hidden="true" /> Human confirmation required
          </span>
        </div>
      </section>

      <p className="rf-final-line">
        RF FENSE <span>—</span> Beyond Detection, Towards Reliable Rescue Search.
      </p>
    </div>
  )
}
