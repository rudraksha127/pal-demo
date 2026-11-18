import { useEffect, useState } from 'react'
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
import { SimulationProvider } from '../state/SimulationContext'
import { SimulationDashboard } from '../components/SimulationDashboard'
import { SettingsDialog } from '../components/modals/SettingsDialog'
import { ShortcutsDialog } from '../components/modals/ShortcutsDialog'

export function RfApp() {
  const { tab, scene } = useRfFense()
  const meta = SCENES[scene - 1]

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [bloomEnabled, setBloomEnabled] = useState(true)
  const [particlesEnabled, setParticlesEnabled] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="rf-app">
      <a className="skip-link" href="#rf-main">
        Skip to mission content
      </a>
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />
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
          {tab === 'building_lab' && (
            <div style={{ padding: '8px 12px' }}>
              <SimulationProvider>
                <SimulationDashboard />
              </SimulationProvider>
            </div>
          )}
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
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        bloomEnabled={bloomEnabled}
        onToggleBloom={setBloomEnabled}
        particlesEnabled={particlesEnabled}
        onToggleParticles={setParticlesEnabled}
      />
      <ShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  )
}
