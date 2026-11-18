import { Radio, ShieldCheck } from 'lucide-react'

export function ViewportLegend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #2df08a, #059669)', border: '1px solid rgba(45, 240, 138, 0.5)' }} />
        <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Safe Area</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(45, 240, 138, 0.2)', border: '1px solid rgba(45, 240, 138, 0.5)' }} />
        <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Search Zone</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(255, 95, 86, 0.2)', border: '1px solid rgba(255, 95, 86, 0.5)' }} />
        <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Candidate Zone</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
          <Radio size={12} style={{ color: '#3fdcff' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Active Sensor</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
          <ShieldCheck size={12} style={{ color: '#ffd447', animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-dim)' }}>Verified</span>
      </div>
    </div>
  )
}