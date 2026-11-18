import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChartLine,
  Check,
  ChevronDown,
  ClipboardList,
  Compass,
  Cpu,
  Database,
  House,
  Info,
  Keyboard,
  Radio,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import type { NavTab, Tone } from '../types'

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: typeof House }> = [
  { id: 'simulation', label: 'Simulation', icon: House },
  { id: 'analysis', label: 'Analysis', icon: ChartLine },
  { id: 'report', label: 'Report', icon: ClipboardList },
  { id: 'scenarios', label: 'Scenarios', icon: Compass },
]

const ROLES = [
  { id: 'commander', label: 'Rescue Commander', initials: 'RC', unit: 'Alpha Unit' },
  { id: 'sensor', label: 'Sensor Operator', initials: 'SO', unit: 'Mesh Control' },
  { id: 'analyst', label: 'Mission Analyst', initials: 'MA', unit: 'Fusion Cell' },
]

function BrandMark() {
  return (
    <svg viewBox="0 0 66 42" width="46" height="42" aria-hidden="true">
      <path
        d="M1 21 H11 L15 21 L18 8 L22 34 L26 14 L29 21 H38 L41 11 L45 30 L48 21 H65"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 25 H9 L13 25 L17 17 L21 31 L25 20 L28 25 H40 L43 18 L46 28 L49 25 H65"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.32"
      />
    </svg>
  )
}

function toneIcon(tone: Tone) {
  if (tone === 'success') return <ShieldCheck size={15} />
  if (tone === 'warning') return <Zap size={15} />
  if (tone === 'danger') return <Info size={15} />
  return <Radio size={15} />
}

function toneClass(tone: Tone) {
  if (tone === 'warning') return 'notification-icon--warning'
  if (tone === 'danger') return 'notification-icon--danger'
  return ''
}

