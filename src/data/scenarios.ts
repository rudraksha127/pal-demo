import type { Scenario, StageDefinition, StageId } from '../types'

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    label: 'Disaster Registration',
    short: 'Registration',
    start: 0,
    end: 5,
    detail: 'Incident intake, geolocation and command authorisation.',
  },
  {
    id: 2,
    label: 'Building & Floor Plan',
    short: 'Floor plan',
    start: 5,
    end: 13,
    detail: 'Structural survey and occupancy model reconstruction.',
  },
  {
    id: 3,
    label: 'Search Zones',
    short: 'Zones',
    start: 13,
    end: 25,
    detail: 'Collapse voids classified into primary, search and collapse zones.',
  },
  {
    id: 4,
    label: 'Sensor Deployment',
    short: 'Sensors',
    start: 25,
    end: 42,
    detail: 'Radar, acoustic and vibration arrays positioned around the site.',
  },
  {
    id: 5,
    label: 'Scanning & Collection',
    short: 'Scanning',
    start: 42,
    end: 72,
    detail: 'Multi-sensor sweep collecting micro-motion, voice and vibration.',
  },
  {
    id: 6,
    label: 'Signal Processing',
    short: 'Processing',
    start: 72,
    end: 84,
    detail: 'Noise rejection and cross-channel evidence fusion.',
  },
  {
    id: 7,
    label: 'Victim Localization',
    short: 'Localization',
    start: 84,
    end: 94,
    detail: 'Triangulating survivor position and uncertainty envelope.',
  },
  {
    id: 8,
    label: 'Rescue Confirmation',
    short: 'Confirmation',
    start: 94,
    end: 100,
    detail: 'Handoff to rescue team and confirmation of viable contact.',
  },
]

export function stageForProgress(progress: number): StageId {
  if (progress >= 94) return 8
  if (progress >= 84) return 7
  if (progress >= 72) return 6
  if (progress >= 42) return 5
  if (progress >= 25) return 4
  if (progress >= 13) return 3
  if (progress >= 5) return 2
  return 1
}

export const INITIAL_SNAPSHOT_PROGRESS = 62

export const BASE_ZONES = [
  {
    id: 'Z-01',
    label: 'Z-01 (Primary)',
    kind: 'primary' as const,
    color: '#2df08a',
    floor: 2,
    position: [4.3, 2.4, 3.2] as [number, number, number],
    size: [3.2, 3.2, 3.2] as [number, number, number],
    confidence: 94,
  },
  {
    id: 'Z-02',
    label: 'Z-02 (Search)',
    kind: 'search' as const,
    color: '#ffd447',
    floor: 2,
    position: [-3.0, 2.9, 2.2] as [number, number, number],
    size: [3.0, 3.0, 3.0] as [number, number, number],
    confidence: 71,
  },
  {
    id: 'Z-03',
    label: 'Z-03 (Collapse)',
    kind: 'collapse' as const,
    color: '#ff5f56',
    floor: 3,
    position: [2.8, 6.0, -1.4] as [number, number, number],
    size: [3.8, 2.8, 3.2] as [number, number, number],
    confidence: 88,
  },
]

const BASE_SENSORS = [
  { id: 'R-01', kind: 'radar' as const, label: 'Radar array', position: [-6.4, 0, 4.7] as [number, number, number] },
  { id: 'R-02', kind: 'radar' as const, label: 'Radar array', position: [0.2, 0, 6.7] as [number, number, number] },
  { id: 'R-03', kind: 'radar' as const, label: 'Radar array', position: [6.9, 0, 4.1] as [number, number, number] },
]

