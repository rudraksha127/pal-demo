export type RfSceneId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export type RfTab = 'operation' | 'dashboard' | 'building_lab' | 'report' | 'about'

export type ZoneId = 'A' | 'B' | 'C'
export type ZoneStatus =
  | 'not_checked'
  | 'checked'
  | 'possible_survivor'
  | 'needs_verification'
  | 'unverified'
  | 'human_verified'

export type SensorType =
  | 'fmcw_radar'
  | 'geophone'
  | 'contact_microphone'
  | 'thermal_camera'
  | 'borescope'

export type SensorRole = 'primary' | 'supporting' | 'inspection'
export type NodeHealth = 'nominal' | 'degraded' | 'offline'
export type NodeConnection = 'connecting' | 'connected' | 'intermittent' | 'disconnected'
export type SignalQuality = 'good' | 'fair' | 'poor' | 'unknown'
export type ObservationType =
  | 'possible_survivor'
  | 'needs_verification'
  | 'no_candidate'
  | 'communication_error'

export type RfTone = 'info' | 'success' | 'warning' | 'danger'
export type RfEventType =
  | 'incident'
  | 'collapse'
  | 'rescue'
  | 'assessment'
  | 'zone'
  | 'sensor'
  | 'gateway'
  | 'observation'
  | 'failure'
  | 'reassessment'
  | 'verification'
  | 'extraction'
  | 'system'
  | 'report'

export type SafetyCheckState = 'pending' | 'clear' | 'controlled' | 'hazard'
export type SafeAreaState = 'safe' | 'rejected'

export interface SafetyCheck {
  id: string
  label: string
  detail: string
  result: string
  state: SafetyCheckState
}

export interface SafeArea {
  id: string
  label: string
  zoneId: ZoneId
  position: [number, number, number]
  state: SafeAreaState
  note: string
}

export interface SearchZone {
  id: ZoneId
  label: string
  name: string
  status: ZoneStatus
  center: [number, number, number]
  size: [number, number, number]
  safeAreaIds: string[]
  lastObservationAt: number | null
  notes: string[]
}

export interface SensorTypeMeta {
  id: SensorType
  label: string
  short: string
  role: SensorRole
  purpose: string
  limitation: string
  defaultZone: ZoneId
  defaultSafeArea: string
}

export interface SensorConfig {
  key: string
  sensorType: SensorType
  zoneId: ZoneId
  safeAreaId: string
}

export interface SensorNode {
  id: string
  sequence: number
  sensorType: SensorType
  zoneId: ZoneId
  safeAreaId: string
  position: [number, number, number]
  health: NodeHealth
  connection: NodeConnection
  signalQuality: SignalQuality
  batteryStatus: number | null
  registeredAt: number
  lastSeenAt: number | null
  failureAt: number | null
}

export type GatewayCheckKey = 'node' | 'zone' | 'timestamp' | 'health' | 'signal' | 'duplicate'
export type GatewayCheckResult = 'pass' | 'fail' | 'warning'

export interface GatewayCheck {
  key: GatewayCheckKey
  label: string
  result: GatewayCheckResult
  detail: string
}

export interface SensorObservation {
  id: string
  sensorId: string
  zoneId: ZoneId
  timestamp: number
  observationType: ObservationType
  observationDescription: string
  signalQuality: SignalQuality
  sensorHealth: NodeHealth
  connectionStatus: NodeConnection
  batteryStatus: number | null
  illustrative: true
  accepted: boolean
  gatewayChecks: GatewayCheck[]
}

export interface RfEvent {
  id: string
  at: number
  type: RfEventType
  title: string
  detail: string
  tone: RfTone
  zoneId?: ZoneId
  nodeId?: string
  observationId?: string
}

export interface RfAlert {
  id: string
  severity: 'warning' | 'danger'
  title: string
  message: string
  at: number
  zoneId?: ZoneId
  nodeId?: string
}

export interface ReassessmentAlternative {
  label: string
  state: 'available' | 'rejected'
  detail: string
}

