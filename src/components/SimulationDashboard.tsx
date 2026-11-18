import { WorkflowSidebar } from './WorkflowSidebar'
import { MissionHeader, ModeCard } from './MissionHeader'
import { ViewportPanel } from './ViewportPanel'
import { SimulationBar } from './SimulationBar'
import { SensorCards } from './SensorCards'
import { DetectionResults } from './DetectionResults'
import { EstimatedLocation } from './EstimatedLocation'
import { MissionStatus } from './MissionStatus'

interface SimulationDashboardProps {
  showSidebar?: boolean
}

export function SimulationDashboard({ showSidebar = false }: SimulationDashboardProps) {
  return (
    <main id="main-content" className="app-main" style={{ padding: '0 4px 18px' }}>
      <div className={`dashboard-grid${showSidebar ? '' : ' no-sidebar'}`}>
        {showSidebar && <WorkflowSidebar />}

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
