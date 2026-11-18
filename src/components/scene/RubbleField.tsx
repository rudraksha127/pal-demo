import { useMemo } from 'react'
import { MATERIALS } from './SceneMaterials'

interface RubbleFieldProps {
  seed?: number
}

export function RubbleField({ seed = 42 }: RubbleFieldProps) {
  const rng = useMemo(() => {
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296
      return s / 4294967296
    }
  }, [seed])

  const rubble = useMemo(() => {
    const pieces: Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number]; type: 'block' | 'slab' | 'chunk' }> = []
    for (let i = 0; i < 120; i++) {
      const x = (rng() - 0.5) * 24
      const z = (rng() - 0.5) * 18
      if (x * x + z * z < 9) continue
      pieces.push({
        position: [x, rng() * 0.8 + 0.1, z],
        rotation: [rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3],
        scale: [0.3 + rng() * 1.2, 0.15 + rng() * 0.6, 0.3 + rng() * 1.0],
        type: rng() > 0.7 ? 'slab' : rng() > 0.4 ? 'block' : 'chunk',
      })
    }
    return pieces
  }, [rng])

  return (
    <group>
      {rubble.map((piece, i) => (
        <mesh
          key={i}
          position={piece.position}
          rotation={piece.rotation}
          scale={piece.scale}
          castShadow
          receiveShadow
        >
          {piece.type === 'slab' ? (
            <boxGeometry args={[1, 0.1, 1]} />
          ) : piece.type === 'block' ? (
            <boxGeometry args={[1, 1, 1]} />
          ) : (
            <dodecahedronGeometry args={[1, 0]} />
          )}
          <meshStandardMaterial
            color={MATERIALS.rubble.concrete.color}
            roughness={MATERIALS.rubble.concrete.roughness}
            metalness={MATERIALS.rubble.concrete.metalness}
            flatShading={piece.type === 'chunk'}
          />
        </mesh>
      ))}
    </group>
  )
}