import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SparkleParticlesProps {
  count?: number
  scale?: [number, number, number]
  color?: string
  speed?: number
}

export function SparkleParticles({ count = 200, scale = [24, 10, 18], color = '#d7dfd1', speed = 1 }: SparkleParticlesProps) {
  const ref = useRef<THREE.Points>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const sizesRef = useRef<Float32Array | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const points = ref.current
    if (!points) return

    const positions = points.geometry.attributes.position.array as Float32Array
    const sizes = points.geometry.attributes.size.array as Float32Array

    positionsRef.current = positions
    sizesRef.current = sizes

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * scale[0]
      positions[i * 3 + 1] = Math.random() * scale[1] + 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * scale[2]
      sizes[i] = Math.random() * 3 + 1
    }

    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.size.needsUpdate = true
  }, [count, scale])

  useFrame(({ clock }) => {
    const points = ref.current
    if (!points) return
    timeRef.current = clock.getElapsedTime()

    const positions = positionsRef.current!
    const sizes = sizesRef.current!

    for (let i = 0; i < count; i++) {
      const t = timeRef.current * speed + i * 0.1
      positions[i * 3 + 1] = Math.sin(t * 0.5) * 2 + scale[1] / 2 + 2
      sizes[i] = 1 + Math.sin(t * 2) * 0.5 + Math.cos(t * 1.5) * 0.3
    }

    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.size.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(count * 3), 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" args={[new Float32Array(count), 1]} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={2.5}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
      >
        <color attach="color" args={[color]} />
      </pointsMaterial>
    </points>
  )
}