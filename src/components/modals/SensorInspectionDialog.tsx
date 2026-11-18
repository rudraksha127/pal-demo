import { useEffect, useRef } from 'react'
import { Activity, BatteryCharging, Radio, Signal, Waves } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { useSimulation } from '../../state/SimulationContext'
import type { SensorKind } from '../../types'
import { tacticalAudio } from '../../utils/audio'

interface SensorInspectionDialogProps {
  sensorId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SENSOR_META: Record<
  string,
  {
    name: string
    kind: SensorKind
    frequency: string
    range: string
    precision: string
    azimuth: number
    elevation: number
  }
> = {
  'R-01': {
    name: 'Radar Array R-01 (Micro-Motion)',
    kind: 'radar',
    frequency: '2.45 GHz Doppler Microwave',
    range: '35 m penetrating',
    precision: '±0.05 mm displacement',
    azimuth: 42,
    elevation: -8,
  },
  'R-02': {
    name: 'Acoustic Array R-02 (Seismic Audio)',
    kind: 'acoustic',
    frequency: '10 Hz - 8 kHz Multi-channel',
    range: '50 m acoustic radius',
    precision: '0.1 ms arrival delta',
    azimuth: 128,
    elevation: -4,
  },
  'R-03': {
    name: 'Vibration Geophone R-03 (Structural)',
    kind: 'vibration',
    frequency: '0.5 Hz - 500 Hz Tri-axial',
    range: '40 m structural wave',
    precision: '10 µg acceleration',
    azimuth: 285,
    elevation: 2,
  },
}

export function SensorInspectionDialog({
  sensorId,
  open,
  onOpenChange,
}: SensorInspectionDialogProps) {
  const { state } = useSimulation()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const info = sensorId ? SENSOR_META[sensorId] || SENSOR_META['R-01'] : SENSOR_META['R-01']
  const id = sensorId || 'R-01'
  const active = state.channels[info.kind]

  // Animated live FFT / wave canvas
  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrame: number
    let phase = 0

    const render = () => {
      const width = canvas.width
      const height = canvas.height
      ctx.fillStyle = '#06130d'
      ctx.fillRect(0, 0, width, height)

      // Grid lines
      ctx.strokeStyle = 'rgba(45, 240, 138, 0.08)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Live waveform
      ctx.strokeStyle = active ? '#2df08a' : '#ffd447'
      ctx.lineWidth = 2
      ctx.beginPath()

      const bars = 64
      const barWidth = width / bars

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth
        const freqAmp = active ? 0.75 : 0.25
        const noise = Math.sin(phase + i * 0.3) * 0.2 + Math.cos(phase * 1.5 + i * 0.5) * 0.15
        const wave = Math.sin(phase * 2 + i * 0.2) * (height * 0.35 * freqAmp)
        const y = height / 2 + wave + noise * (height * 0.1)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // Spectral bars at bottom
      for (let i = 0; i < bars; i++) {
        const x = i * barWidth
        const amp = (Math.sin(phase * 3 + i * 0.4) * 0.5 + 0.5) * (active ? 40 : 12)
        ctx.fillStyle = active ? 'rgba(63, 220, 255, 0.35)' : 'rgba(255, 212, 71, 0.25)'
        ctx.fillRect(x + 1, height - amp, barWidth - 2, amp)
      }

      phase += active ? 0.08 : 0.02
      animationFrame = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrame)
  }, [open, active])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sensor-dialog" style={{ maxWidth: '640px' }}>
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
              <Radio size={22} />
            </span>
            <div>
              <DialogTitle>{info.name}</DialogTitle>
              <DialogDescription>
                Telemetry ID: {id} · Channel: {info.kind.toUpperCase()} · Status:{' '}
                <strong style={{ color: active ? 'var(--color-emerald-bright)' : 'var(--color-amber-bright)' }}>
                  {active ? 'ACTIVE LINKED' : 'STANDBY'}
                </strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Real-time Oscilloscope / FFT Spectrum Display */}
        <div style={{ position: 'relative', marginTop: '12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(86, 235, 163, 0.2)' }}>
          <canvas ref={canvasRef} width={580} height={150} style={{ display: 'block', width: '100%', height: '150px' }} />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '12px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-dim)',
              display: 'flex',
              gap: '16px',
            }}
          >
            <span>LIVE FFT SPECTROGRAM</span>
            <span>FREQ: {info.frequency}</span>
            <span>GAIN: +18 dB</span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '12px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: active ? 'var(--color-emerald-bright)' : 'var(--color-amber-bright)',
            }}
          >
            SNR: {active ? '34.8 dB (STRONG)' : '11.2 dB (NOISE)'}
          </div>
        </div>

        {/* Telemetry Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.6)', border: '1px solid rgba(86, 235, 163, 0.12)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Beam Angle</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              Az {info.azimuth}° / El {info.elevation}°
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.6)', border: '1px solid rgba(86, 235, 163, 0.12)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Effective Range</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {info.range}
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(8, 20, 13, 0.6)', border: '1px solid rgba(86, 235, 163, 0.12)' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resolution</span>
            <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {info.precision}
            </div>
          </div>
        </div>

        {/* Hardware & Mesh Link Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(14, 38, 27, 0.45)',
            border: '1px solid rgba(86, 235, 163, 0.12)',
            marginTop: '12px',
            fontSize: '12px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BatteryCharging size={16} color="var(--color-emerald-bright)" />
            Battery: <strong>14.2V (94%)</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Signal size={16} color="var(--color-cyan-bright)" />
            Mesh Latency: <strong>6.8 ms</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--color-emerald-bright)" />
            Samples: <strong>{state.history.length * 128} pkts</strong>
          </span>
        </div>

        <div className="shadcn-dialog-footer" style={{ marginTop: '20px' }}>
          <button
            className="ghost-button"
            onClick={() => {
              tacticalAudio.playRadarPing()
            }}
            style={{ marginRight: 'auto' }}
          >
            <Waves size={14} /> Send Ping Chirp
          </button>
          <button className="primary-button" onClick={() => onOpenChange(false)}>
            Close Telemetry
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
