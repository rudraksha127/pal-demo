import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Radio, ScanLine, ShieldCheck, TriangleAlert } from 'lucide-react'
import { SceneLabelSprite } from '../../components/scene/Labels'
import { mulberry32, randomBetween } from '../../components/scene/utils'
import { useRfFense } from '../RfFenseContext'
import { SCENES, ZONE_STATUS_META, sensorMeta } from '../data'
import type { SafeArea, SearchZone, SensorNode } from '../types'

const CONCRETE = ['#9a9688', '#8b8779', '#7c786c', '#a6a193', '#706d62']

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const SceneReducedMotion = createContext(false)

function useSceneReducedMotion() {
  return useContext(SceneReducedMotion)
}

function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree()

  useEffect(() => {
    const narrow = size.width < 680
    camera.position.set(narrow ? 19 : 14.5, narrow ? 14 : 10.5, narrow ? 25 : 17)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = narrow ? 52 : 44
      camera.updateProjectionMatrix()
    }
    camera.lookAt(1.2, 2.2, 0)
  }, [camera, size.width])

  useFrame(({ clock }) => {
    if (reduced) return
    const t = clock.getElapsedTime()
    const narrow = size.width < 680
    camera.position.x = (narrow ? 19 : 14.5) + Math.sin(t * 0.07) * 0.45
    camera.position.y = (narrow ? 14 : 10.5) + Math.cos(t * 0.05) * 0.18
    camera.lookAt(1.2, 2.3, 0)
  })

  return null
}

