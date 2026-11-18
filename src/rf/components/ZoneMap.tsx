import { useRfFense } from '../RfFenseContext'
import { ZONE_STATUS_META } from '../data'

const mapX = (x: number) => 220 + x * 20
const mapY = (z: number) => 138 + z * 16

export function ZoneMap() {
  const { state, selectedZone, selectZone } = useRfFense()
  const collapsed = state.incident.collapseCompleteAt !== null
  const deployed = state.deploymentAt !== null
  const marked = state.safety.markedAt !== null

  return (
    <figure className="rf-map">
      <svg viewBox="0 0 440 280" role="img" aria-labelledby="rf-map-title rf-map-desc">
        <title id="rf-map-title">Site map of the Riverside Residential Block</title>
        <desc id="rf-map-desc">
          Three search zones, approved and rejected safe areas, deployed sensor nodes and the central gateway.
          All locations are illustrative.
        </desc>
        <defs>
          <pattern id="rf-map-rubble" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#b9a98d" strokeWidth="1.4" opacity="0.35" />
          </pattern>
          <linearGradient id="rf-map-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1711" />
            <stop offset="100%" stopColor="#08110c" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="440" height="280" rx="10" fill="url(#rf-map-ground)" />
        <g stroke="#143023" strokeWidth="1" opacity="0.7">
          {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="280" />
          ))}
          {[40, 80, 120, 160, 200, 240].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="440" y2={y} />
          ))}
        </g>

        <path d="M8 254 H432" stroke="#27352d" strokeWidth="2" strokeDasharray="10 8" />
        <text x="12" y="268" fill="#5d7d6c" fontSize="8" letterSpacing="1.4">
          PERIMETER ACCESS
        </text>

        <rect
          x={mapX(-1.7) - 60}
          y={mapY(-0.9) - 38}
          width="120"
          height="76"
          rx="2"
          fill="#24342b"
          stroke="#5f7a6b"
          strokeWidth="1.2"
        />
        <text x={mapX(-1.7)} y={mapY(-0.9)} textAnchor="middle" fill="#9db7a8" fontSize="8">
          MAIN TOWER
        </text>

        <rect
          x={mapX(3.3) - 34}
          y={mapY(-0.6) - 40}
          width="68"
          height="80"
          rx="2"
          fill={collapsed ? 'url(#rf-map-rubble)' : '#24342b'}
          stroke={collapsed ? '#b9a98d' : '#5f7a6b'}
          strokeWidth="1.2"
          strokeDasharray={collapsed ? '4 3' : undefined}
        />
        <text x={mapX(3.3)} y={mapY(-0.6)} textAnchor="middle" fill="#b7aa94" fontSize="8">
          {collapsed ? 'COLLAPSED' : 'EAST WING'}
        </text>

        {state.zones.map((zone) => {
          const meta = ZONE_STATUS_META[zone.status]
          const width = zone.size[0] * 20
          const height = zone.size[2] * 16
          const selected = selectedZone === zone.id
          return (
            <g
              key={zone.id}
              role="button"
              tabIndex={0}
              aria-label={`Zone ${zone.id}, ${zone.name}, ${meta.label}`}
              aria-pressed={selected}
              style={{ cursor: 'pointer' }}
              onClick={() => selectZone(selected ? null : zone.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  selectZone(selected ? null : zone.id)
                }
              }}
            >
              <rect
                x={mapX(zone.center[0]) - width / 2}
                y={mapY(zone.center[2]) - height / 2}
                width={width}
                height={height}
                rx="3"
                fill={meta.color}
                fillOpacity={selected ? 0.18 : 0.08}
                stroke={meta.color}
                strokeWidth={selected ? 2 : 1}
                strokeOpacity={selected ? 1 : 0.65}
              />
              <text
                x={mapX(zone.center[0])}
                y={mapY(zone.center[2]) - 3}
                textAnchor="middle"
                fill={meta.color}
                fontSize="11"
                fontWeight="700"
              >
                ZONE {zone.id}
              </text>
              <text
                x={mapX(zone.center[0])}
                y={mapY(zone.center[2]) + 10}
                textAnchor="middle"
                fill={meta.color}
                fontSize="7"
                opacity="0.85"
              >
                {meta.label.toUpperCase()}
              </text>
            </g>
          )
        })}

        {marked &&
          state.safety.areas.map((area) => {
            const safe = area.state === 'safe'
            const x = mapX(area.position[0])
            const y = mapY(area.position[2])
            return (
              <g key={area.id} aria-label={`Safe area ${area.id}, ${area.state}`}>
                {safe ? (
                  <>
                    <circle cx={x} cy={y} r="7" fill="#2df08a" fillOpacity="0.13" stroke="#2df08a" strokeWidth="1" />
                    <circle cx={x} cy={y} r="2.2" fill="#2df08a" />
                  </>
                ) : (
                  <g stroke="#ff5f56" strokeWidth="1.4">
                    <circle cx={x} cy={y} r="7" fill="#ff5f56" fillOpacity="0.1" />
                    <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
                    <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
                  </g>
                )}
                <text x={x + 9} y={y + 3} fill={safe ? '#8fe7bd' : '#ff8d86'} fontSize="7">
                  {area.id}
                </text>
              </g>
            )
          })}

        {deployed &&
          state.nodes.map((node) => {
            const failed = state.failureNodes.includes(node.id)
            const x = mapX(node.position[0])
            const y = mapY(node.position[2])
            return (
              <g key={node.id} aria-label={`Node ${node.id}, ${failed ? 'offline' : node.health}`}>
                {state.gateway.online && !failed && (
                  <line
                    x1={x}
                    y1={y}
                    x2={mapX(12)}
                    y2={mapY(-6.4)}
                    stroke="#3fdcff"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                    opacity="0.45"
                  />
                )}
                <rect
                  x={x - 5}
                  y={y - 5}
                  width="10"
                  height="10"
                  rx="2"
                  fill={failed ? '#3a1d1a' : '#12241b'}
                  stroke={failed ? '#ff5f56' : '#5cffab'}
                  strokeWidth="1.2"
                />
                <text x={x} y={y + 2.5} textAnchor="middle" fill={failed ? '#ff8d86' : '#b9ffdc'} fontSize="6">
                  {node.sequence}
                </text>
                {failed && (
                  <text x={x} y={y - 9} textAnchor="middle" fill="#ff8d86" fontSize="7" fontWeight="700">
                    FAILED
                  </text>
                )}
              </g>
            )
          })}

        {deployed && (
          <g>
            <rect x={mapX(12) - 8} y={mapY(-6.4) - 8} width="16" height="16" rx="3" fill="#0d2028" stroke="#3fdcff" strokeWidth="1.3" />
            <circle cx={mapX(12)} cy={mapY(-6.4)} r="2" fill={state.gateway.online ? '#3fdcff' : '#72847a'} />
            <text x={mapX(12) + 12} y={mapY(-6.4) + 3} fill="#8fd9e8" fontSize="7">
              GATEWAY
            </text>
          </g>
        )}

        <g transform="translate(404 26)">
          <circle r="12" fill="none" stroke="#3c5a49" strokeWidth="1" />
          <path d="M0 -8 4 4 0 1 -4 4Z" fill="#8fe7bd" />
          <text y="-16" textAnchor="middle" fill="#7fa28f" fontSize="7">
            N
          </text>
        </g>
        <g transform="translate(366 262)" fill="#5d7d6c" fontSize="7">
          <line x1="0" y1="0" x2="30" y2="0" stroke="#5d7d6c" strokeWidth="1.4" />
          <text x="0" y="-4">
            10 m
          </text>
        </g>
      </svg>
      <figcaption>
        Illustrative site map. Zone colours show the current derived status; a failed node is never shown as an
        empty zone.
      </figcaption>
    </figure>
  )
}
