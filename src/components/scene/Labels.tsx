import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

interface SceneLabelSpriteProps {
  title: string
  subtitle?: string
  color: string
  position: [number, number, number]
  width: number
  height: number
  selected?: boolean
  onClick?: () => void
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function useLabelTexture(title: string, subtitle: string | undefined, color: string, selected: boolean) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = subtitle ? 256 : 144
    const context = canvas.getContext('2d')
    if (context) {
      const border = selected ? 9 : 6
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.save()
      context.shadowColor = color
      context.shadowBlur = selected ? 34 : 22
      roundedRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 24)
      context.fillStyle = 'rgba(3, 12, 7, 0.9)'
      context.fill()
      context.lineWidth = border
      context.strokeStyle = color
      context.globalAlpha = selected ? 1 : 0.78
      context.stroke()
      context.restore()

      context.textAlign = 'center'
      context.textBaseline = 'middle'

      if (subtitle) {
        context.font = '700 64px Inter, "Segoe UI", sans-serif'
        context.fillStyle = '#effff6'
        context.fillText(title, canvas.width / 2, 98)
        context.font = '600 31px Inter, "Segoe UI", sans-serif'
        context.fillStyle = color
        context.globalAlpha = 0.96
        context.fillText(subtitle, canvas.width / 2, 170)
      } else {
        context.font = '700 58px Inter, "Segoe UI", sans-serif'
        context.fillStyle = '#effff6'
        context.fillText(title, canvas.width / 2, canvas.height / 2 + 2)
      }
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    return texture
  }, [title, subtitle, color, selected])
}

export function SceneLabelSprite({
  title,
  subtitle,
  color,
  position,
  width,
  height,
  selected = false,
  onClick,
}: SceneLabelSpriteProps) {
  const texture = useLabelTexture(title, subtitle, color, selected)

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <sprite
      position={position}
      scale={[width, height, 1]}
      renderOrder={20}
      onClick={
        onClick
          ? (event) => {
              event.stopPropagation()
              onClick()
            }
          : undefined
      }
      onPointerOver={
        onClick
          ? () => {
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        onClick
          ? () => {
              document.body.style.cursor = ''
            }
          : undefined
      }
    >
      <spriteMaterial
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        sizeAttenuation
      />
    </sprite>
  )
}
