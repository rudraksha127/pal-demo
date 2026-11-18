import { ActionPanel } from './ActionPanel'
import { RfViewport } from './RfScene3D'
import { SituationPanel } from './SituationPanel'

export function OperationView() {
  return (
    <div className="rf-operation">
      <div className="rf-operation__stage">
        <RfViewport />
      </div>
      <div className="rf-operation__side">
        <ActionPanel />
        <SituationPanel />
      </div>
    </div>
  )
}
