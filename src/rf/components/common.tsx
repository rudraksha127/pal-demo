import type { ReactNode } from 'react'
import { BatteryMedium, CircleHelp, Radio } from 'lucide-react'
import { ZONE_STATUS_META } from '../data'
import { zoneStatusDetail } from '../engine'
import type { SensorNode, ZoneStatus } from '../types'

export function StatusBadge({ status, compact = false }: { status: ZoneStatus; compact?: boolean }) {
  const meta = ZONE_STATUS_META[status]
  return (
    <span
      className={`rf-status${compact ? ' rf-status--compact' : ''}`}
      style={{ ['--status-color' as string]: meta.color }}
      title={zoneStatusDetail(status)}
    >
      <i aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function NodeState({ node }: { node: SensorNode }) {
  const label =
    node.health === 'offline' ? 'Offline' : node.health === 'degraded' ? 'Degraded' : 'Nominal'
  return (
    <span className={`rf-node-state rf-node-state--${node.health}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  )
}

export function BatteryState({ node }: { node: SensorNode }) {
  return (
    <span className="rf-battery" title="Battery telemetry is not supplied by this illustrative simulation.">
      <BatteryMedium size={13} aria-hidden="true" />
      {node.batteryStatus === null ? 'N/A' : `${node.batteryStatus}%`}
    </span>
  )
}

export function IllustrativeTag() {
  return (
    <span className="rf-tag rf-tag--illustrative">
      <CircleHelp size={11} aria-hidden="true" />
      Pre-programmed example
    </span>
  )
}

export function Metric({
  label,
  value,
  foot,
  tone = 'default',
  icon,
}: {
  label: string
  value: ReactNode
  foot?: string
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted'
  icon?: ReactNode
}) {
  return (
    <div className={`rf-kpi rf-kpi--${tone}`}>
      <div className="rf-kpi__label">
        {icon}
        {label}
      </div>
      <div className="rf-kpi__value">{value}</div>
      {foot && <p className="rf-kpi__foot">{foot}</p>}
    </div>
  )
}

export function PanelTitle({
  icon,
  title,
  aside,
}: {
  icon?: ReactNode
  title: string
  aside?: ReactNode
}) {
  return (
    <div className="rf-panel-title">
      <div className="rf-panel-title__main">
        {icon}
        <h2>{title}</h2>
      </div>
      {aside && <div className="rf-panel-title__aside">{aside}</div>}
    </div>
  )
}

export function SignalBars({ quality }: { quality: SensorNode['signalQuality'] }) {
  const level = quality === 'good' ? 4 : quality === 'fair' ? 2 : quality === 'poor' ? 1 : 0
  return (
    <span className="rf-signal" title={`Signal quality: ${quality}`}>
      <Radio size={13} aria-hidden="true" />
      <span className="rf-signal__bars" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <i key={index} className={index < level ? 'is-on' : ''} />
        ))}
      </span>
      <span className="rf-sr-only">{quality}</span>
    </span>
  )
}
