export type NavTab = 'simulation' | 'analysis' | 'report' | 'scenarios' | 'rffense'

export type RunStatus = 'running' | 'paused' | 'complete'
export type RunMode = 'ambient' | 'autonomous'

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type ZoneKind = 'primary' | 'search' | 'collapse'
export type SensorKind = 'radar' | 'acoustic' | 'vibration'
export type ViewMode = '3d' | 'plan'
export type SceneTool = 'select' | 'pan' | 'orbit' | 'layers' | 'bounds'
export type FloorFilter = 'all' | 1 | 2 | 3 | 4 | 5
export type Tone = 'info' | 'success' | 'warning' | 'danger'

export interface Zone {
  id: string
  label: string
  kind: ZoneKind
  color: string
  floor: number
  position: [number, number, number]
  size: [number, number, number]
  confidence: number
}

export interface SensorUnit {
  id: string
  kind: SensorKind
  label: string
  position: [number, number, number]
}

export interface Scenario {
  id: string
  name: string
  opId: string
  sector: string
  structure: string
  floors: number
  collapse: string
  temperature: number
  weather: string
  weatherKind: 'clear' | 'cloud' | 'rain' | 'smoke'
  summary: string
  difficulty: 'Moderate' | 'High' | 'Critical'
  seed: number
  estimatedVictims: number
  zones: Zone[]
  sensors: SensorUnit[]
  victim: {
    id: string
    floor: number
    position: [number, number, number]
    zoneId: string
  }
  timeline: string
}

export interface DetectionChannel {
  key: SensorKind
  label: string
  detail: string
  acquired: boolean
  strength: number
}

export interface HistorySample {
  t: number
  radar: number
  acoustic: number
  vibration: number
  confidence: number
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  time: string
  tone: Tone
  read: boolean
}

export interface MissionLocation {
  x: number
  y: number
  z: number
  uncertainty: number
}

export interface SimulationState {
  scenarioId: string
  mode: RunMode
  status: RunStatus
  speed: number
  progress: number
  stage: StageId
  evidence: number
  uncertainty: number
  location: MissionLocation
  channels: Record<SensorKind, boolean>
  sensorHealth: Record<SensorKind, number>
  history: HistorySample[]
  tick: number
  startedAt: number | null
  completedAt: number | null
  notifications: NotificationItem[]
}

export interface StageDefinition {
  id: StageId
  label: string
  short: string
  start: number
  end: number
  detail: string
}

export interface Toast {
  id: number
  title: string
  message?: string
  tone: Tone
}

export interface SavedMission {
  scenarioId: string
  state: SimulationState
  savedAt: number
}
