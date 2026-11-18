import { useMemo } from 'react'
import * as THREE from 'three'
import { ContactShadows, Grid, Sparkles } from '@react-three/drei'
import { mulberry32, pick, randomBetween } from './utils'

const CONCRETE_COLORS = ['#9f9a8c', '#918c80', '#857f74', '#a9a395', '#78746a']
const DUST_COLORS = ['#8a8579', '#777369', '#969184', '#68655c']

function ConcreteBlock({
  position,
  size,
  rotation = [0, 0, 0],
  color,
  opacity = 1,
}: {
  position: [number, number, number]
  size: [number, number, number]
  rotation?: [number, number, number]
  color: string
  opacity?: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.96} metalness={0.015} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

function Rebar({
  position,
  rotation,
  length,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  length: number
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.022, 0.018, length, 5]} />
      <meshStandardMaterial color="#4c3526" roughness={0.8} metalness={0.35} />
    </mesh>
  )
}

function Tree({ position, scale = 1, tint = '#4f6548' }: { position: [number, number, number]; scale?: number; tint?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.2, 2.6, 6]} />
        <meshStandardMaterial color="#4a3b2b" roughness={1} />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial color={tint} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.55, 2.55, 0.2]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.82, 1]} />
        <meshStandardMaterial color="#5c7252" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-0.5, 2.7, -0.25]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#465e42" roughness={0.95} flatShading />
      </mesh>
    </group>
  )
}

function SiteDressing() {
  return (
    <group>
      <ConcreteBlock position={[-8.7, 0.85, 5.9]} size={[2.4, 0.16, 0.1]} color="#c77a2d" rotation={[0, 0.18, 0]} />
      <ConcreteBlock position={[-8.7, 0.44, 5.9]} size={[0.08, 0.85, 0.08]} color="#3d403b" />
      <ConcreteBlock position={[-7.6, 0.44, 5.85]} size={[0.08, 0.85, 0.08]} color="#3d403b" />
      <ConcreteBlock position={[8.5, 0.85, 5.4]} size={[2.4, 0.16, 0.1]} color="#c77a2d" rotation={[0, -0.12, 0]} />
      <ConcreteBlock position={[8.5, 0.44, 5.4]} size={[0.08, 0.85, 0.08]} color="#3d403b" />
      <ConcreteBlock position={[9.6, 0.44, 5.35]} size={[0.08, 0.85, 0.08]} color="#3d403b" />

      <mesh position={[8.1, 1.05, 6.9]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.1, 1.2]} />
        <meshStandardMaterial color="#2d4b43" roughness={0.8} metalness={0.12} />
      </mesh>
      <mesh position={[8.1, 2.11, 6.9]} castShadow>
        <boxGeometry args={[2.7, 0.08, 1.3]} />
        <meshStandardMaterial color="#46685d" roughness={0.75} metalness={0.2} />
      </mesh>

      {[
        [-7.4, 6.9],
        [7.7, 5.4],
        [6.9, 7.6],
      ].map(([x, z], index) => (
        <group key={index} position={[x, 0, z]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <coneGeometry args={[0.2, 0.56, 10]} />
            <meshStandardMaterial color="#d17327" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.3, 0.34, 0.06, 10]} />
            <meshStandardMaterial color="#333833" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <mesh position={[-10.4, 0.45, 2.2]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.85, 0.7]} />
        <meshStandardMaterial color="#31473c" roughness={0.85} />
      </mesh>
      <mesh position={[-10.4, 0.94, 2.2]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.8]} />
        <meshStandardMaterial color="#5b7563" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Trees({ seed }: { seed: number }) {
  const trees = useMemo(() => {
    const random = mulberry32(seed + 71)
    const positions: Array<[number, number, number]> = [
      [-14.5, 0, -4.6],
      [-12.8, 0, 8.4],
      [-15.8, 0, 2.2],
      [14.8, 0, -5.4],
      [15.6, 0, 5.8],
      [12.8, 0, -9.6],
      [-5.2, 0, -13.6],
    ]
    return positions.map((position) => ({
      position: [position[0] + randomBetween(random, -0.5, 0.5), 0, position[2] + randomBetween(random, -0.5, 0.5)] as [number, number, number],
      scale: randomBetween(random, 0.95, 1.38),
      tint: pick(random, ['#364d36', '#3c5539', '#314732', '#43593c']),
    }))
  }, [seed])

  return (
    <group>
      {trees.map((tree, index) => (
        <Tree key={index} {...tree} />
      ))}
    </group>
  )
}

function DistantCity({ seed }: { seed: number }) {
  const windowTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#4f5c58'
      context.fillRect(0, 0, 64, 128)
      const random = mulberry32(seed + 9)
      for (let row = 0; row < 18; row += 1) {
        for (let column = 0; column < 7; column += 1) {
          const lit = random() > 0.68
          context.fillStyle = lit ? 'rgba(218, 197, 154, 0.4)' : 'rgba(24, 32, 31, 0.55)'
          context.fillRect(5 + column * 8, 5 + row * 6.6, 4.5, 3.4)
        }
      }
      context.fillStyle = 'rgba(105, 120, 116, 0.18)'
      context.fillRect(0, 0, 64, 128)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1.5, 1.5)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [seed])

  const buildings = useMemo(() => {
    const random = mulberry32(seed + 33)
    return Array.from({ length: 40 }).map(() => {
      const angle = randomBetween(random, -1.25, 1.25)
      const distance = randomBetween(random, 62, 105)
      const x = Math.sin(angle) * distance + randomBetween(random, -10, 10)
      const z = -Math.cos(angle) * distance - 8
      const height = randomBetween(random, 7, 18)
      const width = randomBetween(random, 4, 10)
      const depth = randomBetween(random, 3.5, 8)
      return {
        position: [x, height / 2, z] as [number, number, number],
        size: [width, height, depth] as [number, number, number],
        rotation: randomBetween(random, -0.08, 0.08),
      }
    })
  }, [seed])

  return (
    <group>
      {buildings.map((building, index) => (
        <mesh key={index} position={building.position} rotation={[0, building.rotation, 0]} receiveShadow>
          <boxGeometry args={building.size} />
          <meshStandardMaterial map={windowTexture} color="#6a7672" roughness={1} metalness={0} />
        </mesh>
      ))}
      <group position={[22, 0, -30]}>
        <mesh position={[0, 7, 0]}>
          <boxGeometry args={[0.35, 14, 0.35]} />
          <meshStandardMaterial color="#6f6046" roughness={0.85} />
        </mesh>
        <mesh position={[-4.8, 13.8, 0]} rotation={[0, 0, 0.02]}>
          <boxGeometry args={[10, 0.28, 0.28]} />
          <meshStandardMaterial color="#6f6046" roughness={0.85} />
        </mesh>
        <mesh position={[-9.3, 13.55, 0]}>
          <boxGeometry args={[0.14, 0.7, 0.14]} />
          <meshStandardMaterial color="#6f6046" roughness={0.85} />
        </mesh>
      </group>
    </group>
  )
}