function ShakingGroup({
  active,
  reduced,
  children,
}: {
  active: boolean
  reduced: boolean
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  const startRef = useRef(performance.now())

  useEffect(() => {
    if (active) startRef.current = performance.now()
  }, [active])

  useFrame(() => {
    const group = ref.current
    if (!group) return
    if (!active || reduced) {
      group.position.set(0, 0, 0)
      group.rotation.set(0, 0, 0)
      return
    }
    const t = (performance.now() - startRef.current) / 1000
    const fade = Math.max(0, 1 - t / 3.3)
    const amp = 0.06 * fade
    group.position.x = Math.sin(t * 27) * amp
    group.position.z = Math.cos(t * 23) * amp * 0.6
    group.rotation.z = Math.sin(t * 19) * amp * 0.35
  })

  return <group ref={ref}>{children}</group>
}

function Tower({
  position,
  floors,
  width,
  depth,
  damaged = false,
}: {
  position: [number, number, number]
  floors: number
  width: number
  depth: number
  damaged?: boolean
}) {
  return (
    <group position={position}>
      {Array.from({ length: floors }).map((_, floor) => {
        const y = floor * 1.3
        return (
          <group key={floor} position={[0, y, 0]}>
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, 0.22, depth]} />
              <meshStandardMaterial color={floor % 2 === 0 ? '#928f83' : '#868377'} roughness={0.94} />
            </mesh>
            {[
              [-width / 2 + 0.16, -depth / 2 + 0.16],
              [width / 2 - 0.16, -depth / 2 + 0.16],
              [-width / 2 + 0.16, depth / 2 - 0.16],
              [width / 2 - 0.16, depth / 2 - 0.16],
            ].map(([x, z], index) => (
              <mesh key={index} position={[x, 0.68, z]} castShadow>
                <boxGeometry args={[0.18, 1.32, 0.18]} />
                <meshStandardMaterial color="#7d7a6f" roughness={0.96} />
              </mesh>
            ))}
            {Array.from({ length: 4 }).map((_, index) => {
              const lit = !damaged || (floor * 4 + index) % 3 !== 0
              const usable = width - 1.4
              return (
                <mesh
                  key={index}
                  position={[-usable / 2 + (usable / 6) * (index * 2 + 1) * 0.5 + 0.1, 0.68, depth / 2 + 0.02]}
                >
                  <boxGeometry args={[usable / 6, 0.56, 0.05]} />
                  <meshStandardMaterial
                    color={lit ? '#ffe6a8' : '#1d261f'}
                    emissive={lit ? '#d9a94f' : '#000000'}
                    emissiveIntensity={lit ? 0.55 : 0}
                    roughness={0.5}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}
      <mesh position={[0, floors * 1.3 + 0.12, 0]} castShadow>
        <boxGeometry args={[width + 0.12, 0.24, depth + 0.12]} />
        <meshStandardMaterial color="#6f6c61" roughness={0.96} />
      </mesh>
    </group>
  )
}

function CollapsedWing() {
  return (
    <group position={[3.3, 0, -0.6]}>
      <Tower position={[0, 0, 0]} floors={2} width={3.2} depth={4.8} damaged />
      <mesh position={[0.2, 2.55, 0.4]} rotation={[0.35, 0.28, 0.55]} castShadow>
        <boxGeometry args={[3.5, 0.28, 4.2]} />
        <meshStandardMaterial color="#6f6c61" roughness={0.98} />
      </mesh>
      <mesh position={[-0.1, 2.1, -1.6]} rotation={[0.1, 0.4, -0.35]} castShadow>
        <boxGeometry args={[0.18, 2.8, 0.18]} />
        <meshStandardMaterial color="#4c4a43" roughness={0.9} metalness={0.25} />
      </mesh>
      <mesh position={[0.8, 1.7, 1.3]} rotation={[0.6, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.14, 2.2, 0.14]} />
        <meshStandardMaterial color="#514e46" roughness={0.9} metalness={0.25} />
      </mesh>
    </group>
  )
}

function Rubble({ reduced }: { reduced: boolean }) {
  const blocks = useMemo(() => {
    const random = mulberry32(20260417)
    return Array.from({ length: 68 }).map((_, index) => ({
      key: index,
      position: [
        randomBetween(random, 0.4, 6.6),
        randomBetween(random, 0.08, 0.55),
        randomBetween(random, -3.8, 4.1),
      ] as [number, number, number],
      rotation: [
        randomBetween(random, 0, 0.7),
        randomBetween(random, 0, Math.PI),
        randomBetween(random, 0, 0.7),
      ] as [number, number, number],
      size: [
        randomBetween(random, 0.32, 1.15),
        randomBetween(random, 0.14, 0.48),
        randomBetween(random, 0.34, 1.05),
      ] as [number, number, number],
      color: CONCRETE[Math.floor(random() * CONCRETE.length)],
    }))
  }, [])

  const dust = useMemo(() => {
    const random = mulberry32(731)
    return Array.from({ length: 16 }).map((_, index) => ({
      key: index,
      position: [
        randomBetween(random, 1.0, 6.4),
        randomBetween(random, 0.4, 1.8),
        randomBetween(random, -3.2, 3.8),
      ] as [number, number, number],
      scale: randomBetween(random, 0.6, 1.7),
    }))
  }, [])

  const driftRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!driftRef.current || reduced) return
    driftRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.05) * 0.02
  })

  return (
    <group ref={driftRef}>
      {blocks.map((block) => (
        <mesh
          key={block.key}
          position={block.position}
          rotation={block.rotation}
          scale={block.size}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={block.color} roughness={0.98} />
        </mesh>
      ))}
      <group>
        {dust.map((cloud) => (
          <mesh key={cloud.key} position={cloud.position} scale={cloud.scale}>
            <sphereGeometry args={[0.55, 10, 10]} />
            <meshBasicMaterial color="#b7ab93" transparent opacity={0.07} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Person({
  position,
  shirt = '#e0b27c',
  helmet = false,
  rotation = 0,
}: {
  position: [number, number, number]
  shirt?: string
  helmet?: boolean
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.36, 4, 8]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.77, 0]} castShadow>
        <sphereGeometry args={[0.125, 12, 12]} />
        <meshStandardMaterial color="#c99068" roughness={0.8} />
      </mesh>
      {helmet && (
        <mesh position={[0, 0.84, 0]} castShadow>
          <sphereGeometry args={[0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ffb01f" roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

function Residents() {
  const people: Array<[number, number, number, string, number]> = [
    [-3.1, 0, 3.3, '#d9c39a', 0.4],
    [-2.4, 0, 3.7, '#b9d4cf', -0.2],
    [-1.5, 0, 3.1, '#d8a7a0', 0.9],
    [0.2, 0, 3.6, '#a9bdd6', 0.1],
    [-4.4, 0, 2.4, '#cbb59a', 0.7],
  ]
  return (
    <group>
      {people.map(([x, y, z, shirt, rotation], index) => (
        <Person key={index} position={[x, y, z]} shirt={shirt} rotation={rotation} />
      ))}
    </group>
  )
}

function RescueCrew() {
  const people: Array<[number, number, number, number]> = [
    [7.1, 0, 6.2, 0.3],
    [8.2, 0, 6.8, -0.4],
    [9.4, 0, 5.9, 0.9],
    [6.6, 0, 4.6, 0.1],
    [10.4, 0, 4.4, -0.7],
    [5.8, 0, 2.6, 0.5],
  ]
  return (
    <group>
      {people.map(([x, y, z, rotation], index) => (
        <Person key={index} position={[x, y, z]} shirt="#e9f0ea" helmet rotation={rotation} />
      ))}
    </group>
  )
}

function Vehicle({
  position,
  rotation = 0,
  ambulance = false,
}: {
  position: [number, number, number]
  rotation?: number
  ambulance?: boolean
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[2.8, 0.9, 1.35]} />
        <meshStandardMaterial color="#e8eee9" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.62, 0.69]}>
        <boxGeometry args={[2.82, 0.2, 0.02]} />
        <meshStandardMaterial color={ambulance ? '#ff5f56' : '#2df08a'} emissive={ambulance ? '#8a1410' : '#0c5a33'} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.45, 1.14, 0]} castShadow>
        <boxGeometry args={[1.25, 0.42, 1.22]} />
        <meshStandardMaterial color="#f4f7f4" roughness={0.6} />
      </mesh>
      {[-0.9, 0.9].map((x) =>
        [-0.68, 0.68].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.28, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.18, 14]} />
            <meshStandardMaterial color="#1a1e1b" roughness={0.9} />
          </mesh>
        )),
      )}
      {ambulance && (
        <group position={[0, 1.14, 0.63]}>
          <mesh>
            <boxGeometry args={[0.52, 0.14, 0.03]} />
            <meshBasicMaterial color="#ff5f56" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.14, 0.52, 0.03]} />
            <meshBasicMaterial color="#ff5f56" />
          </mesh>
        </group>
      )}
    </group>
  )
}

