import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { SensorUnit } from '../../types'
import { SceneLabelSprite } from './Labels'

function RadarRings({ active, selected }: { active: boolean; selected: boolean }) {
  const rings = useRef<Array<THREE.Mesh | null>>([])
  const strength = active ? (selected ? 1 : 0.82) : 0.32

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    rings.current.forEach((ring, index) => {
      if (!ring) return
      const phase = (time * 0.22 + index * 0.25) % 1
      const scale = 0.45 + phase * 2.55
      ring.scale.setScalar(scale)
      const material = ring.material as THREE.MeshBasicMaterial
      material.opacity = (1 - phase) * 0.32 * strength
    })
  })

  return (
    <group position={[0, 0.025, 0]}>
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node
          }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.05, 1.12, 64]} />
          <meshBasicMaterial
            color="#3fdcff"
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.68, 48]} />
        <meshBasicMaterial color="#3fdcff" transparent opacity={0.4 * strength} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.46, 1.5, 64]} />
        <meshBasicMaterial color="#3fdcff" transparent opacity={0.16 * strength} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 20]} />
        <meshBasicMaterial color="#bff5ff" transparent opacity={0.9 * strength} depthWrite={false} toneMapped={false} />
      </mesh>

      {[0, Math.PI / 3, (Math.PI * 2) / 3].map((angle) => (
        <mesh key={`dome-${angle}`} rotation={[0, angle, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[2.02, 2.06, 64, 1, 0, Math.PI]} />
          <meshBasicMaterial
            color="#3fdcff"
            transparent
            opacity={0.16 * strength}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function SensorRig({
  sensor,
  active,
  selected,
  onSelect,
  showLabel,
}: {
  sensor: SensorUnit
  active: boolean
  selected: boolean
  onSelect: (id: string) => void
  showLabel: boolean
}) {
  return (
    <group position={sensor.position} scale={1.62}>
      <RadarRings active={active} selected={selected} />

      <group>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
          <group key={angle} rotation={[0, angle, 0]}>
            <mesh position={[0.24, 0.62, 0]} rotation={[0, 0, 0.34]} castShadow>
              <cylinderGeometry args={[0.022, 0.032, 1.3, 6]} />
              <meshStandardMaterial color="#33413d" roughness={0.55} metalness={0.55} />
            </mesh>
            <mesh position={[0.46, 0.035, 0]} castShadow>
              <cylinderGeometry args={[0.055, 0.075, 0.07, 8]} />
              <meshStandardMaterial color="#28322f" roughness={0.7} metalness={0.3} />
            </mesh>
          </group>
        ))}

        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.34, 0.24, 0.3]} />
          <meshStandardMaterial color="#263430" roughness={0.48} metalness={0.45} />
        </mesh>
        <mesh position={[0, 1.345, 0]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.025, 0.25]} />
          <meshStandardMaterial color="#1b2b36" roughness={0.35} metalness={0.55} />
        </mesh>
        <mesh position={[0, 1.51, 0]}>
          <cylinderGeometry args={[0.008, 0.012, 0.33, 5]} />
          <meshStandardMaterial color="#566a63" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0, 1.69, 0]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#3fdcff" toneMapped={false} />
        </mesh>

        <mesh position={[0, 1.2, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 16]} />
          <meshStandardMaterial
            color="#0d2528"
            emissive="#3fdcff"
            emissiveIntensity={selected ? 3 : 1.6}
            roughness={0.25}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 1.2, 0.245]}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial color="#bff5ff" toneMapped={false} />
        </mesh>

        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.39, 32]} />
          <meshBasicMaterial color="#3fdcff" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.25, 0.1]} color="#3fdcff" intensity={active ? 0.7 : 0.16} distance={4.5} decay={2} />
      </group>

      {showLabel && (
        <SceneLabelSprite
          title={sensor.id}
          color="#3fdcff"
          position={[0, 1.35, 0]}
          width={1.12}
          height={0.58}
          selected={selected}
          onClick={() => onSelect(sensor.id)}
        />
      )}
    </group>
  )
}

export function SensorMesh({
  sensors,
  active,
  selectedSensor,
  onSelectSensor,
  showLabels,
}: {
  sensors: SensorUnit[]
  active: boolean
  selectedSensor: string | null
  onSelectSensor: (id: string) => void
  showLabels: boolean
}) {
  return (
    <group>
      {sensors.map((sensor) => (
        <SensorRig
          key={sensor.id}
          sensor={sensor}
          active={active}
          selected={selectedSensor === sensor.id || selectedSensor === sensor.kind}
          onSelect={onSelectSensor}
          showLabel={showLabels}
        />
      ))}
    </group>
  )
}
