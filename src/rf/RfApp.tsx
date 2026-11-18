import { DisclaimerBanner } from './components/DisclaimerBanner'
import { TopBar } from './components/TopBar'
import { WorkflowRail } from './components/WorkflowRail'
import { MissionBanner } from './components/MissionBanner'
import { OperationView } from './components/OperationView'
import { DashboardView } from './components/DashboardView'
import { ReportView } from './components/ReportView'
import { AboutView } from './components/AboutView'
import { VerificationModal } from './components/VerificationModal'
import { ObservationModal } from './components/ObservationModal'
import { RfToasts } from './components/RfToasts'
import { useRfFense } from './RfFenseContext'
import { SCENES } from './data'

export function RfApp() {
  const { tab, scene } = useRfFense()
  const meta = SCENES[scene - 1]

  return (
    <div className="rf-app">
      <a className="skip-link" href="#rf-main">
        Skip to mission content
      </a>
      <TopBar />
      <DisclaimerBanner />

      <div className="rf-shell">
        <WorkflowRail />
        <main id="rf-main" className="rf-main">
          <MissionBanner />
          <p className="rf-sr-only" role="status" aria-live="polite">
            Scene {scene} of 12: {meta.label}. {meta.objective}
          </p>
          {tab === 'operation' && <OperationView />}
          {tab === 'dashboard' && <DashboardView />}
          {tab === 'report' && <ReportView />}
          {tab === 'about' && <AboutView />}
        </main>
      </div>

      <footer className="rf-footer">
        <span>RF FENSE · illustrative workflow simulation</span>
        <span>Pre-programmed example data · No hardware connection · Battery telemetry N/A</span>
        <strong>RF FENSE — Beyond Detection, Towards Reliable Rescue Search.</strong>
      </footer>

      <RfToasts />
      <VerificationModal />
      <ObservationModal />
    </div>
  )
}