function MedicalTent() {
  return (
    <group position={[9.1, 0, -5.5]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 1.45, 2.2]} />
        <meshStandardMaterial color="#e8eee9" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.1, 0.65, 4]} />
        <meshStandardMaterial color="#dce6df" roughness={0.8} />
      </mesh>
      <group position={[0, 0.9, 1.12]}>
        <mesh>
          <boxGeometry args={[0.62, 0.16, 0.03]} />
          <meshBasicMaterial color="#ff5f56" />
        </mesh>
        <mesh>
          <boxGeometry args={[0.16, 0.62, 0.03]} />
          <meshBasicMaterial color="#ff5f56" />
        </mesh>
      </group>
      <SceneLabelSprite
        title="MEDICAL"
        subtitle="CASUALTY COLLECTION"
        color="#ff5f56"
        position={[0, 2.45, 0]}
        width={2.3}
        height={0.62}
      />
    </group>
  )
}

function SafeMarker({ area }: { area: SafeArea }) {
  const safe = area.state === 'safe'
  const color = safe ? '#2df08a' : '#ff5f56'
  return (
    <group position={[area.position[0], 0, area.position[2]]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color={color} transparent opacity={safe ? 0.36 : 0.3} />
      </mesh>
      {safe ? (
        <>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.9, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <boxGeometry args={[0.28, 0.18, 0.04]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </>
      ) : (
        <group position={[0, 0.38, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.55, 0.05, 0.05]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.55, 0.05, 0.05]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      )}
      <SceneLabelSprite
        title={area.id}
        subtitle={safe ? 'APPROVED' : 'REJECTED'}
        color={color}
        position={[0, 1.25, 0]}
        width={1.15}
        height={0.4}
      />
    </group>
  )
}

function PulseRing({ color, speed = 1, size = 1 }: { color: string; speed?: number; size?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const reduced = useSceneReducedMotion()
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return
    const phase = (clock.getElapsedTime() * speed) % 1
    ref.current.scale.setScalar(size * (0.45 + phase * 1.9))
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.42
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]} scale={reduced ? size : 1}>
      <ringGeometry args={[0.5, 0.57, 40]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
    </mesh>
  )
}

function ZoneMarker({ zone }: { zone: SearchZone }) {
  const { selectedZone, selectZone } = useRfFense()
  const selected = selectedZone === zone.id
  const meta = ZONE_STATUS_META[zone.status]
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(zone.size[0], zone.size[2])),
    [zone.size],
  )

  return (
    <group position={[zone.center[0], 0, zone.center[2]]}>
      <mesh
        position={[0, 0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation()
          selectZone(selected ? null : zone.id)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <planeGeometry args={[zone.size[0], zone.size[2]]} />
        <meshBasicMaterial color={meta.color} transparent opacity={selected ? 0.24 : 0.12} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 0]}>
        <lineBasicMaterial color={meta.color} transparent opacity={selected ? 0.95 : 0.5} />
      </lineSegments>
      {selected && <PulseRing color={meta.color} speed={0.75} size={1.4} />}
      {zone.status === 'human_verified' && (
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.06, 0.1, 1.2, 8]} />
          <meshBasicMaterial color="#5cffab" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      )}
      <SceneLabelSprite
        title={zone.label}
        subtitle={meta.short.toUpperCase()}
        color={meta.color}
        position={[0, 1.15, 0]}
        width={2.5}
        height={0.68}
        selected={selected}
        onClick={() => selectZone(selected ? null : zone.id)}
      />
    </group>
  )
}

