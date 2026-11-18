import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { TriangleAlert } from 'lucide-react'
import { ZONE_STATUS_META } from '../../rf/data'
import type { SearchZone } from '../../rf/types'
import * as THREE from 'three'

interface ZoneVolumeProps {
  zone: SearchZone
  selected: boolean
  onClick: () => void
}

export function ZoneVolume({ zone, selected, onClick }: ZoneVolumeProps) {
  const statusMeta = ZONE_STATUS_META[zone.status]
  const [hovered, setHovered] = useState(false)
  const timeRef = useRef(0)

  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime()
  })

  const color = statusMeta.color
  const isCandidate = zone.status === 'possible_survivor' || zone.status === 'needs_verification'

  return (
    <group onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Zone volume */}
      <mesh
        position={[zone.center[0], zone.size[1] / 2, zone.center[2]]}
        scale={[zone.size[0], zone.size[1], zone.size[2]]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={selected || hovered ? 0.25 : isCandidate ? 0.18 : 0.1}
          roughness={0.8}
          metalness={0.05}
          transmission={0.1}
          thickness={0.5}
          ior={1.1}
        />
      </mesh>

      {/* Zone wireframe */}
      <mesh
        position={[zone.center[0], zone.size[1] / 2, zone.center[2]]}
        scale={[zone.size[0] * 1.005, zone.size[1] * 1.005, zone.size[2] * 1.005]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected || hovered ? 0.6 : 0.3}
          wireframe
        />
      </mesh>

      {/* Pulsing effect for candidate zones */}
      {isCandidate && (
        <mesh
          position={[zone.center[0], zone.size[1] / 2, zone.center[2]]}
          scale={[zone.size[0] * 1.02, zone.size[1] * 1.02, zone.size[2] * 1.02]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15 + 0.1 * Math.sin(timeRef.current * 4)}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Zone label */}
      <Html
        position={[zone.center[0], zone.center[1] + zone.size[1] / 2 + 1.5, zone.center[2]]}
        transform
        style={{
          pointerEvents: 'none',
          opacity: selected || hovered ? 1 : 0.8,
          transition: 'opacity 0.2s',
        }}
      >
        <div
          className="ds-flex ds-flex-center ds-gap-2"
          style={{
            padding: '6px 12px',
            borderRadius: '10px',
            background: 'rgba(11, 29, 21, 0.95)',
            border: `1px solid ${statusMeta.color}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ color: statusMeta.color, fontWeight: 600, fontSize: '12px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: statusMeta.color, marginRight: '6px' }} />
            {zone.label}
          </div>
          <span style={{ color: 'var(--color-text-dim)', fontSize: '11px', marginLeft: '4px' }}>
            {zone.name}
          </span>
          <span className="ds-badge ds-badge-neutral ds-text-xs" style={{ marginLeft: '4px' }}>
            {statusMeta.short}
          </span>
          {isCandidate && <TriangleAlert size={12} className="ds-text-amber ds-animate-pulse" />}
        </div>
      </Html>
    </group>
  )
}