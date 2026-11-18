import { ZONE_STATUS_META } from '../../rf/data'
import type { SearchZone, SensorNode } from '../../rf/types'

interface SelectionInfoProps {
  activeZone: SearchZone | null
  activeNode: SensorNode | null
  latest: any
}

export function SelectionInfo({ activeZone, activeNode, latest }: SelectionInfoProps) {
  if (activeZone) {
    return (
      <>
        <strong style={{ color: 'var(--color-text)' }}>{activeZone.label}</strong>{' '}
        <span style={{ color: 'var(--color-text-dim)' }}>·</span>{' '}
        {activeZone.name}{' '}
        <span style={{ color: 'var(--color-text-dim)' }}>·</span>{' '}
        <span style={{ color: ZONE_STATUS_META[activeZone.status].color }}>
          {ZONE_STATUS_META[activeZone.status].label}
        </span>
        {latest ? (
          <>
            <span style={{ color: 'var(--color-text-dim)' }}> · Last result </span>
            <span style={{ color: 'var(--color-text)' }}>{latest.observationType.replaceAll('_', ' ')}</span>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-dim)' }}> · No observation</span>
        )}
      </>
    )
  }

  if (activeNode) {
    const sensorLabel = activeNode.sensorType === 'fmcw_radar' ? 'FMCW Radar' : activeNode.sensorType === 'contact_microphone' ? 'Contact Mic' : 'Geophone'
    const healthColor = activeNode.health === 'nominal' ? 'var(--color-emerald-bright)' : activeNode.health === 'degraded' ? 'var(--color-amber-bright)' : 'var(--color-red-bright)'
    const healthBg = activeNode.health === 'nominal' ? 'rgba(45, 240, 138, 0.15)' : activeNode.health === 'degraded' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    const healthBorder = activeNode.health === 'nominal' ? 'rgba(45, 240, 138, 0.3)' : activeNode.health === 'degraded' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'

    return (
      <>
        <strong style={{ color: 'var(--color-text)' }}>{activeNode.id}</strong>{' '}
        <span style={{ color: 'var(--color-text-dim)' }}>·</span>{' '}
        {sensorLabel}{' '}
        <span style={{ color: 'var(--color-text-dim)' }}>· Zone</span>{' '}
        {activeNode.zoneId}{' '}
        <span style={{ color: 'var(--color-text-dim)' }}>·</span>{' '}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '10px',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          background: healthBg,
          color: healthColor,
          border: `1px solid ${healthBorder}`
        }}>
          {activeNode.health}
        </span>
        {' '}<span style={{ color: 'var(--color-text-dim)' }}>Battery N/A</span>
      </>
    )
  }

  return 'Click a zone volume or sensor node to inspect. All readings are illustrative.'
}