function ScanPulse({ color = '#3fdcff' }: { color?: string }) {
  const rings = useRef<Array<THREE.Mesh | null>>([])
  const reduced = useSceneReducedMotion()
  useFrame(({ clock }) => {
    if (reduced) return
    const time = clock.getElapsedTime()
    rings.current.forEach((ring, index) => {
      if (!ring) return
      const phase = (time * 0.45 + index * 0.33) % 1
      ring.scale.setScalar(0.4 + phase * 4.3)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.26
    })
  })
  return (
    <group position={[0, 0.07, 0]}>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          ref={(node) => {
            rings.current[index] = node
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={reduced ? 1.35 + index * 0.55 : 1}
        >
          <ringGeometry args={[0.5, 0.56, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function FailurePulse() {
  const ref = useRef<THREE.Mesh>(null)
  const reduced = useSceneReducedMotion()
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return
    const opacity = 0.25 + Math.abs(Math.sin(clock.getElapsedTime() * 2.2)) * 0.45
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = opacity
  })
  return (
    <group position={[0, 0.08, 0]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.78, 32]} />
        <meshBasicMaterial color="#ff5f56" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.7, 0.06, 0.06]} />
        <meshBasicMaterial color="#ff5f56" />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.7, 0.06, 0.06]} />
        <meshBasicMaterial color="#ff5f56" />
      </mesh>
    </group>
  )
}

