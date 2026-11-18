import type {
  ReassessmentAlternative,
  SafeArea,
  SafetyCheck,
  SearchZone,
  SensorConfig,
  SensorType,
  SensorTypeMeta,
  ZoneId,
  ZoneStatus,
} from './types'

export const INCIDENT_NAME = 'Riverside Residential Block'
export const INCIDENT_ID = 'RF-2026-0417'
export const INCIDENT_ADDRESS = 'Riverside District · Sector 4 · Building 12'

export const SCENES = [
  { id: 1, short: 'Normal', label: 'Normal Building', objective: 'A five-storey residential building is operating under normal conditions.' },
  { id: 2, short: 'Collapse', label: 'Earthquake & Collapse', objective: 'Simulate the earthquake and progressive structural collapse.' },
  { id: 3, short: 'Safety', label: 'Rescue Arrival & Safety', objective: 'Assess structural, fire, electrical and access hazards before deployment.' },
  { id: 4, short: 'Zones', label: 'Create Search Zones', objective: 'Divide the accessible search area into three example zones.' },
  { id: 5, short: 'Deploy', label: 'Sensor Deployment', objective: 'Configure and deploy illustrative sensor nodes at safe positions.' },
  { id: 6, short: 'Gateway', label: 'Central Gateway', objective: 'Establish the local sensor-to-gateway communication architecture.' },
  { id: 7, short: 'Scanning', label: 'Scanning & Events', objective: 'Run the pre-programmed illustrative scan and process observations.' },
  { id: 8, short: 'Dashboard', label: 'Rescue Dashboard', objective: 'Review zone status, node health, gateway traffic and the event ledger.' },
  { id: 9, short: 'Failure', label: 'Sensor Failure', objective: 'Observe how a failed node affects coverage and zone confidence.' },
  { id: 10, short: 'Verify', label: 'Rescan & Verification', objective: 'Reassess, rescan and require independent human verification.' },
  { id: 11, short: 'Extract', label: 'Extraction & Medical', objective: 'Record the rescue sequence without making medical claims.' },
  { id: 12, short: 'Report', label: 'Final Search Report', objective: 'Review the incident record derived from the simulation ledger.' },
] as const

export const ZONE_STATUS_META: Record<
  ZoneStatus,
  { label: string; color: string; description: string; short: string }
> = {
  not_checked: {
    label: 'Not Checked',
    short: 'Unsearched',
    color: '#93a89c',
    description: 'No valid scan has been completed for this zone.',
  },
  checked: {
    label: 'Checked',
    short: 'Scanned',
    color: '#2df08a',
    description: 'A valid measurement completed with no qualifying candidate signal. This does not prove the area is empty.',
  },
  possible_survivor: {
    label: 'Possible Survivor',
    short: 'Candidate',
    color: '#ffd447',
    description: 'A candidate observation needs independent human verification. This is not a confirmed survivor.',
  },
  needs_verification: {
    label: 'Needs Verification',
    short: 'Ambiguous',
    color: '#ffb454',
    description: 'Evidence is incomplete, ambiguous, or requires further investigation.',
  },
  unverified: {
    label: 'Unverified',
    short: 'No coverage',
    color: '#ff5f56',
    description: 'Sensor failure, poor measurement quality, missing data, or insufficient coverage prevents a reliable conclusion.',
  },
  human_verified: {
    label: 'Human Verified',
    short: 'Verified',
    color: '#5cffab',
    description: 'Trained rescue personnel independently verified the possible survivor.',
  },
}

export const SENSOR_TYPES: SensorTypeMeta[] = [
  {
    id: 'fmcw_radar',
    label: 'FMCW Radar',
    short: 'Radar',
    role: 'primary',
    purpose: 'Investigates tiny movement patterns that could potentially be associated with breathing.',
    limitation: 'Illustrative only. Radar penetration through concrete and rubble has not been validated.',
    defaultZone: 'A',
    defaultSafeArea: 'A1',
  },
  {
    id: 'geophone',
    label: 'Geophone',
    short: 'Geophone',
    role: 'supporting',
    purpose: 'Measures vibrations transmitted through the ground or rubble.',
    limitation: 'Detects surface and ground vibration only; it cannot identify a person.',
    defaultZone: 'C',
    defaultSafeArea: 'C1',
  },
  {
    id: 'contact_microphone',
    label: 'Contact Microphone',
    short: 'Contact mic',
    role: 'supporting',
    purpose: 'Detects sounds or vibrations transmitted through a surface, such as possible knocking.',
    limitation: 'Ambient noise and structural settling can produce similar signals.',
    defaultZone: 'B',
    defaultSafeArea: 'B1',
  },
  {
    id: 'thermal_camera',
    label: 'Thermal Camera',
    short: 'Thermal',
    role: 'inspection',
    purpose: 'Examines thermal patterns in visible or accessible areas.',
    limitation: 'Cannot see through solid concrete.',
    defaultZone: 'B',
    defaultSafeArea: 'B1',
  },
  {
    id: 'borescope',
    label: 'Borescope Camera',
    short: 'Borescope',
    role: 'inspection',
    purpose: 'Inspects an accessible opening or gap.',
    limitation: 'Requires a safe, accessible opening and provides a limited field of view.',
    defaultZone: 'A',
    defaultSafeArea: 'A1',
  },
]

