import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { SensorUnit } from '../../types'
import { SceneLabelSprite } from './Labels'

function RadarRings({ active, selected }: { active: boolean; selected: boolean }) {
  const rings = useRef<Array<THREE.Mesh | null>>([])
  const strength = active ? (selected ? 1.2 : 0.85) : 0.3

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    rings.current.forEach((ring, index) => {
      if (!ring) return
      const phase = (time * 0.28 + index * 0.25) % 1
      const scale = 0.45 + phase * 2.8
      ring.scale.setScalar(scale)
      const material = ring.material as THREE.MeshBasicMaterial
      material.opacity = (1 - phase) * 0.38 * strength
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
          <ringGeometry args={[1.05, 1.14, 64]} />
          <meshBasicMaterial
            color="#2df08a"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.68, 48]} />
        <meshBasicMaterial color="#3fdcff" transparent opacity={0.45 * strength} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.65, 1.7, 64]} />
        <meshBasicMaterial color="#2df08a" transparent opacity={0.22 * strength} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color="#afffe0" transparent opacity={0.9 * strength} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── Volumetric Radar Sweep Cone & Beam ────────────────────────────
function RadarBeamSweep({
  sensorPos,
  targetPos = [1.5, 3.2, 0.5],
  active,
  color = '#2df08a',
}: {
  sensorPos: [number, number, number]
  targetPos?: [number, number, number]
  active: boolean
  color?: string
}) {
  const coneRef = useRef<THREE.Mesh>(null)

  const { dist, mid, rot } = useMemo(() => {
    const p1 = new THREE.Vector3(...sensorPos).add(new THREE.Vector3(0, 1.9, 0))
    const p2 = new THREE.Vector3(...targetPos)
    const delta = p2.clone().sub(p1)
    const d = delta.length()
    const m = p1.clone().add(delta.clone().multiplyScalar(0.5))

    const orientation = new THREE.Matrix4()
    orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0))
    const euler = new THREE.Euler().setFromRotationMatrix(orientation)

    return { dir: delta.normalize(), dist: d, mid: m, rot: euler }
  }, [sensorPos, targetPos])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = active ? 0.08 + Math.sin(t * 3.5 + sensorPos[0]) * 0.03 : 0.02
    }
  })

  if (!active) return null

  return (
    <group>
      {/* Volumetric Scan Cone */}
      <mesh
        ref={coneRef}
        position={[mid.x, mid.y, mid.z]}
        rotation={[rot.x + Math.PI / 2, rot.y, rot.z]}
      >
        <cylinderGeometry args={[0.08, 1.8, dist, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Laser Triangulation Ray */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                sensorPos[0],
                sensorPos[1] + 1.9,
                sensorPos[2],
                targetPos[0],
                targetPos[1],
                targetPos[2],
              ]),
              3,
            ]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </line>
    </group>
  )
}

function SensorRig({
  sensor,
  active,
  selected,
  onSelect,
  showLabel,
  victimPos,
}: {
  sensor: SensorUnit
  active: boolean
  selected: boolean
  onSelect: (id: string) => void
  showLabel: boolean
  victimPos?: [number, number, number]
}) {
  const headRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (headRef.current && active) {
      const t = state.clock.getElapsedTime()
      headRef.current.rotation.y = Math.sin(t * 1.5 + sensor.position[0]) * 0.45
    }
  })

  return (
    <group position={sensor.position} scale={1.62}>
      <RadarRings active={active} selected={selected} />

      {/* Base Tripod Structure */}
      <group
        onClick={(e) => {
          e.stopPropagation()
          onSelect(sensor.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
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

        {/* Central Mast */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 1.3, 8]} />
          <meshStandardMaterial color="#22302b" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Articulated Sensor Head */}
        <group ref={headRef} position={[0, 1.25, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.34, 0.24, 0.3]} />
            <meshStandardMaterial color={selected ? '#1a4032' : '#263430'} roughness={0.48} metalness={0.45} />
          </mesh>
          <mesh position={[0, 0.145, 0]} rotation={[-0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.35, 0.025, 0.25]} />
            <meshStandardMaterial color="#1b2b36" roughness={0.35} metalness={0.55} />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <cylinderGeometry args={[0.008, 0.012, 0.33, 5]} />
            <meshStandardMaterial color="#566a63" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.49, 0]}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshBasicMaterial color={active ? '#2df08a' : '#ffd447'} toneMapped={false} />
          </mesh>

          {/* Radar Antenna Dish / Emitter */}
          <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.12, 16]} />
            <meshStandardMaterial
              color="#0d2528"
              emissive={active ? '#2df08a' : '#ffd447'}
              emissiveIntensity={selected ? 3.5 : 2.0}
              roughness={0.25}
              metalness={0.3}
            />
          </mesh>
          <mesh position={[0, 0, 0.245]}>
            <circleGeometry args={[0.05, 16]} />
            <meshBasicMaterial color={active ? '#bfffe0' : '#fff4cc'} toneMapped={false} />
          </mesh>
        </group>

        {/* Glowing Pedestal Ring */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.39, 32]} />
          <meshBasicMaterial
            color={active ? '#2df08a' : '#ffd447'}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          position={[0, 1.25, 0.1]}
          color={active ? '#2df08a' : '#ffd447'}
          intensity={active ? 0.9 : 0.2}
          distance={4.5}
          decay={2}
        />
      </group>

      {/* Floating 3D Label */}
      {showLabel && (
        <SceneLabelSprite
          title={sensor.id}
          color={active ? '#2df08a' : '#3fdcff'}
          position={[0, 1.5, 0]}
          width={1.12}
          height={0.58}
          selected={selected}
          onClick={() => onSelect(sensor.id)}
        />
      )}

      {/* Volumetric Scan Sweep */}
      <RadarBeamSweep
        sensorPos={sensor.position}
        targetPos={victimPos}
        active={active}
        color={sensor.id === 'R-01' ? '#2df08a' : sensor.id === 'R-02' ? '#3fdcff' : '#b78cff'}
      />
    </group>
  )
}

export function SensorMesh({
  sensors,
  active,
  selectedSensor,
  onSelectSensor,
  showLabels,
  victimPos,
}: {
  sensors: SensorUnit[]
  active: boolean
  selectedSensor: string | null
  onSelectSensor: (id: string) => void
  showLabels: boolean
  victimPos?: [number, number, number]
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
          victimPos={victimPos}
        />
      ))}
    </group>
  )
}