function NodeStation({ node, scanning }: { node: SensorNode; scanning: boolean }) {
  const { selectedNode, selectNode, state } = useRfFense()
  const meta = sensorMeta(node.sensorType)
  const offline = node.health === 'offline'
  const color = offline ? '#ff5f56' : node.health === 'degraded' ? '#ffb454' : '#5cffab'
  const selected = selectedNode === node.id
  const failure = state.failureNodes.includes(node.id)

  return (
    <group
      position={[node.position[0], 0, node.position[2]]}
      onClick={(event) => {
        event.stopPropagation()
        selectNode(selected ? null : node.id)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {[
        [0.24, 0.15, 0],
        [-0.2, 0.15, 0.2],
        [-0.05, 0.15, -0.24],
      ].map(([x, , z], index) => (
        <mesh key={index} position={[x, 0.32, z]} rotation={[0, index * 2.1, 0.28]} castShadow>
          <boxGeometry args={[0.05, 0.68, 0.05]} />
          <meshStandardMaterial color="#6b7c70" roughness={0.7} metalness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.3, 0.24, 0.22]} />
        <meshStandardMaterial color={offline ? '#5a2b28' : '#35463c'} roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.36, 5]} />
        <meshStandardMaterial color="#a7bdb1" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.17, 0]}>
        <sphereGeometry args={[0.065, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={offline ? 0.35 : 1.3} />
      </mesh>
      {scanning && !offline && <ScanPulse />}
      {failure && <FailurePulse />}
      <SceneLabelSprite
        title={node.id}
        subtitle={`ZONE ${node.zoneId} · ${meta.short.toUpperCase()}`}
        color={color}
        position={[0, 1.65, 0]}
        width={1.95}
        height={0.56}
        selected={selected}
        onClick={() => selectNode(selected ? null : node.id)}
      />
    </group>
  )
}

function Gateway({ online, scanning }: { online: boolean; scanning: boolean }) {
  const color = online ? '#3fdcff' : '#7b8a80'
  const ringRef = useRef<THREE.Mesh>(null)
  const reduced = useSceneReducedMotion()
  useFrame(({ clock }) => {
    if (!ringRef.current || reduced) return
    const t = (clock.getElapsedTime() * 0.6) % 1
    ringRef.current.scale.setScalar(0.5 + t * 2.6)
    ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = online ? (1 - t) * 0.35 : 0.08
  })
  return (
    <group position={[12, 0, -6.4]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.55, 1.1]} />
        <meshStandardMaterial color="#3b4a41" roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 2.3, 8]} />
        <meshStandardMaterial color="#8ba295" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.72, 0]}>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={online ? 1.4 : 0.2} />
      </mesh>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, 0]}
        scale={reduced ? 1.35 : 1}
      >
        <ringGeometry args={[0.9, 1.0, 40]} />
        <meshBasicMaterial color={color} transparent opacity={online ? 0.3 : 0.08} depthWrite={false} />
      </mesh>
      {online && scanning && <ScanPulse color="#3fdcff" />}
      <SceneLabelSprite
        title="GATEWAY"
        subtitle={online ? 'CONNECTED · LOCAL MESH' : 'OFFLINE'}
        color={color}
        position={[0, 3.15, 0]}
        width={2.5}
        height={0.7}
      />
    </group>
  )
}

function CommLink({ from, to, active }: { from: [number, number, number]; to: [number, number, number]; active: boolean }) {
  const beam = useMemo(() => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const direction = end.clone().sub(start)
    const length = direction.length()
    const midpoint = start.clone().add(end).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    )
    return { length, midpoint, quaternion }
  }, [from, to])

  if (!active) return null

  return (
    <mesh position={beam.midpoint} quaternion={beam.quaternion}>
      <cylinderGeometry args={[0.018, 0.018, beam.length, 5]} />
      <meshBasicMaterial color="#3fdcff" transparent opacity={0.28} depthWrite={false} />
    </mesh>
  )
}

function ExtractionCue() {
  const { state } = useRfFense()
  const startRef = useRef(performance.now())
  const ref = useRef<THREE.Group>(null)
  const reduced = useSceneReducedMotion()
  const verification = state.verifications[state.verifications.length - 1]
  const zone = state.zones.find((item) => item.id === verification?.zoneId)
  const active = state.extraction !== null

  useEffect(() => {
    if (active) startRef.current = performance.now()
  }, [active])

  useFrame(() => {
    if (!ref.current || !zone) return
    const t = reduced ? 1 : active ? Math.min(1, (performance.now() - startRef.current) / 4200) : 0
    const startX = zone.center[0]
    const startZ = zone.center[2]
    ref.current.position.set(
      startX + (9.1 - startX) * t,
      0.42,
      startZ + (-5.5 - startZ) * t,
    )
  })

  if (!verification || !zone) return null

  return (
    <group ref={ref}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.12, 0.55]} />
        <meshStandardMaterial color="#e8eee9" roughness={0.7} />
      </mesh>
      <mesh position={[0.55, 0.09, 0]}>
        <boxGeometry args={[0.18, 0.06, 0.4]} />
        <meshBasicMaterial color="#ff5f56" />
      </mesh>
      <mesh position={[-0.55, 0.09, 0]}>
        <boxGeometry args={[0.18, 0.06, 0.4]} />
        <meshBasicMaterial color="#ff5f56" />
      </mesh>
    </group>
  )
}

