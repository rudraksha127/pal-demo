import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { FloorFilter, Scenario, SceneTool } from '../../types'
import { RuinBuilding, RubbleField, SceneGround } from './Ruin'
import { FloorSlab, SearchZones, SiteBounds, VictimMarker } from './Zones'
import { SensorMesh } from './Sensors'

const DEFAULT_POSITION = new THREE.Vector3(13.8, 9.6, 16.6)
const DEFAULT_TARGET = new THREE.Vector3(0.8, 5.0, 0.5)

function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color('#74898d') },
          bottomColor: { value: new THREE.Color('#b3b9ac') },
          offset: { value: 8 },
          exponent: { value: 0.88 },
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `,
      }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh scale={170} renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#cdd8d4', '#31372f', 0.92]} />
      <ambientLight intensity={0.19} />
      <directionalLight
        position={[19, 27, 14]}
        intensity={1.72}
        color="#f0eee2"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      />
      <directionalLight position={[-18, 12, -16]} intensity={0.46} color="#b6d2e4" />
      <directionalLight position={[4, 8, 24]} intensity={0.22} color="#ffe9c9" />
    </>
  )
}

function CameraRig({ tool, resetSignal }: { tool: SceneTool; resetSignal: number }) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const previousReset = useRef(resetSignal)
  const animation = useRef<{
    active: boolean
    elapsed: number
    fromPosition: THREE.Vector3
    fromTarget: THREE.Vector3
  }>({
    active: false,
    elapsed: 0,
    fromPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
  })

  useEffect(() => {
    if (resetSignal === previousReset.current) return
    previousReset.current = resetSignal
    animation.current.active = true
    animation.current.elapsed = 0
    animation.current.fromPosition.copy(camera.position)
    animation.current.fromTarget.copy(controlsRef.current?.target ?? DEFAULT_TARGET)
  }, [camera, resetSignal])

  useFrame((_, delta) => {
    if (!animation.current.active || !controlsRef.current) return
    animation.current.elapsed = Math.min(1, animation.current.elapsed + delta / 0.75)
    const t = animation.current.elapsed
    const eased = t * t * (3 - 2 * t)
    camera.position.lerpVectors(animation.current.fromPosition, DEFAULT_POSITION, eased)
    controlsRef.current.target.lerpVectors(animation.current.fromTarget, DEFAULT_TARGET, eased)
    controlsRef.current.update()
    if (t >= 1) animation.current.active = false
  })

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0.8, 5.0, 0.5]}
      enableDamping
      dampingFactor={0.07}
      minDistance={6}
      maxDistance={62}
      maxPolarAngle={Math.PI / 2.04}
      enablePan
      panSpeed={0.8}
      rotateSpeed={0.62}
      zoomSpeed={0.85}
      mouseButtons={
        tool === 'pan'
          ? {
              LEFT: THREE.MOUSE.PAN,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.ROTATE,
            }
          : {
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.PAN,
            }
      }
    />
  )
}

interface CollapseSceneProps {
  scenario: Scenario
  floor: FloorFilter
  tool: SceneTool
  overlays: boolean
  selectedZone: string | null
  selectedSensor: string | null
  onSelectZone: (id: string) => void
  onSelectSensor: (id: string) => void
  victimVisible: boolean
  sensorsActive: boolean
  resetSignal: number
  onReady?: () => void
}

function SceneContents({
  scenario,
  floor,
  tool,
  overlays,
  selectedZone,
  selectedSensor,
  onSelectZone,
  onSelectSensor,
  victimVisible,
  sensorsActive,
  resetSignal,
}: CollapseSceneProps) {
  const victimOnFloor = floor === 'all' || scenario.victim.floor === floor
  return (
    <>
      <color attach="background" args={['#8d9c99']} />
      <fog attach="fog" args={['#8f9e9b', 30, 125]} />
      <SkyDome />
      <Lights />
      <Suspense fallback={null}>
        <SceneGround seed={scenario.seed} />
        <RuinBuilding seed={scenario.seed} />
        <RubbleField seed={scenario.seed} />
        <FloorSlab floor={floor} />
        <SearchZones
          zones={scenario.zones}
          selectedZone={selectedZone}
          onSelectZone={onSelectZone}
          floor={floor}
          overlays={overlays}
        />
        <SensorMesh
          sensors={scenario.sensors}
          active={sensorsActive}
          selectedSensor={selectedSensor}
          onSelectSensor={onSelectSensor}
          showLabels={overlays && floor === 'all'}
        />
        <VictimMarker scenario={scenario} visible={victimVisible && victimOnFloor} />
        <SiteBounds visible={overlays && tool === 'bounds'} />
      </Suspense>
      <CameraRig tool={tool} resetSignal={resetSignal} />
      <AdaptiveDpr pixelated />
    </>
  )
}

export function CollapseScene(props: CollapseSceneProps) {
  return (
    <Canvas
      className="viewport-canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [13.8, 9.6, 16.6], fov: 42, near: 0.1, far: 400 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.92
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        props.onReady?.()
      }}
    >
      <SceneContents {...props} />
    </Canvas>
  )
}
