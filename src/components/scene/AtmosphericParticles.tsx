import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AtmosphericParticlesProps {
  count?: number
  area?: number
  height?: number
  color?: string
  speed?: number
}

export function AtmosphericParticles({
  count = 500,
  area = 40,
  height = 20,
  color = '#8a867a',
  speed = 1,
}: AtmosphericParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const sizesRef = useRef<Float32Array | null>(null)
  const alphasRef = useRef<Float32Array | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const points = ref.current
    if (!points) return

    const positions = points.geometry.attributes.position.array as Float32Array
    const velocities = points.geometry.attributes.velocity?.array as Float32Array || new Float32Array(count * 3)
    const sizes = points.geometry.attributes.size.array as Float32Array
    const alphas = points.geometry.attributes.alpha.array as Float32Array

    positionsRef.current = positions
    velocitiesRef.current = velocities
    sizesRef.current = sizes
    alphasRef.current = alphas

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area
      positions[i * 3 + 1] = Math.random() * height
      positions[i * 3 + 2] = (Math.random() - 0.5) * area
      velocities[i * 3] = (Math.random() - 0.5) * 0.02 * speed
      velocities[i * 3 + 1] = -Math.random() * 0.01 * speed - 0.005 * speed
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02 * speed
      sizes[i] = Math.random() * 0.3 + 0.1
      alphas[i] = Math.random() * 0.5 + 0.1
    }

    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.size.needsUpdate = true
    points.geometry.attributes.alpha.needsUpdate = true
    if (points.geometry.attributes.velocity) points.geometry.attributes.velocity.needsUpdate = true
  }, [count, area, height, speed])

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

      alphas[i] = 0.1 + 0.4 * Math.sin(timeRef.current * 3 * speed + i * 0.1) * Math.sin(timeRef.current * 2 * speed + i * 0.07)
    }

    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.alpha.needsUpdate = true
    points.rotation.y = timeRef.current * 0.002 * speed
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(count * 3), 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-velocity" args={[new Float32Array(count * 3), 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" args={[new Float32Array(count), 1]} count={count} itemSize={1} />
        <bufferAttribute attach="attributes-alpha" args={[new Float32Array(count), 1]} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.6}
        depthWrite={false}
        sizeAttenuation
      >
        <color attach="color" args={[color]} />
      </pointsMaterial>
    </points>
  )
}