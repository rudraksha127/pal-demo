import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DustParticlesProps {
  count?: number
  area?: number
  height?: number
  density?: number
}

export function DustParticles({ count = 1000, area = 50, height = 25, density = 1 }: DustParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const alphasRef = useRef<Float32Array | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const points = ref.current
    if (!points) return

    const positions = points.geometry.attributes.position.array as Float32Array
    const velocities = points.geometry.attributes.velocity?.array as Float32Array || new Float32Array(count * 3)
    const alphas = points.geometry.attributes.alpha.array as Float32Array

    positionsRef.current = positions
    velocitiesRef.current = velocities
    alphasRef.current = alphas

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area
      positions[i * 3 + 1] = Math.random() * height
      positions[i * 3 + 2] = (Math.random() - 0.5) * area
      velocities[i * 3] = (Math.random() - 0.5) * 0.05 * density
      velocities[i * 3 + 1] = -Math.random() * 0.03 * density - 0.01 * density
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05 * density
      alphas[i] = Math.random() * 0.3 * density + 0.05
    }

    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.alpha.needsUpdate = true
    if (points.geometry.attributes.velocity) points.geometry.attributes.velocity.needsUpdate = true
  }, [count, area, height, density])

  useFrame(({ clock }) => {
    const points = ref.current
    if (!points) return
    timeRef.current = clock.getElapsedTime()

    const positions = positionsRef.current!
    const velocities = velocitiesRef.current!
    const alphas = alphasRef.current!

    for (let i = 0; i < count; i++) {
      positions[i * 3] += velocities[i * 3]
      positions[i * 3 + 1] += velocities[i * 3 + 1]
      positions[i * 3 + 2] += velocities[i * 3 + 2]

      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = height
        positions[i * 3] = (Math.random() - 0.5) * area
        positions[i * 3 + 2] = (Math.random() - 0.5) * area
      }
      if (Math.abs(positions[i * 3]) > area / 2) positions[i * 3] = -Math.sign(positions[i * 3]) * area / 2
      if (Math.abs(positions[i * 3 + 2]) > area / 2) positions[i * 3 + 2] = -Math.sign(positions[i * 3 + 2]) * area / 2

      alphas[i] = 0.05 + 0.25 * density * Math.sin(timeRef.current * 4 * density + i * 0.05)
    }

    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.alpha.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(count * 3), 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-velocity" args={[new Float32Array(count * 3), 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-alpha" args={[new Float32Array(count), 1]} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#8a8579"
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}