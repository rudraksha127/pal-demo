import { useId, type ReactNode } from 'react'
import type { HistorySample, MissionLocation } from '../../types'

function toPoints(values: number[], width: number, height: number, pad = 3): Array<[number, number]> {
  const count = Math.max(2, values.length)
  const step = width / (count - 1)
  return values.map((value, index) => [
    index * step,
    height - pad - Math.min(1, Math.max(0, value)) * (height - pad * 2),
  ])
}

function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`
  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x0, y0] = points[index]
    const [x1, y1] = points[index + 1]
    const midX = (x0 + x1) / 2
    path += ` Q ${x0.toFixed(2)} ${y0.toFixed(2)} ${midX.toFixed(2)} ${((y0 + y1) / 2).toFixed(2)}`
  }
  const last = points[points.length - 1]
  path += ` T ${last[0].toFixed(2)} ${last[1].toFixed(2)}`
  return path
}

interface SparklineProps {
  values: number[]
  color: string
  width?: number
  height?: number
  fill?: boolean
}

export function Sparkline({ values, color, width = 92, height = 32, fill = true }: SparklineProps) {
  const id = useId().replace(/:/g, '')
  const points = toPoints(values.length > 1 ? values : [0.4, 0.4], width, height, 2)
  const line = smoothPath(points)
  const area = `${line} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#spark-${id})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
      />
    </svg>
  )
}

interface WaveformProps {
  values: number[]
  color: string
  variant?: 'line' | 'bars' | 'dense'
  className?: string
}

