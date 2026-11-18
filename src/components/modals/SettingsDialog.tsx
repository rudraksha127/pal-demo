import { useState } from 'react'
import { Settings, Volume2, VolumeX, Eye, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Switch } from '../ui/switch'
import { tacticalAudio } from '../../utils/audio'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bloomEnabled: boolean
  onToggleBloom: (enabled: boolean) => void
  particlesEnabled: boolean
  onToggleParticles: (enabled: boolean) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  bloomEnabled,
  onToggleBloom,
  particlesEnabled,
  onToggleParticles,
}: SettingsDialogProps) {
  const [muted, setMuted] = useState(() => tacticalAudio.isMuted())

  const handleToggleMute = (checked: boolean) => {
    tacticalAudio.setMuted(!checked)
    setMuted(!checked)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: '520px' }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(45, 240, 138, 0.12)',
                color: 'var(--color-emerald-bright)',
                border: '1px solid rgba(45, 240, 138, 0.3)',
              }}
            >
              <Settings size={20} />
            </span>
            <div>
              <DialogTitle>Simulation Preferences</DialogTitle>
              <DialogDescription>Telemetry audio, graphics rendering and accessibility</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
          {/* Tactical Audio */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(8, 20, 13, 0.55)',
              border: '1px solid rgba(86, 235, 163, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {muted ? <VolumeX size={18} color="var(--color-amber-bright)" /> : <Volume2 size={18} color="var(--color-emerald-bright)" />}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Tactical Audio Synthesizer</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Procedural radar chirps & survivor heartbeat pulses</div>
              </div>
            </div>
            <Switch checked={!muted} onCheckedChange={handleToggleMute} />
          </div>

          {/* WebGL Bloom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(8, 20, 13, 0.55)',
              border: '1px solid rgba(86, 235, 163, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={18} color="var(--color-cyan-bright)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Post-Processing Glow / Bloom</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Holographic laser beams & thermal signature glow</div>
              </div>
            </div>
            <Switch checked={bloomEnabled} onCheckedChange={onToggleBloom} />
          </div>

          {/* Atmospheric Dust Particles */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(8, 20, 13, 0.55)',
              border: '1px solid rgba(86, 235, 163, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Eye size={18} color="var(--color-emerald-bright)" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>Atmospheric Dust & Particles</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Debris particulate simulation over collapse site</div>
              </div>
            </div>
            <Switch checked={particlesEnabled} onCheckedChange={onToggleParticles} />
          </div>
        </div>

        <div className="shadcn-dialog-footer" style={{ marginTop: '20px' }}>
          <button className="primary-button" onClick={() => onOpenChange(false)}>
            Save &amp; Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
