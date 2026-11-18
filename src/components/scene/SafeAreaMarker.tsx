import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { ShieldCheck } from 'lucide-react'
import type { SafeArea } from '../../rf/types'
import * as THREE from 'three'

interface SafeAreaMarkerProps {
  area: SafeArea
  selected: boolean
  onClick: () => void
}

export function SafeAreaMarker({ area, selected, onClick }: SafeAreaMarkerProps) {
  const [hovered, setHovered] = useState(false)
  const pulseRef = useRef(0)

  useFrame(({ clock }) => {
    pulseRef.current = clock.getElapsedTime()
  })

  const [x, , z] = area.position
  const radius = 2

  return (
    <group onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Ground projection ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[x, 0.06, z]}
        scale={radius * 2}
      >
        <ringGeometry args={[0.45, 0.5, 64]} />
        <meshBasicMaterial
          color="#2df08a"
          transparent
          opacity={0.15 + 0.1 * Math.sin(pulseRef.current * 3)}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.05 + i * 0.01, z]}
          scale={radius * 2 + pulseRef.current * 0.3 + i * 0.5}
        >
          <ringGeometry args={[0.48, 0.5, 64]} />
          <meshBasicMaterial
            color="#2df08a"
            transparent
            opacity={(0.3 - i * 0.08) * (1 - (pulseRef.current * 0.3 + i * 0.2) % 1.5 / 1.5)}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Label */}
      <Html
        position={[x, 1.8, z]}
        transform
        style={{
          pointerEvents: 'none',
          opacity: selected || hovered ? 1 : 0.7,
          transition: 'opacity 0.2s',
        }}
      >
        <div
          className="ds-flex ds-flex-center ds-gap-1"
          style={{
            padding: '4px 10px',
            borderRadius: '10px',
            background: 'rgba(11, 29, 21, 0.95)',
            border: '1px solid #2df08a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#2df08a',
          }}
        >
          <ShieldCheck size={10} />
          <span>{area.id}</span>
          {area.state === 'safe' && <span className="ds-animate-pulse" style={{ marginLeft: '4px' }}>&bull;</span>}
        </div>
      </Html>
    </group>
  )
}