export function Waveform({ values, color, variant = 'line', className }: WaveformProps) {
  const id = useId().replace(/:/g, '')
  const width = 240
  const height = 44
  const series = values.length > 1 ? values : [0.2, 0.4, 0.3, 0.6, 0.4, 0.5, 0.3, 0.55, 0.35, 0.5, 0.25, 0.45]
  const points = toPoints(series, width, height, 4)
  const line = smoothPath(points)
  const area = `${line} L ${width} ${height} L 0 ${height} Z`

  if (variant === 'bars') {
    const count = Math.min(series.length, 42)
    const barWidth = width / count - 2
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height="100%" className={className} aria-hidden="true">
        {Array.from({ length: count }).map((_, index) => {
          const value = series[Math.floor((index / count) * series.length)] ?? 0.2
          const barHeight = Math.max(3, value * height)
          return (
            <rect
              key={index}
              x={index * (barWidth + 2)}
              y={(height - barHeight) / 2}
              width={barWidth}
              height={barHeight}
              rx={1}
              fill={color}
              opacity={0.28 + value * 0.62}
            />
          )
        })}
      </svg>
    )
  }

  if (variant === 'dense') {
    const densePoints = toPoints(
      Array.from({ length: 96 }).map((_, index) => {
        const base = series[Math.floor((index / 96) * series.length)] ?? 0.4
        return Math.min(1, Math.max(0.04, base * 0.7 + Math.abs(Math.sin(index * 1.7)) * 0.3))
      }),
      width,
      height,
      3,
    )
    const denseLine = densePoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height="100%" className={className} aria-hidden="true">
        <path
          d={denseLine}
          fill="none"
          stroke={color}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          opacity="0.9"
          style={{ filter: `drop-shadow(0 0 3px ${color}77)` }}
        />
      </svg>
    )
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height="100%" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`wave-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#wave-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
      />
    </svg>
  )
}

interface LocationPlotProps {
  location: MissionLocation
  floor: number
  evidence: number
}

export function LocationPlot({ location, floor, evidence }: LocationPlotProps) {
  const scale = Math.min(1.4, Math.max(0.55, 0.45 + location.uncertainty * 0.22))
  const opacity = Math.max(0.25, Math.min(0.95, evidence / 100 + 0.15))

  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" role="img" aria-label={`Estimated location floor ${floor}, uncertainty plus or minus ${location.uncertainty.toFixed(1)} metres`}>
      <defs>
        <radialGradient id="heat-blob" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd76a" stopOpacity="0.95" />
          <stop offset="24%" stopColor="#ff7a45" stopOpacity="0.75" />
          <stop offset="52%" stopColor="#ff4038" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#ff4038" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="plot-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3fdcff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3fdcff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="plot-clip">
          <rect x="0" y="0" width="200" height="150" rx="7" />
        </clipPath>
      </defs>

      <g clipPath="url(#plot-clip)">
        <rect width="200" height="150" fill="#04100d" />
        <rect width="200" height="150" fill="url(#plot-glow)" />

        <g stroke="#2a6b58" strokeWidth="0.5" opacity="0.32">
          {Array.from({ length: 9 }).map((_, index) => (
            <line key={`v-${index}`} x1={index * 25} y1="0" x2={index * 25} y2="150" />
          ))}
          {Array.from({ length: 7 }).map((_, index) => (
            <line key={`h-${index}`} x1="0" y1={index * 25} x2="200" y2={index * 25} />
          ))}
        </g>

        <g stroke="#3fdcff" strokeWidth="0.45" opacity="0.22">
          {Array.from({ length: 6 }).map((_, index) => {
            const inset = 12 + index * 12
            return <ellipse key={index} cx="100" cy="82" rx={inset * 1.5} ry={inset * 0.62} fill="none" />
          })}
          <line x1="18" y1="82" x2="182" y2="82" strokeDasharray="3 4" />
          <line x1="100" y1="18" x2="100" y2="136" strokeDasharray="3 4" />
        </g>

        <g opacity={opacity}>
          <ellipse cx="100" cy="82" rx={48 * scale} ry={21 * scale} fill="none" stroke="#3fdcff" strokeWidth="0.7" opacity="0.5" />
          <ellipse cx="100" cy="82" rx={34 * scale} ry={15 * scale} fill="none" stroke="#3fdcff" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.45" />
          <ellipse cx="100" cy="82" rx={30 * scale} ry={30 * scale} fill="url(#heat-blob)" />
          <circle cx="100" cy="82" r="2.3" fill="#ffe6b0" />
          <circle cx="100" cy="82" r="5" fill="none" stroke="#ffb26a" strokeWidth="0.7" opacity="0.8" />
          <g className="plot-pulse" style={{ transformOrigin: '100px 82px' }}>
            <circle cx="100" cy="82" r="12" fill="none" stroke="#ff7a45" strokeWidth="0.6" />
          </g>
        </g>

        <g fill="#5f9c86" fontFamily="Inter, sans-serif" fontSize="6" letterSpacing="0.08em">
          <text x="8" y="12">SECTOR-17 / FLOOR {floor}</text>
          <text x="8" y="143">X 12.4</text>
          <text x="158" y="143">Y 6.8</text>
          <text x="160" y="12">±{location.uncertainty.toFixed(1)} M</text>
        </g>

        <g stroke="#3fdcff" strokeWidth="0.8" opacity="0.45">
          <path d="M 8 30 L 8 22 L 16 22" fill="none" />
          <path d="M 192 30 L 192 22 L 184 22" fill="none" />
          <path d="M 8 120 L 8 128 L 16 128" fill="none" />
          <path d="M 192 120 L 192 128 L 184 128" fill="none" />
        </g>
      </g>
    </svg>
  )
}

interface TelemetryChartProps {
  history: HistorySample[]
  height?: number
}

export function TelemetryChart({ history, height = 268 }: TelemetryChartProps) {
  const id = useId().replace(/:/g, '')
  const width = 820
  const chartHeight = 220
  const top = 16
  const left = 38
  const right = 16
  const bottom = 26
  const innerWidth = width - left - right
  const innerHeight = chartHeight - top - bottom
  const samples = history.length > 1 ? history : [
    { t: 0, radar: 0.1, acoustic: 0.05, vibration: 0.04, confidence: 0 },
    { t: 30, radar: 0.14, acoustic: 0.06, vibration: 0.05, confidence: 0 },
  ]
  const maxT = Math.max(60, ...samples.map((sample) => sample.t))
  const x = (t: number) => left + (t / maxT) * innerWidth
  const y = (value: number) => top + (1 - Math.min(1, Math.max(0, value))) * innerHeight

  const buildPath = (key: 'radar' | 'acoustic' | 'vibration' | 'confidence') =>
    samples.map((sample, index) => `${index === 0 ? 'M' : 'L'} ${x(sample.t).toFixed(1)} ${y(sample[key]).toFixed(1)}`).join(' ')

  const series = [
    { key: 'radar' as const, color: '#2df08a', label: 'Radar' },
    { key: 'acoustic' as const, color: '#3fdcff', label: 'Acoustic' },
    { key: 'vibration' as const, color: '#b78cff', label: 'Vibration' },
    { key: 'confidence' as const, color: '#ffd447', label: 'Confidence' },
  ]

  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Live multi-channel telemetry chart"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={`chart-fade-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2df08a" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#2df08a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g>
        {[0, 0.25, 0.5, 0.75, 1].map((value) => (
          <g key={value}>
            <line x1={left} y1={y(value)} x2={width - right} y2={y(value)} stroke="rgba(90,160,130,0.12)" strokeWidth="1" />
            <text x={left - 8} y={y(value) + 3} fill="#5d7d6c" fontSize="8" textAnchor="end" fontFamily="Inter, sans-serif">
              {Math.round(value * 100)}
            </text>
          </g>
        ))}
        {Array.from({ length: 7 }).map((_, index) => {
          const t = (maxT / 6) * index
          return (
            <g key={index}>
              <line x1={x(t)} y1={top} x2={x(t)} y2={top + innerHeight} stroke="rgba(90,160,130,0.055)" strokeWidth="1" />
              <text x={x(t)} y={chartHeight - 8} fill="#5d7d6c" fontSize="8" textAnchor="middle" fontFamily="Inter, sans-serif">
                {Math.round(t)}s
              </text>
            </g>
          )
        })}
        <path d={`${buildPath('radar')} L ${width - right} ${top + innerHeight} L ${left} ${top + innerHeight} Z`} fill={`url(#chart-fade-${id})`} />
        {series.map((item) => (
          <path
            key={item.key}
            d={buildPath(item.key)}
            fill="none"
            stroke={item.color}
            strokeWidth={item.key === 'confidence' ? 1.1 : 1.5}
            strokeDasharray={item.key === 'confidence' ? '4 3' : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={item.key === 'confidence' ? 0.85 : 0.95}
            style={{ filter: `drop-shadow(0 0 3px ${item.color}55)` }}
          />
        ))}
        <line x1={left} y1={top + innerHeight} x2={width - right} y2={top + innerHeight} stroke="rgba(120,200,160,0.22)" />
        <line x1={left} y1={top} x2={left} y2={top + innerHeight} stroke="rgba(120,200,160,0.22)" />
      </g>
    </svg>
  )
}

