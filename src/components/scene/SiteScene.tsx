import { useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { SAFE_AREAS } from '../../rf/data'
import type { SearchZone, SensorNode } from '../../rf/types'
import { Tower } from './Tower'
import { RubbleField } from './RubbleField'
import { SafeAreaMarker } from './SafeAreaMarker'
import { ZoneVolume } from './ZoneVolume'
import { SensorNode3D } from './SensorNode3D'
import { AtmosphericParticles } from './AtmosphericParticles'
import { DustParticles } from './DustParticles'
import { SparkleParticles } from './SparkleParticles'
import { useEffect } from 'react'
import * as THREE from 'three'

interface SiteSceneProps {
  reduced: boolean
  zones: SearchZone[]
  nodes: SensorNode[]
  state: any
  scene: number
  selectedZone: string | null
  selectedNode: string | null
  onZoneClick: (zoneId: string) => void
  onNodeClick: (nodeId: string) => void
}

export function SiteScene({
  reduced,
  zones,
  nodes,
  state,
  scene,
  selectedZone,
  selectedNode,
  onZoneClick,
  onNodeClick,
}: SiteSceneProps) {
  const { camera, size } = useThree()

  // Camera setup
  useEffect(() => {
    const narrow = size.width < 680
    camera.position.set(narrow ? 19 : 14.5, narrow ? 14 : 10.5, narrow ? 25 : 17)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = narrow ? 52 : 44
      camera.updateProjectionMatrix()
    }
    camera.lookAt(1.2, 2.2, 0)
  }, [camera, size.width])

  // Camera animation
  useFrame(({ clock }) => {
    if (reduced) return
    const t = clock.getElapsedTime()
    const narrow = size.width < 680
    camera.position.x = (narrow ? 19 : 14.5) + Math.sin(t * 0.07) * 0.45
    camera.position.y = (narrow ? 14 : 10.5) + Math.cos(t * 0.05) * 0.18
    camera.lookAt(1.2, 2.3, 0)
  })

  return (
    <>
      {/* Environment & Lighting */}
      <Environment preset="city" background={false} ground={false} />
      
      <hemisphereLight intensity={0.6} args={['#8f9e9b', '#1a1612']} />
      <ambientLight intensity={0.3} color="#2d3a2f" />
      
      <directionalLight
        position={[20, 35, 15]}
        intensity={2.2}
        color="#f5f0e0"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
      />
      
      <directionalLight position={[-15, 15, -20]} intensity={0.6} color="#a8d0e8" />
      <directionalLight position={[5, 12, 25]} intensity={0.35} color="#ffe8c0" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2d3328" roughness={1} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#3a4335" roughness={1} metalness={0} />
      </mesh>

      {/* Grid */}
      <group position={[0, 0.04, 0]}>
        <gridHelper args={[80, 80]} />
      </group>

      {/* Building - Collapsed State */}
      <Tower
        position={[0, 0, 0]}
        floors={5}
        width={8.5}
        depth={6.5}
        damaged={scene >= 2}
      />

      {/* Rubble Field */}
      <RubbleField seed={state.scenarioSeed || 42} />

      {/* Safe Areas */}
      {SAFE_AREAS.filter((a) => a.state === 'safe').map((area) => {
        const relatedZone = zones.find(z => z.safeAreaIds.includes(area.id))
        const isSelected = Boolean(selectedZone && relatedZone?.id === selectedZone)
        return (
          <SafeAreaMarker
            key={area.id}
            area={area}
            selected={isSelected}
            onClick={() => {
              if (relatedZone) onZoneClick(relatedZone.id)
            }}
          />
        )
      })}

      {/* Zones */}
      {zones.map((zone) => (
        <ZoneVolume
          key={zone.id}
          zone={zone}
          selected={selectedZone === zone.id}
          onClick={() => onZoneClick(zone.id)}
        />
      ))}

      {/* Sensor Nodes */}
      {nodes.map((node) => (
        <SensorNode3D
          key={node.id}
          node={node}
          selected={selectedNode === node.id}
          onClick={() => onNodeClick(node.id)}
        />
      ))}

      {/* Atmospheric Particles */}
      {!reduced && (
        <>
          <AtmosphericParticles count={500} area={40} height={20} />
          <SparkleParticles count={100} scale={[30, 15, 20]} color="#d7dfd1" />
        </>
      )}

      {/* Dust particles for collapse scene */}
      {scene === 2 && !reduced && (
        <DustParticles count={800} area={50} height={25} density={1.5} />
      )}

      {/* Contact Shadows */}
      <ContactShadows position={[0, 0.08, 0]} opacity={0.6} scale={40} blur={3} far={20} color="#0a0f0a" frames={1} />
    </>
  )
}

