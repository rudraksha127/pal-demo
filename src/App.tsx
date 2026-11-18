import { SimulationProvider, useSimulation } from './state/SimulationContext'
import { TopBar } from './components/TopBar'
import { SimulationDashboard } from './components/SimulationDashboard'
import { AnalysisView } from './components/AnalysisView'
import { ReportView } from './components/ReportView'
import { ScenariosView } from './components/ScenariosView'
import { Toasts } from './components/Toasts'
import { RfApp } from './rf/RfApp'

function MainContent() {
  const { ui } = useSimulation()

  switch (ui.tab) {
    case 'simulation':
      return <SimulationDashboard />
    case 'analysis':
      return <AnalysisView />
    case 'report':
      return <ReportView />
    case 'scenarios':
      return <ScenariosView />
    case 'rffense':
      return <RfApp />
    default:
      return <SimulationDashboard />
  }
}

function AppShell() {
  const { ui, setTab } = useSimulation()

  if (ui.tab === 'rffense') {
    return (
      <div className="rf-container" style={{ position: 'relative' }}>
        <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 9999 }}>
          <button
            className="primary-button"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'var(--color-emerald-bright)',
              color: '#022c17',
              boxShadow: '0 0 16px rgba(45, 240, 138, 0.4)',
            }}
            onClick={() => setTab('simulation')}
          >
            ← Return to Aftershock 3D Building
          </button>
        </div>
        <RfApp />
      </div>
    )
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <TopBar />
      <MainContent />
      <Toasts />
    </div>
  )
}

export default function App() {
  return (
    <SimulationProvider>
      <AppShell />
    </SimulationProvider>
  )
}
