import * as THREE from 'three'

// ── PBR Material Configurations ────────────────────────────────
export const MATERIALS = {
  concrete: {
    intact: {
      color: '#8a867a',
      roughness: 0.92,
      metalness: 0.02,
      clearcoat: 0.1,
      clearcoatRoughness: 0.8,
    },
    damaged: {
      color: '#6b685d',
      roughness: 0.95,
      metalness: 0.03,
      clearcoat: 0.05,
      clearcoatRoughness: 0.9,
    },
    weathered: {
      color: '#5d5a52',
      roughness: 0.98,
      metalness: 0.01,
    },
  },

  rebar: {
    exposed: {
      color: '#4a382a',
      roughness: 0.75,
      metalness: 0.45,
      transparent: true,
      opacity: 0.7,
    },
    rusted: {
      color: '#8b4513',
      roughness: 0.85,
      metalness: 0.3,
    },
  },

  sensor: {
    housing: {
      color: '#1a1f26',
      roughness: 0.3,
      metalness: 0.8,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    },
    lens: {
      color: '#0d2530',
      roughness: 0.05,
      metalness: 0.95,
      transmission: 0.85,
      thickness: 0.5,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    },
    lensActive: {
      color: '#00ff88',
      roughness: 0.02,
      metalness: 0.98,
      transmission: 0.9,
      emissive: '#00ff88',
      emissiveIntensity: 0.3,
    },
  },

  rubble: {
    concrete: {
      color: '#7a766d',
      roughness: 0.95,
      metalness: 0.01,
    },
    debris: {
      color: '#6d6a62',
      roughness: 0.98,
      metalness: 0.0,
    },
  },

  zone: {
    volume: {
      roughness: 0.8,
      metalness: 0.05,
      transmission: 0.1,
      thickness: 0.5,
      ior: 1.1,
    },
    wireframe: {},
  },

  ground: {
    base: {
      color: '#2d3328',
      roughness: 1,
      metalness: 0,
    },
    center: {
      color: '#3a4335',
      roughness: 1,
      metalness: 0,
    },
  },
} as const

// ── Shader Materials ──────────────────────────────────────────
export const pulseShaderMaterial = (color: string = '#2df08a') => new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uIntensity: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    float pulse(float t, float speed, float width) {
      return smoothstep(1.0 - width, 1.0, sin(t * speed)) * smoothstep(width, 0.0, sin(t * speed));
    }
    
    void main() {
      float p = pulse(uTime * 2.0 + vWorldPosition.y * 0.5, 3.0, 0.15);
      float edge = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)));
      vec3 col = mix(uColor * 0.3, uColor, p * uIntensity);
      col += vec3(0.1) * edge * pulse(uTime * 5.0, 10.0, 0.05);
      float alpha = 0.4 + 0.6 * p;
      gl_FragColor = vec4(col, alpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
})

export const scanLineShaderMaterial = (color: string = '#3fdcff') => new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uProgress: { value: 0 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uProgress;
    uniform vec3 uColor;
    varying vec3 vWorldPosition;
    
    void main() {
      float line = step(uProgress - 0.02, vWorldPosition.z / 20.0) * step(vWorldPosition.z / 20.0, uProgress);
      float glow = 1.0 - abs(vWorldPosition.z / 20.0 - uProgress) * 20.0;
      vec3 col = uColor * (line + glow * 0.5);
      float alpha = line + glow * 0.3;
      gl_FragColor = vec4(col, alpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
})

// ── Color Palette for Status ──────────────────────────────────
export const STATUS_COLORS = {
  not_checked: '#93a89c',
  checked: '#2df08a',
  possible_survivor: '#ffd447',
  needs_verification: '#ffb454',
  unverified: '#ff5f56',
  human_verified: '#5cffab',
} as const

export const HEALTH_COLORS = {
  online: '#2df08a',
  degraded: '#ffd447',
  offline: '#ff5f56',
} as const

// ── Helper to create mesh standard material from config ───────
export function createMaterial(config: Record<string, any>): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial()
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'color' && typeof value === 'string') {
      material.color = new THREE.Color(value)
    } else {
      (material as any)[key] = value
    }
  })
  return material
}

export function createPhysicalMaterial(config: Record<string, any>): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial()
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'color' && typeof value === 'string') {
      material.color = new THREE.Color(value)
    } else if (key === 'emissive' && typeof value === 'string') {
      material.emissive = new THREE.Color(value)
    } else {
      (material as any)[key] = value
    }
  })
  return material
}