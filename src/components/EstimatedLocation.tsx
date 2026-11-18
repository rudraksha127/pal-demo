import { MapPin } from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import { LocationPlot } from './ui/Charts'

export function EstimatedLocation() {
  const { state, scenario } = useSimulation()
  const { location } = state
  const contact = state.evidence >= 60
  const floor = scenario.victim.floor

  return (
    <section className="location-panel panel" aria-label="Estimated location">
      <div className="panel-heading">
        <span className="panel-icon">
          <MapPin size={17} />
        </span>
        <h2>Estimated Location</h2>
      </div>

      <div className="location-body">
        <div className="location-plot">
          <LocationPlot location={location} floor={floor} evidence={state.evidence} />
        </div>
        <dl className="coord-list">
          <div>
            <dt>X</dt>
            <dd>{contact ? `${location.x.toFixed(1)} m` : '—'}</dd>
          </div>
          <div>
            <dt>Y</dt>
            <dd>{contact ? `${location.y.toFixed(1)} m` : '—'}</dd>
          </div>
          <div>
            <dt>Z</dt>
            <dd>{contact ? `${location.z.toFixed(1)} m` : '—'}</dd>
          </div>
          <div>
            <dt>Floor</dt>
            <dd>{contact ? String(floor).padStart(2, '0') : '—'}</dd>
          </div>
          <div className="coord-uncertainty">
            <dt>Uncertainty</dt>
            <dd>±{location.uncertainty.toFixed(1)} m</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
