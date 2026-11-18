import type { CSSProperties } from 'react'
import type { FloorFilter, Scenario, Zone } from '../../types'

const toX = (x: number) => 320 + x * 38
const toY = (z: number) => 200 + z * 26

const FLOOR_LABEL: Record<Exclude<FloorFilter, 'all'>, string> = {
  1: 'GROUND FLOOR',
  2: 'LEVEL 02',
  3: 'LEVEL 03',
  4: 'LEVEL 04',
  5: 'LEVEL 05',
}

function zoneRect(zone: Zone) {
  const [x, , z] = zone.position
  const [width, , depth] = zone.size
  return {
    x: toX(x - width / 2),
    y: toY(z - depth / 2),
    width: width * 38,
    height: depth * 26,
  }
}

interface FloorPlanProps {
  scenario: Scenario
  floor: FloorFilter
  selectedZone: string | null
  onSelectZone: (id: string) => void
  evidence: number
}

export function FloorPlan({ scenario, floor, selectedZone, onSelectZone, evidence }: FloorPlanProps) {
  const label = floor === 'all' ? 'COMPOSITE PLAN · ALL LEVELS' : FLOOR_LABEL[floor]
  const victim = scenario.victim

  return (
    <svg
      viewBox="0 0 700 440"
      className="floor-plan__svg"
      role="img"
      aria-label={`Top-down floor plan for ${scenario.name}. ${label}.`}
    >
      <defs>
        <pattern id="plan-grid" width="19" height="13" patternUnits="userSpaceOnUse">
          <path d="M 19 0 L 0 0 0 13" fill="none" stroke="rgba(63,220,255,0.09)" strokeWidth="0.6" />
        </pattern>
        <pattern id="plan-rubble" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,95,86,0.32)" strokeWidth="1.4" />
        </pattern>
        <radialGradient id="plan-victim-glow">
          <stop offset="0%" stopColor="#ff5f56" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ff5f56" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ff5f56" stopOpacity="0" />
        </radialGradient>
        <filter id="plan-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="700" height="440" fill="url(#plan-grid)" />

      <g stroke="rgba(80,160,130,0.16)" strokeWidth="0.6">
        {Array.from({ length: 13 }).map((_, index) => (
          <line key={`v${index}`} x1={320 + (index - 6) * 38} y1="54" x2={320 + (index - 6) * 38} y2="346" />
        ))}
        {Array.from({ length: 10 }).map((_, index) => (
          <line key={`h${index}`} x1="40" y1={200 + (index - 5) * 26} x2="600" y2={200 + (index - 5) * 26} />
        ))}
      </g>

      <g fontFamily="Inter, sans-serif" fill="#5f9c86" fontSize="7" letterSpacing="0.12em">
        <text x="40" y="24">
          {label}
        </text>
        <text x="40" y="36">
          STRUCTURAL SURVEY · {scenario.structure.toUpperCase()}
        </text>
        <text x="660" y="24" textAnchor="end">
          SCALE 1:120
        </text>
        <text x="660" y="36" textAnchor="end">
          EVIDENCE {Math.round(evidence)}%
        </text>
      </g>

      {/* Building shell */}
      <path
        d="M 54 92 L 588 92 L 588 306 L 566 306 L 576 316 L 520 306 L 440 316 L 356 304 L 286 318 L 208 304 L 130 314 L 54 304 Z"
        fill="rgba(9,26,18,0.72)"
        stroke="rgba(120,220,175,0.55)"
        strokeWidth="1.4"
      />
      <path
        d="M 54 92 L 588 92 L 588 306 L 566 306 L 576 316 L 520 306 L 440 316 L 356 304 L 286 318 L 208 304 L 130 314 L 54 304 Z"
        fill="none"
        stroke="rgba(120,220,175,0.16)"
        strokeWidth="5"
      />

      {/* Intact west wing: rooms, corridor, stair and lift core */}
      <g stroke="rgba(120,220,175,0.3)" strokeWidth="0.9" fill="none">
        <line x1="250" y1="92" x2="250" y2="304" />
        <line x1="54" y1="200" x2="250" y2="200" />
        <line x1="150" y1="92" x2="150" y2="200" />
        <line x1="54" y1="148" x2="150" y2="148" />
        <line x1="150" y1="252" x2="250" y2="252" />
        <line x1="54" y1="252" x2="104" y2="252" />
      </g>

      <g fill="rgba(10,28,20,0.8)" stroke="rgba(120,220,175,0.38)" strokeWidth="0.9">
        <rect x="76" y="108" width="52" height="26" />
        <rect x="168" y="108" width="58" height="22" />
        <rect x="76" y="216" width="58" height="24" />
      </g>
      <g fontFamily="Inter, sans-serif" fill="#5f9c86" fontSize="6.5" letterSpacing="0.08em">
        <text x="80" y="124">STAIR A</text>
        <text x="172" y="122">LIFT 01</text>
        <text x="80" y="231">STAIR B</text>
      </g>

      {/* Collapsed east wing */}
      <path
        d="M 250 92 L 588 92 L 588 240 L 552 236 L 512 258 L 470 232 L 426 262 L 380 238 L 338 260 L 296 240 L 250 256 Z"
        fill="url(#plan-rubble)"
        opacity="0.75"
      />
      <path
        d="M 250 92 L 588 92 L 588 240 L 552 236 L 512 258 L 470 232 L 426 262 L 380 238 L 338 260 L 296 240 L 250 256 Z"
        fill="none"
        stroke="rgba(255,95,86,0.42)"
        strokeWidth="1"
        strokeDasharray="5 4"
      />
      <g fontFamily="Inter, sans-serif" fill="rgba(255,150,143,0.72)" fontSize="7" letterSpacing="0.12em">
        <text x="300" y="112">COLLAPSED VOID · UNSTABLE</text>
      </g>

      {/* Zones */}
      {scenario.zones.map((zone) => {
        const rect = zoneRect(zone)
        const isDim = floor !== 'all' && zone.floor !== floor
        const isSelected = selectedZone === zone.id
        return (
          <g
            key={zone.id}
            className={`floor-plan__zone ${isDim ? 'is-dim' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={() => onSelectZone(zone.id)}
            role="button"
            tabIndex={0}
            aria-label={`${zone.label} on floor ${zone.floor}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectZone(zone.id)
              }
            }}
            style={{ '--zone-color': zone.color } as CSSProperties}
          >
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx="4"
              fill={zone.color}
              fillOpacity={isDim ? 0.025 : isSelected ? 0.2 : 0.09}
              stroke={zone.color}
              strokeOpacity={isDim ? 0.25 : isSelected ? 0.95 : 0.62}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={isSelected ? undefined : '6 4'}
            />
            <circle cx={rect.x + 9} cy={rect.y + 10} r="2.4" fill={zone.color} filter="url(#plan-soft-glow)" />
            <text x={rect.x + 16} y={rect.y + 13} fill={isDim ? 'rgba(180,220,200,0.35)' : '#e6fff2'}>
              {zone.id} · {zone.kind.toUpperCase()}
            </text>
            <text x={rect.x + 9} y={rect.y + 27} fill={isDim ? 'rgba(140,180,160,0.3)' : zone.color} fontSize="7" opacity="0.9">
              F{zone.floor} · {zone.confidence}% CONF
            </text>
          </g>
        )
      })}

      {/* Victim marker */}
      {evidence >= 60 && (
        <g>
          <circle cx={toX(victim.position[0])} cy={toY(victim.position[2])} r="34" fill="url(#plan-victim-glow)" />
          <g filter="url(#plan-soft-glow)">
            <circle cx={toX(victim.position[0])} cy={toY(victim.position[2])} r="7" fill="none" stroke="#ff5f56" strokeWidth="1.2" />
            <circle cx={toX(victim.position[0])} cy={toY(victim.position[2])} r="2" fill="#ffd9d6" />
            <line x1={toX(victim.position[0]) - 13} y1={toY(victim.position[2])} x2={toX(victim.position[0]) - 5} y2={toY(victim.position[2])} stroke="#ff5f56" strokeWidth="1" />
            <line x1={toX(victim.position[0]) + 5} y1={toY(victim.position[2])} x2={toX(victim.position[0]) + 13} y2={toY(victim.position[2])} stroke="#ff5f56" strokeWidth="1" />
            <line x1={toX(victim.position[0])} y1={toY(victim.position[2]) - 13} x2={toX(victim.position[0])} y2={toY(victim.position[2]) - 5} stroke="#ff5f56" strokeWidth="1" />
            <line x1={toX(victim.position[0])} y1={toY(victim.position[2]) + 5} x2={toX(victim.position[0])} y2={toY(victim.position[2]) + 13} stroke="#ff5f56" strokeWidth="1" />
          </g>
          <text
            x={toX(victim.position[0]) + 18}
            y={toY(victim.position[2]) - 9}
            fill="#ffb3ad"
            fontFamily="Inter, sans-serif"
            fontSize="7.5"
            letterSpacing="0.08em"
          >
            {victim.id} · POSSIBLE CONTACT
          </text>
        </g>
      )}

      {/* Sensors */}
      {scenario.sensors.map((sensor) => (
        <g key={sensor.id}>
          <circle cx={toX(sensor.position[0])} cy={toY(sensor.position[2])} r="12" fill="none" stroke="rgba(63,220,255,0.28)" strokeWidth="0.8" strokeDasharray="2 3" />
          <circle cx={toX(sensor.position[0])} cy={toY(sensor.position[2])} r="4" fill="#0b2a2c" stroke="#3fdcff" strokeWidth="1" />
          <circle cx={toX(sensor.position[0])} cy={toY(sensor.position[2])} r="1.4" fill="#bff5ff" />
          <text
            x={toX(sensor.position[0]) + 9}
            y={toY(sensor.position[2]) + 12}
            fill="#7fd6e8"
            fontFamily="Inter, sans-serif"
            fontSize="7"
            letterSpacing="0.08em"
          >
            {sensor.id}
          </text>
        </g>
      ))}

      {/* Compass & scale */}
      <g transform="translate(632 366)">
        <circle r="17" fill="rgba(5,16,10,0.7)" stroke="rgba(120,220,175,0.3)" strokeWidth="0.8" />
        <path d="M 0 -11 L 4 4 L 0 1 L -4 4 Z" fill="#2df08a" />
        <text y="13" textAnchor="middle" fill="#82a894" fontFamily="Inter, sans-serif" fontSize="6.5">
          N
        </text>
      </g>
      <g transform="translate(54 366)">
        <line x1="0" y1="0" x2="76" y2="0" stroke="rgba(190,230,210,0.55)" strokeWidth="1" />
        <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(190,230,210,0.55)" strokeWidth="1" />
        <line x1="76" y1="-3" x2="76" y2="3" stroke="rgba(190,230,210,0.55)" strokeWidth="1" />
        <text y="12" fill="#82a894" fontFamily="Inter, sans-serif" fontSize="7" letterSpacing="0.08em">
          0 — 10 M
        </text>
      </g>
    </svg>
  )
}