function SiteScene({ reduced }: { reduced: boolean }) {
  const { state, scene, selectZone } = useRfFense()
  const quake = state.incident.earthquakeAt !== null
  const collapsed = state.incident.collapseCompleteAt !== null
  const rescue = state.incident.rescueArrivalAt !== null
  const zones = state.zonesConfirmedAt !== null
  const deployed = state.deploymentAt !== null
  const marked = state.safety.markedAt !== null
  const scanning =
    state.scanning.startedAt !== null && state.scanning.completedAt === null && state.gateway.online
  const verifiedZone = state.verifications[state.verifications.length - 1]?.zoneId ?? null

  return (
    <>
      <CameraRig reduced={reduced} />
      <fog attach="fog" args={['#0a1710', 26, 56]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#a7d8c0', '#0a1610', 0.7]} />
      <directionalLight
        position={[9, 15, 7]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[-11, 7, -9]} intensity={0.45} color="#83e8ff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[54, 54]} />
        <meshStandardMaterial color="#0d1a13" roughness={1} />
      </mesh>
      <gridHelper args={[44, 44, '#1c4632', '#0d2419']} position={[0, 0.005, 0]} />
      <mesh position={[0, 0.01, 7.7]} receiveShadow>
        <boxGeometry args={[34, 0.02, 3.4]} />
        <meshStandardMaterial color="#101512" roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 7.7]}>
        <boxGeometry args={[1.2, 0.03, 3.4]} />
        <meshStandardMaterial color="#27332c" roughness={1} />
      </mesh>

      {[-13, -9.5, 10.5, 14.5].map((x, index) => (
        <mesh key={x} position={[x, 2 + index * 0.7, -14 - (index % 2) * 3]} castShadow>
          <boxGeometry args={[3.4, 4 + index * 1.4, 3]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#1a2a21' : '#14221b'} roughness={1} />
        </mesh>
      ))}

      <ShakingGroup active={quake && !collapsed} reduced={reduced}>
        <Tower position={[-1.7, 0, -0.9]} floors={5} width={5.6} depth={4.4} damaged={collapsed} />
        {collapsed ? (
          <CollapsedWing />
        ) : (
          <Tower position={[3.3, 0, -0.6]} floors={5} width={3.2} depth={4.8} />
        )}
      </ShakingGroup>

      {collapsed && <Rubble reduced={reduced} />}
      {!quake && <Residents />}

      {rescue && (
        <>
          <Vehicle position={[9.2, 0, 6.6]} rotation={-0.25} />
          <Vehicle position={[11.4, 0, 4.6]} rotation={0.4} ambulance />
          <RescueCrew />
          <MedicalTent />
        </>
      )}

      {marked && state.safety.areas.map((area) => <SafeMarker key={area.id} area={area} />)}

      {zones && state.zones.map((zone) => <ZoneMarker key={zone.id} zone={zone} />)}

      {deployed && (
        <Gateway online={state.gateway.online} scanning={scanning} />
      )}

      {deployed &&
        state.nodes.map((node) => (
          <NodeStation key={node.id} node={node} scanning={scanning && !state.failureNodes.includes(node.id)} />
        ))}

      {state.gateway.online &&
        state.nodes
          .filter((node) => !state.failureNodes.includes(node.id))
          .map((node) => (
            <CommLink
              key={`link-${node.id}`}
              from={[node.position[0], 1.05, node.position[2]]}
              to={[12, 2.65, -6.4]}
              active
            />
          ))}

      {verifiedZone && (
        <group>
          {state.verifications.map((verification) => {
            const zone = state.zones.find((item) => item.id === verification.zoneId)
            if (!zone) return null
            return (
              <group key={verification.id} position={[zone.center[0], 0, zone.center[2]]}>
                <PulseRing color="#5cffab" speed={0.5} size={1.2} />
              </group>
            )
          })}
        </group>
      )}

      {state.extraction && <ExtractionCue />}

      {scene >= 3 && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.03, 9.8]}
          onClick={() => selectZone(null)}
        >
          <planeGeometry args={[36, 7]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </>
  )
}

