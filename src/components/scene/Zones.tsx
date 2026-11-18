import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Scenario, Zone } from '../../types'
import { SceneLabelSprite } from './Labels'

const ZONE_LABEL: Record<Zone['kind'], string> = {
  primary: 'Primary',
  search: 'Search',
  collapse: 'Collapse',
}

function bracketGeometry(size: [number, number, number], length = 0.55): THREE.BufferGeometry {
  const [width, height, depth] = size
  const positions: number[] = []
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = (sx * width) / 2
        const y = (sy * height) / 2
        const z = (sz * depth) / 2
        positions.push(x, y, z, x - sx * length, y, z)
        positions.push(x, y, z, x, y - sy * length, z)
        positions.push(x, y, z, x, y, z - sz * length)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

function ZoneBox({
  zone,
  selected,
  onSelect,
}: {
  zone: Zone
  selected: boolean
  onSelect: (id: string) => void
}) {
  const scanRef = useRef<THREE.Mesh>(null)
  const faceMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  const boxGeometry = useMemo(() => new THREE.BoxGeometry(...zone.size), [zone.size])
  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(boxGeometry), [boxGeometry])
  const brackets = useMemo(() => bracketGeometry(zone.size), [zone.size])

  useEffect(() => {
    return () => {
      boxGeometry.dispose()
      edgesGeometry.dispose()
      brackets.dispose()
    }
  }, [boxGeometry, edgesGeometry, brackets])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (scanRef.current) {
      const progress = (time * 0.22 + zone.position[0] * 0.1) % 1
      scanRef.current.position.y = -zone.size[1] / 2 + progress * zone.size[1]
    }
    if (faceMaterial.current) {
      const pulse = selected ? 0.16 : 0.085
      faceMaterial.current.opacity = pulse + Math.sin(time * 2.2) * 0.015
    }
    if (groupRef.current) {
      groupRef.current.position.y = zone.position[1] + Math.sin(time * 0.8 + zone.position[0]) * 0.025
    }
  })

  return (
    <group ref={groupRef} position={zone.position}>
      <mesh geometry={boxGeometry}>
        <meshBasicMaterial
          ref={faceMaterial}
          color={zone.color}
          transparent
          opacity={0.05}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={zone.color} transparent opacity={selected ? 0.95 : 0.62} toneMapped={false} />
      </lineSegments>

      <lineSegments geometry={brackets}>
        <lineBasicMaterial color={zone.color} transparent opacity={selected ? 1 : 0.78} toneMapped={false} />
      </lineSegments>

      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[zone.size[0] * 0.94, zone.size[2] * 0.94]} />
        <meshBasicMaterial
          color={zone.color}
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <pointLight color={zone.color} intensity={selected ? 1.2 : 0.5} distance={6} decay={2} />

      <SceneLabelSprite
        title={zone.id}
        subtitle={`(${ZONE_LABEL[zone.kind]})`}
        color={zone.color}
        position={[0, 0.15, 0]}
        width={2.45}
        height={1.22}
        selected={selected}
        onClick={() => onSelect(zone.id)}
      />
    </group>
  )
}

export function SearchZones({
  zones,
  selectedZone,
  onSelectZone,
  floor,
  overlays,
}: {
  zones: Zone[]
  selectedZone: string | null
  onSelectZone: (id: string) => void
  floor: 'all' | 1 | 2 | 3 | 4 | 5
  overlays: boolean
}) {
  if (!overlays) return null
  return (
    <group>
      {zones
        .filter((zone) => floor === 'all' || zone.floor === floor)
        .map((zone) => (
          <ZoneBox key={zone.id} zone={zone} selected={selectedZone === zone.id} onSelect={onSelectZone} />
        ))}
    </group>
  )
}

function useHaloTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (context) {
      const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64)
      gradient.addColorStop(0, 'rgba(255, 245, 220, 1)')
      gradient.addColorStop(0.16, 'rgba(255, 110, 90, 0.85)')
      gradient.addColorStop(0.44, 'rgba(255, 60, 48, 0.28)')
      gradient.addColorStop(1, 'rgba(255, 60, 48, 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, 128, 128)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
}

