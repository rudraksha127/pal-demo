import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Wifi } from 'lucide-react'
import { MATERIALS, HEALTH_COLORS } from './SceneMaterials'
import { sensorMeta } from '../../rf/data'
import type { SensorNode } from '../../rf/types'
import * as THREE from 'three'

interface SensorNode3DProps {
  node: SensorNode
  selected: boolean
  onClick: () => void
}

export function SensorNode3D({ node, selected, onClick }: SensorNode3DProps) {
  const meta = sensorMeta(node.sensorType)
  const [hovered, setHovered] = useState(false)
  const timeRef = useRef(0)
  const pulsePhase = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime()
  })

  const isActive = node.health === 'nominal' && node.connection === 'connected'
  const color = isActive ? HEALTH_COLORS.online : node.health === 'degraded' ? HEALTH_COLORS.degraded : HEALTH_COLORS.offline

  return (
    <group onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Sensor housing */}
      <mesh
        position={node.position}
        scale={selected || hovered ? 1.15 : 1}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.35, 0.3, 0.5, 16]} />
        <meshPhysicalMaterial
          color={MATERIALS.sensor.housing.color}
          roughness={MATERIALS.sensor.housing.roughness}
          metalness={MATERIALS.sensor.housing.metalness}
          clearcoat={MATERIALS.sensor.housing.clearcoat}
          clearcoatRoughness={MATERIALS.sensor.housing.clearcoatRoughness}
        />
      </mesh>

      {/* Sensor lens */}
      <mesh
        position={[node.position[0], node.position[1] + 0.3, node.position[2]]}
        scale={selected || hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshPhysicalMaterial
          color={isActive ? MATERIALS.sensor.lensActive.color : MATERIALS.sensor.lens.color}
          roughness={isActive ? MATERIALS.sensor.lensActive.roughness : MATERIALS.sensor.lens.roughness}
          metalness={isActive ? MATERIALS.sensor.lensActive.metalness : MATERIALS.sensor.lens.metalness}
          transmission={isActive ? MATERIALS.sensor.lensActive.transmission : MATERIALS.sensor.lens.transmission}
          thickness={isActive ? MATERIALS.sensor.lens.thickness : MATERIALS.sensor.lens.thickness}
          ior={isActive ? MATERIALS.sensor.lens.ior : MATERIALS.sensor.lens.ior}
          clearcoat={isActive ? MATERIALS.sensor.lens.clearcoat : MATERIALS.sensor.lens.clearcoat}
          clearcoatRoughness={isActive ? MATERIALS.sensor.lens.clearcoatRoughness : MATERIALS.sensor.lens.clearcoatRoughness}
          emissive={isActive ? MATERIALS.sensor.lensActive.emissive : undefined}
          emissiveIntensity={isActive ? MATERIALS.sensor.lensActive.emissiveIntensity : 0}
        />
      </mesh>

      {/* Active pulse ring */}
      {isActive && (
        <mesh
          position={node.position}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.5 + Math.sin(timeRef.current * 2 + pulsePhase.current) * 0.3}
        >
          <ringGeometry args={[0.5, 0.6, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3 + 0.2 * Math.sin(timeRef.current * 3 + pulsePhase.current)}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Selection ring */}
      {(selected || hovered) && (
        <mesh
          position={[node.position[0], 0.05, node.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.8}
        >
          <ringGeometry args={[0.6, 0.65, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Label */}
      <Html
        position={[node.position[0], node.position[1] + 1.2, node.position[2]]}
        transform
        style={{
          pointerEvents: 'none',
          opacity: selected || hovered ? 1 : 0.7,
          transition: 'opacity 0.2s',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'rgba(11, 29, 21, 0.95)',
            border: `1px solid ${color}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color, fontWeight: 600, fontSize: '11px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
            {node.id}
          </div>
          <span style={{ color: 'var(--color-text-dim)', fontSize: '11px' }}>{meta.short}</span>
          <span
            className={`ds-badge ds-text-xs ${
              isActive ? 'ds-badge-success' : node.health === 'degraded' ? 'ds-badge-warning' : 'ds-badge-danger'
            }`}
          >
            {node.health}
          </span>
          {node.connection === 'connected' && <Wifi size={12} style={{ color: '#2df08a' }} />}
        </div>
      </Html>
    </group>
  )
}