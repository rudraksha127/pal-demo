import { useState } from 'react'
import {
  Building2,
  Clock3,
  FileText,
  Info,
  Keyboard,
  LayoutDashboard,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useRfFense } from '../RfFenseContext'
import { formatMissionClock } from '../engine'
import { tacticalAudio } from '../../utils/audio'
import type { RfTab } from '../types'

const TABS: Array<{ id: RfTab; label: string; icon: typeof ScanLine }> = [
  { id: 'operation', label: 'Operation', icon: ScanLine },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'building_lab', label: '3D Building Lab', icon: Building2 },
  { id: 'report', label: 'Report', icon: FileText },
  { id: 'about', label: 'About', icon: Info },
]

function BrandMark() {
  return (
    <svg viewBox="0 0 44 44" width="38" height="38" aria-hidden="true" className="rf-brand__mark">
      <defs>
        <linearGradient id="rf-brand-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5cffab" />
          <stop offset="100%" stopColor="#0f9d58" />
        </linearGradient>
      </defs>
      <path
        d="M22 3.5 38 10v11.5c0 9.2-6.1 15.4-16 19-9.9-3.6-16-9.8-16-19V10L22 3.5Z"
        fill="rgba(45,240,138,0.07)"
        stroke="url(#rf-brand-gradient)"
        strokeWidth="1.6"
      />
      <path d="M13 24h4l2.4-6 3.2 12 2.6-8 2 2H31" fill="none" stroke="#5cffab" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="14" r="1.8" fill="#5cffab" />
    </svg>
  )
}

interface TopBarProps {
  onOpenSettings?: () => void
  onOpenShortcuts?: () => void
}

export function TopBar({ onOpenSettings, onOpenShortcuts }: TopBarProps) {
  const { tab, setTab, scene, busy, elapsed, restartSimulation } = useRfFense()
  const [muted, setMuted] = useState(() => tacticalAudio.isMuted())

  const handleToggleMute = () => {
    const isNowMuted = tacticalAudio.toggleMute()
    setMuted(isNowMuted)
  }

  return (
    <header className="rf-topbar">
      <div className="rf-brand">
        <BrandMark />
        <div className="rf-brand__copy">
          <span className="rf-brand__name">
            RF <strong>FENSE</strong>
          </span>
          <span className="rf-brand__tag">Disaster-to-Rescue Search Simulation</span>
        </div>
      </div>

      <nav className="rf-nav" aria-label="Primary views">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`rf-nav__item${active ? ' is-active' : ''}`}
              onClick={() => setTab(item.id)}
              aria-current={active ? 'page' : undefined}
              data-control={`nav-${item.id}`}
            >
              <Icon size={15} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="rf-topbar__meta">
        <button
          type="button"
          className="rf-restart"
          onClick={handleToggleMute}
          title={muted ? 'Unmute tactical audio' : 'Mute tactical audio'}
          aria-label={muted ? 'Unmute tactical audio' : 'Mute tactical audio'}
          style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center' }}
        >
          {muted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
        </button>

        {onOpenSettings && (
          <button
            type="button"
            className="rf-restart"
            onClick={onOpenSettings}
            title="Configure simulation preferences"
            aria-label="Settings"
            data-control="open-settings"
            style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Settings size={14} aria-hidden="true" />
          </button>
        )}

        {onOpenShortcuts && (
          <button
            type="button"
            className="rf-restart"
            onClick={onOpenShortcuts}
            title="Keyboard shortcuts (?)"
            aria-label="Shortcuts"
            data-control="open-shortcuts"
            style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center' }}
          >
            <Keyboard size={14} aria-hidden="true" />
          </button>
        )}

        <span className="rf-scene-chip">
          <ShieldCheck size={13} aria-hidden="true" />
          Scene {String(scene).padStart(2, '0')} / 12
        </span>
        <span className="rf-clock" title="Mission elapsed time">
          <Clock3 size={13} aria-hidden="true" />
          <span className="rf-mono">{formatMissionClock(elapsed)}</span>
        </span>
        <button
          type="button"
          className="rf-restart"
          onClick={restartSimulation}
          title="Restart the simulation from Scene 1"
          data-control="restart-simulation"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Restart</span>
        </button>
      </div>

      {busy && (
        <div className="rf-busy-strip" role="status" aria-live="polite">
          <LoaderCircle size={14} className="rf-spin" aria-hidden="true" />
          <span>{busy.label}</span>
        </div>
      )}
    </header>
  )
}