function ViewportLegend() {
  return (
    <div className="rf-legend" aria-label="Zone status legend">
      {(['not_checked', 'possible_survivor', 'needs_verification', 'unverified', 'human_verified'] as const).map(
        (status) => (
          <span key={status}>
            <i style={{ background: ZONE_STATUS_META[status].color }} aria-hidden="true" />
            {ZONE_STATUS_META[status].label}
          </span>
        ),
      )}
    </div>
  )
}

export function RfViewport() {
  const { state, scene, selectedZone, selectedNode, report } = useRfFense()
  const reduced = useReducedMotion()
  const meta = SCENES[scene - 1]
  const scanning = state.scanning.startedAt !== null && state.scanning.completedAt === null
  const activeZone = state.zones.find((zone) => zone.id === selectedZone) ?? null
  const activeNode = state.nodes.find((node) => node.id === selectedNode) ?? null
  const latest = activeZone
    ? [...state.observations].reverse().find((observation) => observation.zoneId === activeZone.id)
    : null

  return (
    <section className="rf-viewport panel" aria-label="Stylised 3D site view">
      <div className="rf-viewport__head">
        <div>
          <p className="rf-eyebrow">Stylised 3D site view</p>
          <h2>{meta.label}</h2>
        </div>
        <div className="rf-viewport__chips">
          <span>
            <Radio size={13} aria-hidden="true" />
            {report.activeNodes} active node{report.activeNodes === 1 ? '' : 's'}
          </span>
          <span className={state.gateway.online ? 'is-good' : 'is-muted'}>
            <ShieldCheck size={13} aria-hidden="true" />
            Gateway {state.gateway.online ? 'online' : 'offline'}
          </span>
          {scanning && (
            <span className="is-live">
              <ScanLine size={13} aria-hidden="true" />
              Scanning
            </span>
          )}
          {state.alerts.length > 0 && (
            <span className="is-danger">
              <TriangleAlert size={13} aria-hidden="true" />
              {state.alerts.length} alert{state.alerts.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>

      <div className="rf-canvas">
        <Canvas
          shadows
          dpr={[1, 1.6]}
          camera={{ position: [14.5, 10.5, 17], fov: 44, near: 0.1, far: 90 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <SceneReducedMotion.Provider value={reduced}>
              <SiteScene reduced={reduced} />
            </SceneReducedMotion.Provider>
          </Suspense>
        </Canvas>
        <div className="rf-canvas__badge">
          <span className="rf-canvas__live">
            <i aria-hidden="true" /> Simulated scene
          </span>
          <span>Pre-programmed geometry and events</span>
        </div>
        <div className="rf-canvas__note">
          Stylised reconstruction · not a LIDAR, structural or radar model
        </div>
      </div>

      <div className="rf-viewport__foot">
        <ViewportLegend />
        <p className="rf-viewport__selection">
          {activeZone ? (
            <>
              <strong>{activeZone.label}</strong> · {activeZone.name} · {ZONE_STATUS_META[activeZone.status].label}
              {latest ? ` · Last result ${latest.observationType.replaceAll('_', ' ')}` : ' · No observation'}
            </>
          ) : activeNode ? (
            <>
              <strong>{activeNode.id}</strong> · {sensorMeta(activeNode.sensorType).label} · Zone{' '}
              {activeNode.zoneId} · {activeNode.health} · Battery N/A
            </>
          ) : (
            'Click a zone label or node marker to inspect it. All readings are illustrative.'
          )}
        </p>
      </div>
    </section>
  )
}
