export function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomBetween(random: () => number, min: number, max: number): number {
  return min + random() * (max - min)
}

export function pick<T>(random: () => number, values: T[]): T {
  return values[Math.floor(random() * values.length)] ?? values[0]
}
