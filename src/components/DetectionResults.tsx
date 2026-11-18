import { useState } from 'react'
import { Activity, AudioLines, CheckCircle2, CircleDashed, Radar } from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import type { SensorKind } from '../types'
import { VictimTriageDialog } from './modals/VictimTriageDialog'
import { tacticalAudio } from '../utils/audio'

const CHANNELS: Array<{
  key: SensorKind
  label: string
  icon: typeof Radar
}> = [
  { key: 'radar', label: 'Radar (Micro-motion / Breathing)', icon: Radar },
  { key: 'acoustic', label: 'Acoustic (Voice/Knocking)', icon: AudioLines },
  { key: 'vibration', label: 'Vibration (Periodic Activity)', icon: Activity },
]

function VictimGlyph() {
  return (
    <svg viewBox="0 0 44 62" width="26" height="38" aria-hidden="true">
      <defs>
        <linearGradient id="victim-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd5a0" />
          <stop offset="45%" stopColor="#ff8b4c" />
          <stop offset="100%" stopColor="#ff4f3f" />
        </linearGradient>
        <filter id="victim-glow" x="-60%" y="-30%" width="220%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#victim-glow)" fill="none" stroke="url(#victim-fill)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="22" cy="9" r="5.2" />
        <path d="M22 15v18" />
        <path d="M22 19 12 28M22 19l10 9" />
        <path d="M22 33 15 50M22 33l7 17" />
      </g>
    </svg>
  )
}

export function DetectionResults() {
  const { state, scenario } = useSimulation()
  const [dialogOpen, setDialogOpen] = useState(false)

  const contact = state.evidence >= 60
  const evidence = Math.floor(state.evidence)
  const acquiredCount = CHANNELS.filter((channel) => state.channels[channel.key]).length

  const handleCardClick = () => {
    tacticalAudio.playHeartbeat()
    setDialogOpen(true)
  }

  return (
    <section className="detection-panel panel" aria-label="Detection results">
      <div className="panel-heading">
        <span className="panel-icon">
          <Activity size={17} />
        </span>
        <h2>Detection Results</h2>
      </div>

      <div
        className={`victim-card ${contact ? '' : 'victim-card--idle'}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        title="Click to view detailed medical triage dossier"
        style={{ cursor: 'pointer' }}
      >
        <span className="victim-avatar">
          <VictimGlyph />
        </span>
        <div className="victim-main">
          <div className="victim-title">
            <strong>{contact ? 'Potential Victim' : 'No contact yet'}</strong>
            <span className={`badge ${contact ? 'badge--green' : 'badge--amber'}`}>
              {contact ? scenario.victim.id : 'SCANNING'}
            </span>
          </div>
          <div className="evidence-line">
            <span>Evidence Strength</span>
            <strong>{evidence}%</strong>
          </div>
          <div className="meter" role="progressbar" aria-valuenow={evidence} aria-valuemin={0} aria-valuemax={100} aria-label="Detection confidence">
            <span style={{ width: `${Math.min(100, evidence)}%` }} />
          </div>
        </div>
      </div>

      <ul className="evidence-list">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon
          const acquired = state.channels[channel.key]
          return (
            <li key={channel.key} className={acquired ? '' : 'is-off'}>
              <span className="evidence-icon">
                <Icon size={15} strokeWidth={1.8} />
              </span>
              <span>{channel.label}</span>
              {acquired ? (
                <CheckCircle2 size={15} className="evidence-state" />
              ) : (
                <CircleDashed size={15} className="evidence-state evidence-state--pending" />
              )}
            </li>
          )
        })}
      </ul>

      <p className="sr-only" aria-live="polite">
        {state.status === 'complete'
          ? 'Evidence package locked and handed off to the rescue team.'
          : `Acquiring contact. ${acquiredCount} of 3 sensor arrays reporting.`}
      </p>

      <VictimTriageDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  )
}