export function TopBar() {
  const {
    ui,
    state,
    unreadCount,
    hasSavedMission,
    setTab,
    toggleOverlays,
    markNotificationsRead,
    saveMission,
    restoreMission,
    addToast,
  } = useSimulation()
  const [menu, setMenu] = useState<'notifications' | 'settings' | 'about' | 'commander' | null>(null)
  const [role, setRole] = useState(ROLES[0])
  const [reduceMotion, setReduceMotion] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    return () => document.documentElement.classList.remove('reduce-motion')
  }, [reduceMotion])

  const selectRole = (next: (typeof ROLES)[number]) => {
    setRole(next)
    setMenu(null)
    addToast(`Role switched to ${next.label}`, `${next.unit} console permissions applied.`, 'info')
  }

  return (
    <div ref={rootRef}>
      <header className="topbar">
        <button className="brand" onClick={() => setTab('simulation')} aria-label="Aftershock — open simulation dashboard">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-copy">
            <span className="brand-name">AFTERSHOCK</span>
            <span className="brand-sub">Disaster Search &amp; Rescue Simulation</span>
          </span>
        </button>

        <nav className="main-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${ui.tab === item.id ? 'is-active' : ''}`}
                onClick={() => setTab(item.id)}
                aria-current={ui.tab === item.id ? 'page' : undefined}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="topbar-actions">
          <div className="popover-anchor">
            <button
              className="icon-button"
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-expanded={menu === 'notifications'}
              aria-haspopup="dialog"
              onClick={() => setMenu(menu === 'notifications' ? null : 'notifications')}
            >
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            {menu === 'notifications' && (
              <div className="popover" role="dialog" aria-label="Notifications">
                <div className="popover__head">
                  <strong>Notifications</strong>
                  <button className="text-button" onClick={markNotificationsRead} disabled={unreadCount === 0}>
                    Mark all read
                  </button>
                </div>
                <div className="notification-list">
                  {state.notifications.length === 0 ? (
                    <div className="popover-empty">No mission notifications.</div>
                  ) : (
                    state.notifications.map((item) => (
                      <div key={item.id} className={`notification-item ${item.read ? '' : 'is-unread'}`}>
                        <span className={`notification-icon ${toneClass(item.tone)}`}>{toneIcon(item.tone)}</span>
                        <div className="notification-copy">
                          <strong>
                            {item.title}
                            {!item.read && <i />}
                          </strong>
                          <p>{item.body}</p>
                          <small>{item.time}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="icon-button icon-button--settings"
            aria-label="Simulation settings"
            aria-expanded={menu === 'settings'}
            onClick={() => setMenu(menu === 'settings' ? null : 'settings')}
          >
            <Settings size={18} strokeWidth={1.8} />
          </button>

          <button
            className="icon-button icon-button--info"
            aria-label="About Aftershock"
            aria-expanded={menu === 'about'}
            onClick={() => setMenu(menu === 'about' ? null : 'about')}
          >
            <Info size={18} strokeWidth={1.8} />
          </button>

          <div className="popover-anchor">
            <button
              className="commander"
              aria-label={`Signed in as ${role.label}. Open account menu`}
              aria-expanded={menu === 'commander'}
              onClick={() => setMenu(menu === 'commander' ? null : 'commander')}
            >
              <span className="avatar">{role.initials}</span>
              <span className="commander-copy">
                <strong>{role.label}</strong>
                <small>{role.unit}</small>
              </span>
              <ChevronDown size={14} />
            </button>
            {menu === 'commander' && (
              <div className="popover commander-menu" role="dialog" aria-label="Account menu">
                <div className="commander-identity">
                  <span className="avatar">{role.initials}</span>
                  <div>
                    <strong>{role.label}</strong>
                    <span>{role.unit} · Command uplink</span>
                  </div>
                </div>
                <div className="menu-section">
                  <div className="menu-label">Switch console role</div>
                  {ROLES.map((item) => (
                    <button key={item.id} className="menu-item" onClick={() => selectRole(item)}>
                      <ShieldCheck size={14} />
                      {item.label}
                      {item.id === role.id && <Check size={14} className="menu-check" />}
                    </button>
                  ))}
                </div>
                <div className="menu-section">
                  <button
                    className="menu-item"
                    onClick={() => {
                      setMenu(null)
                      saveMission()
                    }}
                  >
                    <Save size={14} /> Save current mission
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      setMenu(null)
                      restoreMission()
                    }}
                  >
                    <RotateCcw size={14} /> Restore saved mission
                    {!hasSavedMission && <span className="menu-check">—</span>}
                  </button>
                  <button
                    className="menu-item"
                    onClick={() => {
                      setMenu(null)
                      setMenu('settings')
                    }}
                  >
                    <Keyboard size={14} /> Settings &amp; shortcuts
                    <kbd>⌘,</kbd>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {menu === 'settings' && (
        <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && setMenu(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="modal__head">
              <span className="modal__icon">
                <Settings size={18} />
              </span>
              <div>
                <h2 id="settings-title">Simulation Settings</h2>
                <p>Interface and telemetry preferences for this device.</p>
              </div>
              <button className="modal__close" aria-label="Close settings" onClick={() => setMenu(null)}>
                <X size={15} />
              </button>
            </div>

            <div className="setting-row">
              <div className="setting-copy">
                <strong>Reduce interface motion</strong>
                <span>Disables ambient pulses, sheens and animated transitions.</span>
              </div>
              <button
                className={`switch ${reduceMotion ? 'is-on' : ''}`}
                role="switch"
                aria-checked={reduceMotion}
                aria-label="Reduce interface motion"
                onClick={() => setReduceMotion((value) => !value)}
              />
            </div>

            <div className="setting-row">
              <div className="setting-copy">
                <strong>Show 3D search overlays</strong>
                <span>Zone volumes, sensor labels and target annotations.</span>
              </div>
              <button
                className={`switch ${ui.overlays ? 'is-on' : ''}`}
                role="switch"
                aria-checked={ui.overlays}
                aria-label="Show 3D search overlays"
                onClick={toggleOverlays}
              />
            </div>

            <div className="setting-row">
              <div className="setting-copy">
                <strong>Saved mission</strong>
                <span>{hasSavedMission ? 'A local snapshot is available to restore.' : 'No mission snapshot has been saved yet.'}</span>
              </div>
              <button className="secondary-button" onClick={restoreMission}>
                <RotateCcw size={13} /> Restore
              </button>
            </div>

            <div className="modal__actions">
              <button className="primary-button" onClick={() => setMenu(null)}>
                Done
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  saveMission()
                }}
              >
                <Save size={13} /> Save mission now
              </button>
            </div>

            <div className="shortcut-list" aria-label="Keyboard shortcuts">
              <div className="shortcut-row">
                <span>Pause / resume simulation</span>
                <kbd>Space</kbd>
              </div>
              <div className="shortcut-row">
                <span>Reset mission snapshot</span>
                <kbd>R</kbd>
              </div>
              <div className="shortcut-row">
                <span>Close menus and dialogs</span>
                <kbd>Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {menu === 'about' && (
        <div className="modal-backdrop" onPointerDown={(event) => event.target === event.currentTarget && setMenu(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
            <div className="modal__head">
              <span className="modal__icon">
                <Sparkles size={18} />
              </span>
              <div>
                <h2 id="about-title">About Aftershock</h2>
                <p>Autonomous multi-sensor search &amp; rescue command surface.</p>
              </div>
              <button className="modal__close" aria-label="Close about dialog" onClick={() => setMenu(null)}>
                <X size={15} />
              </button>
            </div>

            <p className="about-copy">
              <strong>Aftershock</strong> fuses radar micro-motion, acoustic contact and structural vibration into a single
              survivor-detection picture. The simulation reconstructs a collapse site, deploys a synthetic sensor mesh, and
              runs the full eight-stage rescue workflow autonomously — from disaster registration to rescue confirmation.
            </p>

            <div className="about-facts">
              <div className="about-fact">
                <span>Simulation core</span>
                <strong>Deterministic multi-channel fusion</strong>
              </div>
              <div className="about-fact">
                <span>Visualisation</span>
                <strong>Procedural Three.js collapse scene</strong>
              </div>
              <div className="about-fact">
                <span>Mission workflow</span>
                <strong>8 autonomous stages</strong>
              </div>
              <div className="about-fact">
                <span>Data posture</span>
                <strong>Synthetic · local-only</strong>
              </div>
            </div>

            <div className="disclaimer">
              Research and demonstration interface only. All incident data, victims, coordinates and sensor readings are
              synthetic. Do not use for operational search-and-rescue decisions.
            </div>

            <div className="modal__actions">
              <button className="primary-button" onClick={() => setMenu(null)}>
                Close
              </button>
              <span className="menu-item menu-item--muted" style={{ paddingLeft: 0 }}>
                <Database size={13} /> v1.0.0
                <Cpu size={13} style={{ marginLeft: 12 }} /> React · Three.js
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
