import { Info } from 'lucide-react'

export const SIMULATION_DISCLAIMER =
  'This is an illustrative simulation of the proposed RF FENSE workflow. Sensor events and readings are pre-programmed examples unless connected to actual hardware. The simulation does not demonstrate real radar penetration, validated survivor detection, measured accuracy, or trained machine-learning performance.'

export function DisclaimerBanner() {
  return (
    <aside className="rf-disclaimer" role="note" aria-label="Simulation disclaimer">
      <span className="rf-disclaimer__icon" aria-hidden="true">
        <Info size={15} />
      </span>
      <p>
        <strong>Illustrative simulation.</strong> {SIMULATION_DISCLAIMER}
      </p>
    </aside>
  )
}