export function RuinBuilding({ seed }: { seed: number }) {
  const random = useMemo(() => mulberry32(seed), [seed])

  const leftColumns = useMemo(() => {
    const columns: Array<{ x: number; z: number; segments: number[] }> = []
    const xs = [-6.8, -4.1, -1.5]
    const zs = [-3.4, 3.4]
    for (const x of xs) {
      for (const z of zs) {
        const segments = [0, 1, 2, 3].filter(() => random() > 0.12)
        columns.push({ x, z, segments })
      }
    }
    return columns
  }, [random])

  const windowPanes = useMemo(() => {
    const panes: Array<{ position: [number, number, number]; broken: boolean }> = []
    const xs = [-6.35, -5.05, -3.75, -2.45]
    const ys = [1.65, 4.55, 7.45, 10.35]
    for (const x of xs) {
      for (const y of ys) {
        panes.push({ position: [x, y, -3.43], broken: random() > 0.82 })
      }
    }
    return panes
  }, [random])

  const rebars = useMemo(
    () =>
      Array.from({ length: 26 }).map(() => ({
        position: [randomBetween(random, -7.2, 6.8), randomBetween(random, 0.8, 9.2), randomBetween(random, -3.8, 3.8)] as [number, number, number],
        rotation: [
          randomBetween(random, -1.2, 1.2),
          randomBetween(random, 0, Math.PI),
          randomBetween(random, -1.2, 1.2),
        ] as [number, number, number],
        length: randomBetween(random, 0.35, 1.5),
      })),
    [random],
  )

  return (
    <group>
      {/* Intact left wing: five levels of slabs, columns and a windowed rear facade. */}
      {[0.16, 3.06, 5.96, 8.86, 11.76].map((y, index) => (
        <group key={y}>
          <ConcreteBlock position={[-4.2, y, 0]} size={[5.8, 0.3, 7.6]} color={CONCRETE_COLORS[index % CONCRETE_COLORS.length]} />
          {index < 4 &&
            leftColumns.map((column, columnIndex) =>
              column.segments.includes(index) ? (
                <ConcreteBlock
                  key={`${index}-${columnIndex}`}
                  position={[column.x, y + 1.45, column.z]}
                  size={[0.42, 2.9, 0.42]}
                  color={CONCRETE_COLORS[(index + columnIndex) % CONCRETE_COLORS.length]}
                />
              ) : null,
            )}
        </group>
      ))}

      <ConcreteBlock position={[-4.2, 6.05, -3.58]} size={[5.9, 12, 0.26]} color="#8f8a7e" />
      {windowPanes.map((pane, index) =>
        !pane.broken ? (
          <mesh key={index} position={pane.position}>
            <boxGeometry args={[0.94, 1.55, 0.06]} />
            <meshStandardMaterial color="#16201e" roughness={0.35} metalness={0.25} />
          </mesh>
        ) : (
          <group key={index}>
            <mesh position={pane.position}>
              <boxGeometry args={[0.94, 0.14, 0.06]} />
              <meshStandardMaterial color="#202a27" roughness={0.5} />
            </mesh>
            <mesh position={[pane.position[0], pane.position[1] - 0.7, pane.position[2]]}>
              <boxGeometry args={[0.94, 0.12, 0.06]} />
              <meshStandardMaterial color="#202a27" roughness={0.5} />
            </mesh>
          </group>
        ),
      )}

      {/* Warm interior light in the intact wing. */}
      {[
        { x: -6.35, y: 4.55 },
        { x: -5.05, y: 4.55 },
        { x: -3.75, y: 1.65 },
      ].map((pane, index) => (
        <mesh key={`lit-${index}`} position={[pane.x, pane.y, -3.36]}>
          <planeGeometry args={[0.88, 1.45]} />
          <meshBasicMaterial color="#ffb066" transparent opacity={index === 2 ? 0.38 : 0.52} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[-4.8, 4.4, -2.4]} color="#ffb26e" intensity={1.5} distance={8} decay={2} />

      {/* Broken front edge of the left slabs. */}
      {[3.06, 5.96, 8.86].map((y, index) => (
        <group key={`edge-${y}`}>
          <ConcreteBlock position={[-5.7 + index * 0.25, y - 0.05, 3.82]} size={[1.4, 0.26, 0.5]} rotation={[0.1, 0.12, -0.08]} color="#938e81" />
          <ConcreteBlock position={[-2.1, y - 0.1, 3.78]} size={[1.0, 0.24, 0.55]} rotation={[-0.12, -0.16, 0.12]} color="#aaa496" />
        </group>
      ))}

      {/* Collapsed right wing: leaning slabs, a standing wall fragment and broken columns. */}
      <ConcreteBlock position={[2.6, 0.16, 0.2]} size={[7.7, 0.32, 7.3]} color="#9b9689" />
      <ConcreteBlock position={[2.3, 3.06, 0.25]} size={[7.0, 0.3, 6.7]} rotation={[-0.02, 0.03, -0.055]} color="#aaa496" />
      <ConcreteBlock position={[2.0, 4.65, 0.55]} size={[6.4, 0.32, 5.5]} rotation={[0.09, -0.02, -0.3]} color="#8f8b7f" />
      <ConcreteBlock position={[1.1, 2.15, 3.05]} size={[5.2, 0.34, 2.4]} rotation={[-0.18, 0.24, -0.52]} color="#b4afa1" />
      <ConcreteBlock position={[5.7, 5.05, -0.6]} size={[0.4, 6.9, 3.4]} rotation={[-0.04, 0.03, 0.19]} color="#8b877b" />
      <ConcreteBlock position={[5.9, 8.4, -2.7]} size={[2.7, 2.8, 0.34]} rotation={[0.05, 0.1, 0.08]} color="#817d72" />
      <ConcreteBlock position={[0.1, 1.65, 2.2]} size={[0.38, 3.3, 0.38]} rotation={[0.1, 0, 0.36]} color="#7c796f" />
      <ConcreteBlock position={[4.6, 1.8, 2.45]} size={[0.36, 3.6, 0.36]} rotation={[0.42, 0.2, -0.16]} color="#8c887c" />
      <ConcreteBlock position={[-1.0, 4.25, 2.7]} size={[0.35, 2.5, 0.35]} rotation={[-0.22, 0, 0.42]} color="#999487" />
      <ConcreteBlock position={[3.2, 2.5, -2.7]} size={[3.6, 0.3, 2.0]} rotation={[0.25, -0.15, 0.18]} color="#a7a294" />
      <ConcreteBlock position={[1.5, 3.35, 2.6]} size={[4.8, 0.3, 2.7]} rotation={[-0.34, 0.16, -0.6]} color="#9a9588" />
      <ConcreteBlock position={[4.5, 2.45, 2.1]} size={[3.5, 0.28, 2.3]} rotation={[0.2, -0.28, 0.46]} color="#8b867a" />
      <ConcreteBlock position={[4.1, 1.15, -0.9]} size={[3.4, 0.4, 3.1]} rotation={[0.05, 0.18, 0.04]} color="#928d80" />

      {/* Rear facade fragment on the collapsed wing. */}
      <ConcreteBlock position={[2.9, 3.55, -3.55]} size={[7.4, 6.6, 0.26]} color="#7f7b70" />
      {[0.9, 3.15, 5.35].map((y) =>
        [0.2, 2.1, 4.0, 5.9].map((x) => (
          <mesh key={`${x}-${y}`} position={[x, y, -3.4]}>
            <boxGeometry args={[1.15, 1.55, 0.06]} />
            <meshStandardMaterial color="#192320" roughness={0.4} metalness={0.18} />
          </mesh>
        )),
      )}

      {/* Exposed rebar at broken edges. */}
      {rebars.map((rebar, index) => (
        <Rebar key={index} {...rebar} />
      ))}

      {/* Stair and lift core give the intact wing structural mass. */}
      <ConcreteBlock position={[-6.55, 5.9, 1.0]} size={[1.15, 11.7, 2.2]} color="#7d796e" />
      <ConcreteBlock position={[-6.55, 8.4, 1.0]} size={[1.2, 0.18, 2.25]} color="#5f5c54" />

      {/* Interior partitions read as rooms through the open facade. */}
      {[1.6, 4.5, 7.4, 10.3].map((y) => (
        <group key={`room-${y}`}>
          <ConcreteBlock position={[-4.3, y + 1.05, 0.1]} size={[4.5, 2.1, 0.14]} color="#6f6b60" />
          <ConcreteBlock position={[-2.0, y + 1.05, -1.6]} size={[0.14, 2.1, 3.2]} color="#767166" />
        </group>
      ))}

      {/* Interior shadow planes keep the open floors from reading as flat. */}
      {[1.6, 4.5, 7.4, 10.3].map((y) => (
        <mesh key={`shadow-${y}`} position={[-4.2, y, -3.2]}>
          <planeGeometry args={[5.2, 2.4]} />
          <meshBasicMaterial color="#101713" transparent opacity={0.34} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export function RubbleField({ seed }: { seed: number }) {
  const chunks = useMemo(() => {
    const random = mulberry32(seed + 101)
    return Array.from({ length: 300 }).map(() => {
      const angle = randomBetween(random, 0, Math.PI * 2)
      const radius = Math.pow(random(), 0.62) * 11.4
      const x = Math.cos(angle) * radius * 1.25
      const z = Math.sin(angle) * radius * 0.82 + 2.6
      const rightSide = x > 0 ? randomBetween(random, 0.2, 4.4) : randomBetween(random, 0.05, 1.9)
      const scale = random() > 0.9 ? randomBetween(random, 0.6, 1.1) : randomBetween(random, 0.08, 0.5)
      return {
        position: [x, randomBetween(random, 0.06, rightSide), z] as [number, number, number],
        rotation: [randomBetween(random, 0, Math.PI), randomBetween(random, 0, Math.PI), randomBetween(random, 0, Math.PI)] as [number, number, number],
        scale,
        color: pick(random, DUST_COLORS),
      }
    })
  }, [seed])

  const slabs = useMemo(() => {
    const random = mulberry32(seed + 202)
    return Array.from({ length: 22 }).map(() => ({
      position: [randomBetween(random, -6, 7.8), randomBetween(random, 0.25, 4.0), randomBetween(random, 0.4, 6.8)] as [number, number, number],
      rotation: [randomBetween(random, -0.4, 0.4), randomBetween(random, -0.6, 0.6), randomBetween(random, -0.7, 0.7)] as [number, number, number],
      size: [randomBetween(random, 0.7, 2.1), randomBetween(random, 0.12, 0.3), randomBetween(random, 0.5, 1.5)] as [number, number, number],
      color: pick(random, CONCRETE_COLORS),
    }))
  }, [seed])

  const mound = useMemo(() => {
    const random = mulberry32(seed + 303)
    return Array.from({ length: 30 }).map(() => {
      const angle = randomBetween(random, 0, Math.PI * 2)
      const radius = Math.sqrt(random()) * 4.8
      return {
        position: [
          3.2 + Math.cos(angle) * radius * 1.15,
          randomBetween(random, 0.4, 3.8) - radius * 0.3,
          2.5 + Math.sin(angle) * radius * 0.82,
        ] as [number, number, number],
        rotation: [randomBetween(random, 0, Math.PI), randomBetween(random, 0, Math.PI), randomBetween(random, 0, Math.PI)] as [number, number, number],
        scale: randomBetween(random, 0.7, 1.7),
        color: pick(random, CONCRETE_COLORS),
      }
    })
  }, [seed])

  return (
    <group>
      {[
        { position: [3.4, 0.45, 2.6] as [number, number, number], scale: [5.0, 1.35, 3.5] as [number, number, number], rotation: [0.1, 0.4, -0.08] as [number, number, number] },
        { position: [0.9, 0.28, 4.3] as [number, number, number], scale: [3.2, 0.85, 2.6] as [number, number, number], rotation: [-0.15, -0.3, 0.12] as [number, number, number] },
        { position: [6.1, 0.3, 3.4] as [number, number, number], scale: [3.0, 0.95, 2.5] as [number, number, number], rotation: [0.08, 0.8, 0.06] as [number, number, number] },
        { position: [4.7, 1.2, 1.5] as [number, number, number], scale: [3.8, 2.1, 2.8] as [number, number, number], rotation: [0.22, -0.3, 0.12] as [number, number, number] },
      ].map((rock, index) => (
        <mesh key={`base-${index}`} position={rock.position} rotation={rock.rotation} scale={rock.scale} castShadow receiveShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#7b776c" roughness={1} flatShading />
        </mesh>
      ))}
      {chunks.map((chunk, index) => (
        <mesh key={index} position={chunk.position} rotation={chunk.rotation} scale={chunk.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={chunk.color} roughness={1} flatShading />
        </mesh>
      ))}
      {mound.map((chunk, index) => (
        <mesh key={`mound-${index}`} position={chunk.position} rotation={chunk.rotation} scale={chunk.scale} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={chunk.color} roughness={1} flatShading />
        </mesh>
      ))}
      {slabs.map((slab, index) => (
        <ConcreteBlock key={index} {...slab} />
      ))}
    </group>
  )
}

export function SceneGround({ seed }: { seed: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#454b41" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]} receiveShadow>
        <circleGeometry args={[22, 48]} />
        <meshStandardMaterial color="#505545" roughness={1} metalness={0} />
      </mesh>

      <Grid
        args={[70, 70]}
        position={[0, 0.035, 0]}
        cellSize={1}
        cellThickness={0.45}
        cellColor="#1d3328"
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor="#2c4c3c"
        fadeDistance={34}
        fadeStrength={1.5}
        infiniteGrid
      />

      <group position={[0, 0.045, 1.2]}>
        {[-10, -5, 0, 5, 10].map((x) => (
          <mesh key={`x-${x}`} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.025, 18]} />
            <meshBasicMaterial color="#b9a24c" transparent opacity={0.16} depthWrite={false} />
          </mesh>
        ))}
        {[-7.5, -3.5, 0.5, 4.5, 8.5].map((z) => (
          <mesh key={`z-${z}`} position={[0, 0, z - 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[22, 0.025]} />
            <meshBasicMaterial color="#b9a24c" transparent opacity={0.13} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <Trees seed={seed} />
      <SiteDressing />
      <DistantCity seed={seed} />

      <ContactShadows position={[0, 0.05, 0]} opacity={0.5} scale={32} blur={2.6} far={15} color="#101610" frames={1} />
      <Sparkles count={90} scale={[24, 10, 18]} size={2.4} speed={0.2} opacity={0.2} color="#d7dfd1" position={[0, 4.6, 0]} />
    </group>
  )
}
