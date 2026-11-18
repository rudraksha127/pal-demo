import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { FloorFilter, Scenario, SceneTool } from '../../types'
import { RuinBuilding, RubbleField, SceneGround } from './Ruin'
import { FloorSlab, SearchZones, SiteBounds, VictimMarker } from './Zones'
import { SensorMesh } from './Sensors'
import { DustParticles } from './DustParticles'
import { AtmosphericParticles } from './AtmosphericParticles'

export type CameraPreset = 'hero' | 'drone' | 'victim' | 'ortho'

const PRESET_CONFIGS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
  hero: { pos: new THREE.Vector3(13.8, 9.6, 16.6), target: new THREE.Vector3(0.8, 5.0, 0.5) },
  drone: { pos: new THREE.Vector3(18.5, 17.5, 21.0), target: new THREE.Vector3(0.8, 3.5, 0.5) },
  victim: { pos: new THREE.Vector3(5.8, 4.6, 6.8), target: new THREE.Vector3(2.2, 3.6, 1.4) },
  ortho: { pos: new THREE.Vector3(0.8, 28.0, 0.6), target: new THREE.Vector3(0.8, 0.1, 0.5) },
}

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
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[19, 27, 14]}
        intensity={1.85}
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

function CameraRig({
  tool,
  resetSignal,
  preset = 'hero',
}: {
  tool: SceneTool
  resetSignal: number
  preset?: CameraPreset
}) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const previousSignal = useRef(resetSignal)
  const previousPreset = useRef(preset)

  const animation = useRef<{
    active: boolean
    elapsed: number
    fromPosition: THREE.Vector3
    fromTarget: THREE.Vector3
    toPosition: THREE.Vector3
    toTarget: THREE.Vector3
  }>({
    active: false,
    elapsed: 0,
    fromPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toPosition: PRESET_CONFIGS.hero.pos,
    toTarget: PRESET_CONFIGS.hero.target,
  })

  useEffect(() => {
    const isReset = resetSignal !== previousSignal.current
    const isPresetChange = preset !== previousPreset.current

    if (isReset || isPresetChange) {
      previousSignal.current = resetSignal
      previousPreset.current = preset

      const config = PRESET_CONFIGS[preset] || PRESET_CONFIGS.hero
      animation.current.active = true
      animation.current.elapsed = 0
      animation.current.fromPosition.copy(camera.position)
      animation.current.fromTarget.copy(controlsRef.current?.target ?? config.target)
      animation.current.toPosition = config.pos
      animation.current.toTarget = config.target
    }
  }, [camera, resetSignal, preset])

  useFrame((_, delta) => {
    if (!animation.current.active || !controlsRef.current) return
    animation.current.elapsed = Math.min(1, animation.current.elapsed + delta / 0.8)
    const t = animation.current.elapsed
    const eased = t * t * (3 - 2 * t)
    camera.position.lerpVectors(animation.current.fromPosition, animation.current.toPosition, eased)
    controlsRef.current.target.lerpVectors(animation.current.fromTarget, animation.current.toTarget, eased)
    controlsRef.current.update()
    if (t >= 1) animation.current.active = false
  })

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0.8, 5.0, 0.5]}
      enableDamping
      dampingFactor={0.07}
      minDistance={4}
      maxDistance={75}
      maxPolarAngle={Math.PI / 2.02}
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

export interface CollapseSceneProps {
  scenario: Scenario
  floor: FloorFilter
  tool: SceneTool
  overlays: boolean
  selectedZone: string | null
  selectedSensor: string | null
  onSelectZone: (id: string) => void
  onSelectSensor: (id: string) => void
  onSelectVictim?: () => void
  victimVisible: boolean
  sensorsActive: boolean
  resetSignal: number
  cameraPreset?: CameraPreset
  bloomEnabled?: boolean
  particlesEnabled?: boolean
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
  onSelectVictim,
  victimVisible,
  sensorsActive,
  resetSignal,
  cameraPreset = 'hero',
  bloomEnabled = true,
  particlesEnabled = true,
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

        {particlesEnabled && (
          <>
            <DustParticles count={700} area={35} height={18} density={0.8} />
            <AtmosphericParticles count={400} area={30} height={15} color="#cdd5c8" speed={0.8} />
          </>
        )}

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
          victimPos={scenario.victim.position}
        />

        <VictimMarker
          scenario={scenario}
          visible={victimVisible && victimOnFloor}
          onSelectVictim={onSelectVictim}
        />

        <SiteBounds visible={overlays && tool === 'bounds'} />
      </Suspense>

      <CameraRig tool={tool} resetSignal={resetSignal} preset={cameraPreset} />
      <AdaptiveDpr pixelated />

      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            intensity={0.45}
            mipmapBlur
            luminanceThreshold={0.82}
            luminanceSmoothing={0.05}
          />
          <Vignette darkness={0.25} offset={0.35} />
          <ToneMapping mode={THREE.ACESFilmicToneMapping} />
        </EffectComposer>
      )}
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
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.95
        gl.shadowMap.type = THREE.PCFSoftShadowMap
        props.onReady?.()
      }}
    >
      <SceneContents {...props} />
    </Canvas>
  )
}
