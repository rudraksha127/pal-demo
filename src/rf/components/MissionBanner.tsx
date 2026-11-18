import { AlertTriangle, Building2, MapPin, Radio, ShieldCheck, Users } from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { SCENES } from '../data'

export function MissionBanner() {
  const { state, scene, phase, report } = useRfFense()
  const meta = SCENES[scene - 1]
  const alerts = state.alerts.length

  return (
    <section className="rf-mission panel" aria-label="Current mission and scene">
      <div className="rf-mission__main">
        <p className="rf-eyebrow">
          {state.incident.id} · {phase}
        </p>
        <h1>{state.incident.name}</h1>
        <p className="rf-mission__address">
          <MapPin size={13} aria-hidden="true" />
          {state.incident.address}
        </p>
        <div className="rf-mission__chips">
          <span>
            <Building2 size={13} aria-hidden="true" />
            {state.incident.structure}
          </span>
          <span>
            <Users size={13} aria-hidden="true" />
            {state.incident.floors} floors
          </span>
          <span>
            <Radio size={13} aria-hidden="true" />
            {report.activeNodes} active node{report.activeNodes === 1 ? '' : 's'}
          </span>
          <span className={state.gateway.online ? 'is-good' : 'is-muted'}>
            <ShieldCheck size={13} aria-hidden="true" />
            Gateway {state.gateway.online ? 'online' : 'offline'}
          </span>
          <span className={alerts > 0 ? 'is-warn' : 'is-muted'}>
            <AlertTriangle size={13} aria-hidden="true" />
            {alerts} alert{alerts === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <div className="rf-mission__scene">
        <div className="rf-mission__scene-top">
          <span className="rf-scene-number">Scene {String(scene).padStart(2, '0')}</span>
          <span
            className={`rf-operation-state ${
              report.operationStatus === 'Completed' ? 'is-complete' : 'is-progress'
            }`}
          >
            Search operation · {report.operationStatus}
          </span>
        </div>
        <h2>{meta.label}</h2>
        <p>{meta.objective}</p>
        <div className="rf-mission__scene-foot">
          <span>Demonstrated rescue · {report.demonstratedRescueStatus}</span>
          <span>{report.unresolvedZones.length} unresolved zone{report.unresolvedZones.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </section>
  )
}