function VictimBody({
  victim,
  onSelectVictim,
}: {
  victim: Scenario['victim']
  onSelectVictim?: () => void
}) {
  const halo = useHaloTexture()
  const spriteRef = useRef<THREE.Sprite>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const groupRef = useRef<THREE.Group>(null)
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff342e',
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
      }),
    [],
  )
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff5a48',
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useEffect(() => () => {
    material.dispose()
    glowMaterial.dispose()
    halo.dispose()
  }, [material, glowMaterial, halo])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (spriteRef.current) {
      const scale = 2.1 + Math.sin(time * 2.4) * 0.22
      spriteRef.current.scale.set(scale, scale, 1)
      const spriteMaterial = spriteRef.current.material as THREE.SpriteMaterial
      spriteMaterial.opacity = 0.44 + Math.sin(time * 2.4) * 0.08
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.4 + Math.sin(time * 2.4) * 0.4
    }
    if (groupRef.current) {
      groupRef.current.position.y = victim.position[1] + Math.sin(time * 1.4) * 0.015
    }
  })

  return (
    <group
      ref={groupRef}
      position={victim.position}
      onClick={(e) => {
        e.stopPropagation()
        onSelectVictim?.()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      <sprite ref={spriteRef} position={[0, 0.95, 0]} scale={[2.2, 2.2, 1]}>
        <spriteMaterial map={halo} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>

      <pointLight ref={lightRef} color="#ff4438" intensity={1.4} distance={5} decay={2} />

      <group>
        <mesh material={material} position={[0, 1.53, 0]}>
          <sphereGeometry args={[0.16, 14, 12]} />
        </mesh>
        <mesh material={material} position={[0, 1.08, 0]}>
          <capsuleGeometry args={[0.17, 0.5, 4, 10]} />
        </mesh>
        <mesh material={material} position={[-0.25, 1.1, 0]} rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.055, 0.5, 3, 8]} />
        </mesh>
        <mesh material={material} position={[0.25, 1.1, 0]} rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.055, 0.5, 3, 8]} />
        </mesh>
        <mesh material={material} position={[-0.11, 0.42, 0]} rotation={[0, 0, 0.05]}>
          <capsuleGeometry args={[0.075, 0.58, 3, 8]} />
        </mesh>
        <mesh material={material} position={[0.11, 0.42, 0]} rotation={[0, 0, -0.05]}>
          <capsuleGeometry args={[0.075, 0.58, 3, 8]} />
        </mesh>

        <mesh material={glowMaterial} position={[0, 1.08, 0]} scale={1.24}>
          <capsuleGeometry args={[0.17, 0.5, 4, 10]} />
        </mesh>
        <mesh material={glowMaterial} position={[0, 1.53, 0]} scale={1.3}>
          <sphereGeometry args={[0.16, 14, 12]} />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.32, 0.4, 32]} />
        <meshBasicMaterial color="#ff4a42" transparent opacity={0.72} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      <SceneLabelSprite
        title="VICTIM T-01"
        color="#ff5f56"
        position={[0, 2.2, 0]}
        width={1.4}
        height={0.55}
        onClick={onSelectVictim}
      />
    </group>
  )
}

export function VictimMarker({
  scenario,
  visible,
  onSelectVictim,
}: {
  scenario: Scenario
  visible: boolean
  onSelectVictim?: () => void
}) {
  if (!visible) return null
  return <VictimBody victim={scenario.victim} onSelectVictim={onSelectVictim} />
}

export function SiteBounds({ visible }: { visible: boolean }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(20, 14, 16), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry])

  useEffect(() => () => {
    geometry.dispose()
    edges.dispose()
  }, [geometry, edges])

  if (!visible) return null

  return (
    <group position={[0, 7, 0]}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#3fdcff" transparent opacity={0.018} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#3fdcff" transparent opacity={0.28} toneMapped={false} />
      </lineSegments>
      <SceneLabelSprite
        title="SITE BOUNDS"
        color="#3fdcff"
        position={[0, 7.4, 0]}
        width={2.6}
        height={0.95}
      />
    </group>
  )
}

export function FloorSlab({ floor }: { floor: 'all' | 1 | 2 | 3 | 4 | 5 }) {
  const plane = useMemo(() => new THREE.PlaneGeometry(14.5, 9), [])
  const edges = useMemo(() => new THREE.EdgesGeometry(plane), [plane])

  useEffect(() => () => {
    plane.dispose()
    edges.dispose()
  }, [plane, edges])

  if (floor === 'all') return null
  const y = 0.16 + (floor - 1) * 2.9
  return (
    <group position={[0, y + 0.16, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={plane}>
        <meshBasicMaterial color="#2df08a" transparent opacity={0.055} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges} rotation={[-Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color="#2df08a" transparent opacity={0.25} toneMapped={false} />
      </lineSegments>
    </group>
  )
}