interface GaugeProps {
  value: number
  label: string
  color?: string
}

export function Gauge({ value, label, color = '#2df08a' }: GaugeProps) {
  const id = useId().replace(/:/g, '')
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))
  const dash = (clamped / 100) * circumference

  return (
    <svg viewBox="0 0 180 180" className="gauge" role="img" aria-label={`${label}: ${Math.round(clamped)} percent`}>
      <defs>
        <linearGradient id={`gauge-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.65" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(90,160,130,0.12)" strokeWidth="10" />
      <circle
        cx="90"
        cy="90"
        r={radius}
        fill="none"
        stroke={`url(#gauge-${id})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform="rotate(-90 90 90)"
        style={{ filter: `drop-shadow(0 0 8px ${color}66)`, transition: 'stroke-dasharray 0.5s ease' }}
      />
      {Array.from({ length: 30 }).map((_, index) => {
        const angle = (index / 30) * Math.PI * 2
        const inner = 76
        const outer = index % 5 === 0 ? 82 : 80
        return (
          <line
            key={index}
            x1={90 + Math.cos(angle) * inner}
            y1={90 + Math.sin(angle) * inner}
            x2={90 + Math.cos(angle) * outer}
            y2={90 + Math.sin(angle) * outer}
            stroke={index / 30 <= clamped / 100 ? color : 'rgba(90,160,130,0.2)'}
            strokeWidth={index % 5 === 0 ? 1.4 : 0.8}
            opacity={index / 30 <= clamped / 100 ? 0.8 : 0.4}
          />
        )
      })}
      <circle cx="90" cy="90" r="3" fill={color} opacity="0.9" />
    </svg>
  )
}

export function IconWrap({ children }: { children: ReactNode }) {
  return <span className="icon-wrap">{children}</span>
}