export const SAFE_AREAS: SafeArea[] = [
  {
    id: 'A1',
    label: 'Safe Access A1',
    zoneId: 'A',
    position: [6.3, 0, 5.0],
    state: 'safe',
    note: 'Open south-east pavement; clear of overhead debris.',
  },
  {
    id: 'B1',
    label: 'Safe Access B1',
    zoneId: 'B',
    position: [-6.4, 0, 4.8],
    state: 'safe',
    note: 'West perimeter walkway; approved by the safety assessment.',
  },
  {
    id: 'C1',
    label: 'Safe Access C1',
    zoneId: 'C',
    position: [7.4, 0, -1.1],
    state: 'safe',
    note: 'Accessible rear service edge; stable ground outside the exclusion line.',
  },
  {
    id: 'C2',
    label: 'Candidate C2',
    zoneId: 'C',
    position: [2.2, 0, -5.6],
    state: 'rejected',
    note: 'Rejected: overhead slab instability and falling-debris exposure.',
  },
  {
    id: 'C3',
    label: 'Candidate C3',
    zoneId: 'C',
    position: [-0.6, 0, -5.8],
    state: 'rejected',
    note: 'Rejected: access route blocked by debris and an unstable wall.',
  },
]

export const SAFE_AREA_BY_ID: Record<string, SafeArea> = Object.fromEntries(
  SAFE_AREAS.map((area) => [area.id, area]),
)

export const SAFETY_CHECK_TEMPLATES: Array<{
  id: string
  label: string
  detail: string
  result: string
  state: SafetyCheck['state']
}> = [
  {
    id: 'structural',
    label: 'Structural instability and secondary collapse',
    detail: 'Evaluate slab stability, leaning walls, overhangs and exclusion lines.',
    result: 'East wing unstable. Rear corridor excluded. Perimeter access retained.',
    state: 'controlled',
  },
  {
    id: 'fire',
    label: 'Fire, smoke and gas hazards',
    detail: 'Check for active combustion, smoke accumulation and gas exposure.',
    result: 'No active fire or gas indication in the assessed area. Monitoring continues.',
    state: 'clear',
  },
  {
    id: 'electrical',
    label: 'Electrical hazards',
    detail: 'Identify exposed conductors, damaged supply and overhead cables.',
    result: 'Local supply isolated. Overhead cables excluded from access routes.',
    state: 'controlled',
  },
  {
    id: 'access',
    label: 'Safe access routes',
    detail: 'Confirm protected ingress and egress paths for rescue personnel.',
    result: 'South and west perimeter walkways approved for controlled access.',
    state: 'clear',
  },
  {
    id: 'deployment',
    label: 'Safe sensor deployment locations',
    detail: 'Identify stable, accessible positions outside the collapse exclusion line.',
    result: 'A1, B1 and C1 approved. C2 and C3 rejected due to instability and blockage.',
    state: 'controlled',
  },
]

export function initialSafetyChecks(): SafetyCheck[] {
  return SAFETY_CHECK_TEMPLATES.map((check) => ({
    id: check.id,
    label: check.label,
    detail: check.detail,
    result: 'Awaiting safety assessment.',
    state: 'pending',
  }))
}

export function completedSafetyChecks(): SafetyCheck[] {
  return SAFETY_CHECK_TEMPLATES.map((check) => ({
    id: check.id,
    label: check.label,
    detail: check.detail,
    result: check.result,
    state: check.state,
  }))
}

export const ZONES: SearchZone[] = [
  {
    id: 'A',
    label: 'Zone A',
    name: 'South-east rubble void',
    status: 'not_checked',
    center: [3.6, 0, 1.9],
    size: [4.6, 0.12, 3.8],
    safeAreaIds: ['A1'],
    lastObservationAt: null,
    notes: [],
  },
  {
    id: 'B',
    label: 'Zone B',
    name: 'West wing accessible void',
    status: 'not_checked',
    center: [-3.2, 0, 2.1],
    size: [4.0, 0.12, 3.5],
    safeAreaIds: ['B1'],
    lastObservationAt: null,
    notes: [],
  },
  {
    id: 'C',
    label: 'Zone C',
    name: 'Rear service corridor',
    status: 'not_checked',
    center: [3.8, 0, -3.1],
    size: [3.4, 0.12, 3.0],
    safeAreaIds: ['C1'],
    lastObservationAt: null,
    notes: [],
  },
]

export const DEFAULT_SENSOR_CONFIGS: SensorConfig[] = [
  { key: 'cfg-1', sensorType: 'fmcw_radar', zoneId: 'A', safeAreaId: 'A1' },
  { key: 'cfg-2', sensorType: 'contact_microphone', zoneId: 'B', safeAreaId: 'B1' },
  { key: 'cfg-3', sensorType: 'geophone', zoneId: 'C', safeAreaId: 'C1' },
]

export const REASSESSMENT_ALTERNATIVES: ReassessmentAlternative[] = [
  {
    label: 'C2 · rear service recess',
    state: 'rejected',
    detail: 'Overhead slab instability. Not approved for personnel entry.',
  },
  {
    label: 'C3 · interior corridor edge',
    state: 'rejected',
    detail: 'Access blocked by debris and a leaning wall.',
  },
  {
    label: 'Replacement node RF-04 · available in stores',
    state: 'available',
    detail: 'Hardware is available, but no safe measurement path can reach the zone.',
  },
]

export function sensorMeta(type: SensorType): SensorTypeMeta {
  return SENSOR_TYPES.find((item) => item.id === type) ?? SENSOR_TYPES[0]
}

export function safeAreaForZone(zoneId: ZoneId): SafeArea | undefined {
  return SAFE_AREAS.find((area) => area.zoneId === zoneId && area.state === 'safe')
}

export function zoneById(zoneId: ZoneId): SearchZone {
  return ZONES.find((zone) => zone.id === zoneId) ?? ZONES[0]
}