export const SCENARIOS: Scenario[] = [
  {
    id: 'urban-collapse',
    name: 'Urban Building Collapse',
    opId: 'OP-2025-0417',
    sector: 'Sector-17, City Center',
    structure: 'Reinforced Concrete',
    floors: 5,
    collapse: 'Partial',
    temperature: 26,
    weather: 'Clear',
    weatherKind: 'clear',
    summary:
      'Five-storey reinforced concrete office block suffered a partial progressive collapse. Two stairwells remain accessible; the east wing has formed a stacked void with confirmed micro-motion.',
    difficulty: 'Critical',
    seed: 417,
    estimatedVictims: 1,
    zones: BASE_ZONES,
    sensors: BASE_SENSORS,
    victim: { id: 'T-01', floor: 2, position: [2.6, 5.15, -0.7], zoneId: 'Z-03' },
    timeline: 'Collapse reported 18 minutes ago. Aftershock risk: moderate.',
  },
  {
    id: 'metro-failure',
    name: 'Metro Station Structural Failure',
    opId: 'OP-2025-0512',
    sector: 'Sector-09, Transit Hub',
    structure: 'Steel Frame',
    floors: 3,
    collapse: 'Total',
    temperature: 22,
    weather: 'Overcast',
    weatherKind: 'cloud',
    summary:
      'Ceiling diaphragm failure across the eastern concourse. Acoustic arrays report repeated tapping beneath the escalator bank; access is restricted to the north service corridor.',
    difficulty: 'Critical',
    seed: 512,
    estimatedVictims: 2,
    zones: BASE_ZONES.map((zone, index) => ({
      ...zone,
      floor: index === 2 ? 1 : 2,
      label: zone.id === 'Z-01' ? 'Z-01 (Concourse)' : zone.label,
    })),
    sensors: BASE_SENSORS.map((sensor, index) => ({
      ...sensor,
      position: [sensor.position[0] * 0.85, 0, sensor.position[2] * 0.9 + index * 0.2] as [number, number, number],
    })),
    victim: { id: 'T-01', floor: 1, position: [2.6, 2.1, -0.7], zoneId: 'Z-03' },
    timeline: 'Failure reported 41 minutes ago. Secondary collapse risk: high.',
  },
  {
    id: 'wildfire-perimeter',
    name: 'Wildfire Perimeter Search',
    opId: 'OP-2025-0628',
    sector: 'Sector-22, Ridge Line',
    structure: 'Timber & Masonry',
    floors: 2,
    collapse: 'Partial',
    temperature: 31,
    weather: 'Smoke',
    weatherKind: 'smoke',
    summary:
      'Ember front passed through a hillside settlement. Thermal shadowing is degrading radar returns; acoustic and vibration channels are prioritised for survivor contact.',
    difficulty: 'High',
    seed: 628,
    estimatedVictims: 3,
    zones: BASE_ZONES.map((zone) => ({ ...zone, floor: Math.min(2, zone.floor) })),
    sensors: BASE_SENSORS,
    victim: { id: 'T-02', floor: 1, position: [2.6, 2.0, -0.7], zoneId: 'Z-03' },
    timeline: 'Fire front 2.4 km north-east. Wind 18 km/h, shifting.',
  },
  {
    id: 'flooded-garage',
    name: 'Flooded Parking Structure',
    opId: 'OP-2025-0704',
    sector: 'Sector-04, Riverside',
    structure: 'Cast-in-place Concrete',
    floors: 4,
    collapse: 'Pancake',
    temperature: 19,
    weather: 'Rain',
    weatherKind: 'rain',
    summary:
      'Two basement levels inundated after river wall breach. Sonar and acoustic contact indicate a trapped group near the west ramp; radar penetration is limited by standing water.',
    difficulty: 'High',
    seed: 704,
    estimatedVictims: 2,
    zones: BASE_ZONES.map((zone) => ({ ...zone, floor: Math.max(1, zone.floor - 1) })),
    sensors: BASE_SENSORS,
    victim: { id: 'T-03', floor: 1, position: [2.6, 2.0, -0.7], zoneId: 'Z-03' },
    timeline: 'Water level rising 4 cm/hour. Pump capacity at 62%.',
  },
]

export function getScenario(id: string): Scenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0]
}
