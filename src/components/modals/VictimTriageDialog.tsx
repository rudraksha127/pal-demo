import { useState } from 'react'
import { Activity, CheckCircle2, Heart, MapPin, Radio, ShieldAlert, User, Volume2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { useSimulation } from '../../state/SimulationContext'
import { tacticalAudio } from '../../utils/audio'

interface VictimTriageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VictimTriageDialog({ open, onOpenChange }: VictimTriageDialogProps) {
  const { state, scenario, addToast } = useSimulation()
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const { location, evidence } = state
  const victim = scenario.victim

  const handlePlayAcoustic = () => {
    setIsPlayingAudio(true)
    tacticalAudio.playAcousticKnock()
    setTimeout(() => setIsPlayingAudio(false), 800)
  }

  const handleConfirmExtraction = () => {
    setConfirmed(true)
    tacticalAudio.playRescueConfirmed()
    addToast('Rescue Extraction Dispatched', 'Rescue Task Force Charlie routed to Floor 2 Void 2B.', 'success')
    setTimeout(() => {
      onOpenChange(false)
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: '660px' }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(255, 95, 86, 0.15)',
                color: 'var(--color-red-bright)',
                border: '1px solid rgba(255, 95, 86, 0.35)',
              }}
            >
              <User size={24} />
            </span>
            <div>
              <DialogTitle style={{ color: '#ff6b62' }}>
                Survivor Triage Dossier · {victim.id}
              </DialogTitle>
              <DialogDescription>
                Target Zone: <strong>{victim.zoneId} (Structural Collapse)</strong> · Confidence Level:{' '}
                <strong style={{ color: 'var(--color-emerald-bright)' }}>{evidence.toFixed(1)}% High Probability</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Vital Signs Matrix */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '12px',
          }}
        >
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.7)', border: '1px solid rgba(255, 95, 86, 0.2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Heart size={12} color="#ff5f56" /> Heart Rate
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-mono)', color: '#ff8a82' }}>
              78 <span style={{ fontSize: '11px', fontWeight: 400 }}>BPM</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-dim-2)', marginTop: '2px' }}>Micro-Doppler RF</div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.7)', border: '1px solid rgba(45, 240, 138, 0.2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} color="#2df08a" /> Respiration
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-mono)', color: '#2df08a' }}>
              14 <span style={{ fontSize: '11px', fontWeight: 400 }}>RPM</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-dim-2)', marginTop: '2px' }}>0.23 Hz Chest Exp.</div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.7)', border: '1px solid rgba(63, 220, 255, 0.2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} color="#3fdcff" /> Core Temp
            </span>
            <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-mono)', color: '#3fdcff' }}>
              35.8 <span style={{ fontSize: '11px', fontWeight: 400 }}>°C</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-dim-2)', marginTop: '2px' }}>Mild Hypothermia</div>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.7)', border: '1px solid rgba(255, 212, 71, 0.2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={12} color="#ffd447" /> Void Status
            </span>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', fontFamily: 'var(--font-mono)', color: '#ffd447' }}>
              SURVIVABLE
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-dim-2)', marginTop: '2px' }}>O2 Sat: ~19.4%</div>
          </div>
        </div>

        {/* 3D Coordinate Precision & Breach Vector */}
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(14, 38, 27, 0.5)', border: '1px solid rgba(86, 235, 163, 0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="var(--color-emerald-bright)" />
              Triangulated Spatial Coordinates
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-emerald-bright)' }}>
              Uncertainty: ±{location.uncertainty.toFixed(1)} m
            </span>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text)' }}>
            <span><strong>X:</strong> {location.x.toFixed(1)} m</span>
            <span><strong>Y:</strong> {location.y.toFixed(1)} m</span>
            <span><strong>Z:</strong> {location.z.toFixed(1)} m</span>
            <span><strong>Floor:</strong> 02</span>
            <span><strong>Cavity Void:</strong> 2B North</span>
          </div>
        </div>

        {/* Acoustic Tap Audio Evidence */}
        <div
          style={{
            marginTop: '14px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(8, 20, 13, 0.6)',
            border: '1px solid rgba(63, 220, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-cyan-bright)' }}>
              Acoustic Channel Capture (Sensor R-02)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginTop: '2px' }}>
              Pattern: 3 periodic strikes at 0.8s intervals · Confirmed human knocking response
            </div>
          </div>
          <button
            className="ghost-button"
            onClick={handlePlayAcoustic}
            disabled={isPlayingAudio}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              color: isPlayingAudio ? 'var(--color-emerald-bright)' : 'var(--color-cyan-bright)',
              borderColor: 'rgba(63, 220, 255, 0.4)',
            }}
          >
            <Volume2 size={14} /> {isPlayingAudio ? 'Playing...' : 'Play Audio'}
          </button>
        </div>

        {/* Extraction Path Advice */}
        <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-emerald-bright)' }}>Recommended Breach Route:</strong>
          <span style={{ display: 'block', marginTop: '4px' }}>
            Rubble depth is estimated at ~1.8 meters. Breach through Floor 2 West exterior beam rather than vertical drilling from Floor 3 to avoid secondary slab collapse.
          </span>
        </div>

        <div className="shadcn-dialog-footer" style={{ marginTop: '20px' }}>
          <button className="ghost-button" onClick={() => onOpenChange(false)}>
            Close Dossier
          </button>
          <button
            className="primary-button"
            onClick={handleConfirmExtraction}
            disabled={confirmed}
            style={{
              background: confirmed ? 'var(--color-emerald-deep)' : 'var(--color-emerald-bright)',
              color: '#022c17',
              fontWeight: 700,
            }}
          >
            {confirmed ? (
              <>
                <CheckCircle2 size={16} /> Dispatched!
              </>
            ) : (
              'Dispatch Extraction Team'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
