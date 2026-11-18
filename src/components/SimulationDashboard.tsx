import { WorkflowSidebar } from './WorkflowSidebar'
import { MissionHeader, ModeCard } from './MissionHeader'
import { ViewportPanel } from './ViewportPanel'
import { SimulationBar } from './SimulationBar'
import { SensorCards } from './SensorCards'
import { DetectionResults } from './DetectionResults'
import { EstimatedLocation } from './EstimatedLocation'
import { MissionStatus } from './MissionStatus'

export function SimulationDashboard() {
  return (
    <main id="main-content" className="app-main">
      <div className="dashboard-grid">
        <WorkflowSidebar />

        <div className="center-column">
          <MissionHeader />
          <ViewportPanel />
          <SimulationBar />
          <SensorCards />
        </div>

        <div className="right-column">
          <ModeCard />
          <div className="right-rail">
            <DetectionResults />
            <EstimatedLocation />
            <MissionStatus />
          </div>
        </div>
      </div>
    </main>
  )
}
