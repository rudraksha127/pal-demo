import { MATERIALS } from './SceneMaterials'

interface TowerProps {
  position: [number, number, number]
  floors: number
  width: number
  depth: number
  damaged?: boolean
}

export function Tower({ position, floors, width, depth, damaged = false }: TowerProps) {
  const concreteColor = damaged ? MATERIALS.concrete.damaged.color : MATERIALS.concrete.intact.color
  const concreteMat = damaged ? MATERIALS.concrete.damaged : MATERIALS.concrete.intact
  const rebarMat = MATERIALS.rebar.exposed

  return (
    <group position={position}>
      {Array.from({ length: floors }).map((_, floor) => {
        const y = floor * 1.3
        return (
          <group key={floor} position={[0, y, 0]}>
            {/* Floor slab */}
            <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, 0.16, depth]} />
              <meshPhysicalMaterial
                color={concreteColor}
                roughness={concreteMat.roughness}
                metalness={concreteMat.metalness}
                clearcoat={concreteMat.clearcoat}
                clearcoatRoughness={concreteMat.clearcoatRoughness}
              />
            </mesh>

            {/* Pillars at corners */}
            {[-1, 1].map((xSign) =>
              [-1, 1].map((zSign) => (
                <mesh
                  key={`${xSign}-${zSign}`}
                  position={[xSign * (width / 2 - 0.15), 0.7, zSign * (depth / 2 - 0.15)]}
                  castShadow
                  receiveShadow
                >
                  <cylinderGeometry args={[0.15, 0.15, 1.3, 8]} />
                  <meshPhysicalMaterial
                    color={concreteColor}
                    roughness={concreteMat.roughness}
                    metalness={concreteMat.metalness}
                    clearcoat={concreteMat.clearcoat}
                    clearcoatRoughness={concreteMat.clearcoatRoughness}
                  />
                </mesh>
              ))
            )}

            {/* Exposed rebar on damaged floors */}
            {damaged && floor > 1 && (
              <>
                <group>
                  {[-1, 1].map((xSign) =>
                    [-1, 1].map((zSign) => (
                      <mesh
                        key={`rebar-${xSign}-${zSign}`}
                        position={[xSign * (width / 2 - 0.15), 0.7, zSign * (depth / 2 - 0.15)]}
                        castShadow
                      >
                        <cylinderGeometry args={[0.025, 0.02, 1.3, 5]} />
                        <meshStandardMaterial
                          color={rebarMat.color}
                          roughness={rebarMat.roughness}
                          metalness={rebarMat.metalness}
                          transparent
                          opacity={rebarMat.opacity}
                        />
                      </mesh>
                    ))
                  )}
                </group>
              </>
            )}

            {/* Floor beams */}
            <group>
              {Array.from({ length: 3 }).map((_, i) => (
                <mesh
                  key={`beam-x-${i}`}
                  position={[-width / 2 + 0.3 + i * (width / 3), 0.7, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[depth - 0.4, 0.12, 0.12]} />
                  <meshStandardMaterial
                    color={concreteColor}
                    roughness={concreteMat.roughness}
                    metalness={concreteMat.metalness}
                  />
                </mesh>
              ))}
              {Array.from({ length: 3 }).map((_, i) => (
                <mesh
                  key={`beam-z-${i}`}
                  position={[0, 0.7, -depth / 2 + 0.3 + i * (depth / 3)]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[width - 0.4, 0.12, 0.12]} />
                  <meshStandardMaterial
                    color={concreteColor}
                    roughness={concreteMat.roughness}
                    metalness={concreteMat.metalness}
                  />
                </mesh>
              ))}
            </group>
          </group>
        )
      })}
    </group>
  )
}