export interface Reassessment {
  id: string
  zoneId: ZoneId
  nodeId: string
  at: number
  outcome: string
  alternatives: ReassessmentAlternative[]
  replacementAvailable: boolean
  coverageRestored: boolean
}

export interface RescueVerification {
  id: string
  zoneId: ZoneId
  observationId: string
  method: string
  confirmedBy: string
  confirmedAt: number
  independent: true
}

export interface ExtractionRecord {
  id: string
  zoneId: ZoneId
  completedAt: number
  medicalSupport: string
  transportStatus: string
  status: 'completed'
}

export interface Incident {
  id: string
  name: string
  address: string
  structure: string
  floors: number
  startedAt: number
  earthquakeAt: number | null
  collapseAt: number | null
  collapseCompleteAt: number | null
  rescueArrivalAt: number | null
}

export interface SafetyAssessment {
  startedAt: number | null
  completedAt: number | null
  markedAt: number | null
  checks: SafetyCheck[]
  areas: SafeArea[]
}

export interface GatewayState {
  online: boolean
  checkedAt: number | null
  lastMessageAt: number | null
  lastMessage: string
  messagesReceived: number
  droppedMessages: number
  zoneConfigReceivedAt: number | null
}

export interface ScanningState {
  startedAt: number | null
  completedAt: number | null
  activeNodeId: string | null
  rescanCount: number
}

export interface RfReport {
  totalZones: number
  validScanZones: number
  candidateSignalZones: number
  candidateObservationCount: number
  unverifiedZones: number
  sensorFailures: number
  humanVerifiedSurvivors: number
  extractionCompleted: boolean
  operationStatus: 'In Progress' | 'Completed'
  demonstratedRescueStatus: 'Not started' | 'In Progress' | 'Completed'
  unresolvedZones: SearchZone[]
  activeNodes: number
  disconnectedNodes: number
  latestObservationAt: number | null
  latestGatewayContactAt: number | null
}

export interface RfState {
  incident: Incident
  safety: SafetyAssessment
  zones: SearchZone[]
  zonesConfirmedAt: number | null
  sensorConfigs: SensorConfig[]
  nodes: SensorNode[]
  deploymentAt: number | null
  gateway: GatewayState
  scanning: ScanningState
  observations: SensorObservation[]
  events: RfEvent[]
  alerts: RfAlert[]
  reassessments: Reassessment[]
  verifications: RescueVerification[]
  extraction: ExtractionRecord | null
  failureNodes: string[]
  nextNodeSequence: number
  nextEventSequence: number
  nextObservationSequence: number
  nextAlertSequence: number
  reportGeneratedAt: number | null
}

export type RfAction =
  | { type: 'EARTHQUAKE'; now: number }
  | { type: 'COLLAPSE_START'; now: number }
  | { type: 'COLLAPSE_COMPLETE'; now: number }
  | { type: 'RESCUE_START'; now: number }
  | { type: 'SAFETY_COMPLETE'; now: number }
  | { type: 'SAFE_AREA_MARK'; now: number }
  | { type: 'ZONES_CONFIRM'; now: number }
  | { type: 'DEPLOY'; configs: SensorConfig[]; now: number }
  | { type: 'GATEWAY_CONNECTED'; now: number }
  | { type: 'SCAN_START'; now: number }
  | { type: 'SCAN_STEP'; now: number }
  | { type: 'SCAN_COMPLETE'; now: number }
  | { type: 'SENSOR_FAILURE'; now: number }
  | { type: 'REASSESSMENT_COMPLETE'; now: number }
  | { type: 'RESCAN_COMPLETE'; zoneId: ZoneId; now: number }
  | { type: 'VERIFY_SURVIVOR'; zoneId: ZoneId; method: string; confirmedBy: string; now: number }
  | { type: 'EXTRACTION_COMPLETE'; now: number }
  | { type: 'REPORT_GENERATED'; now: number }
  | { type: 'SET_CONFIG'; configs: SensorConfig[] }
  | { type: 'RESTART'; now: number }
