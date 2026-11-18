import type {
  GatewayCheck,
  ObservationType,
  Reassessment,
  RfAlert,
  RfEvent,
  RfReport,
  RfAction,
  RfSceneId,
  RfState,
  SensorConfig,
  SensorNode,
  SensorObservation,
  SignalQuality,
  ZoneId,
  ZoneStatus,
} from './types'
import {
  DEFAULT_SENSOR_CONFIGS,
  INCIDENT_ADDRESS,
  INCIDENT_ID,
  INCIDENT_NAME,
  REASSESSMENT_ALTERNATIVES,
  SAFE_AREA_BY_ID,
  SCENES,
  ZONES,
  completedSafetyChecks,
  initialSafetyChecks,
  safeAreaForZone,
  sensorMeta,
  zoneById,
} from './data'

const pad = (value: number, length = 2) => String(value).padStart(length, '0')

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${pad(minutes)}:${pad(seconds)}`
}

export function formatMissionClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function missionTime(state: RfState, at: number): number {
  return Math.max(0, at - state.incident.startedAt)
}

interface ZoneOutcome {
  type: ObservationType
  description: string
  quality: SignalQuality
}

const PRE_PROGRAMMED: Record<ZoneId, ZoneOutcome> = {
  A: {
    type: 'possible_survivor',
    description:
      'Low-amplitude periodic micro-motion candidate recorded near the south-east void. Pre-programmed illustrative reading; this is not a confirmed survivor and has not been validated against real hardware.',
    quality: 'good',
  },
  B: {
    type: 'needs_verification',
    description:
      'Intermittent knocking-like pattern recorded at the west wing. Pre-programmed illustrative reading; the source is ambiguous and does not identify a person.',
    quality: 'fair',
  },
  C: {
    type: 'communication_error',
    description:
      'Communication error: the node delivered an error frame but no measurement payload. No observation can be made for this zone.',
    quality: 'unknown',
  },
}

function cloneState(state: RfState): RfState {
  return {
    ...state,
    incident: { ...state.incident },
    safety: {
      ...state.safety,
      checks: state.safety.checks.map((check) => ({ ...check })),
      areas: state.safety.areas.map((area) => ({ ...area })),
    },
    zones: state.zones.map((zone) => ({
      ...zone,
      notes: [...zone.notes],
      safeAreaIds: [...zone.safeAreaIds],
    })),
    sensorConfigs: state.sensorConfigs.map((config) => ({ ...config })),
    nodes: state.nodes.map((node) => ({ ...node })),
    gateway: { ...state.gateway },
    scanning: { ...state.scanning },
    observations: [...state.observations],
    events: [...state.events],
    alerts: [...state.alerts],
    reassessments: state.reassessments.map((item) => ({
      ...item,
      alternatives: item.alternatives.map((alternative) => ({ ...alternative })),
    })),
    verifications: [...state.verifications],
    failureNodes: [...state.failureNodes],
  }
}

function addEvent(
  draft: RfState,
  event: Omit<RfEvent, 'id' | 'at'> & { at: number },
): void {
  draft.nextEventSequence += 1
  draft.events.push({ ...event, id: `EVT-${pad(draft.nextEventSequence, 3)}` })
}

function addAlert(
  draft: RfState,
  alert: Omit<RfAlert, 'id' | 'at'> & { at: number },
): void {
  draft.nextAlertSequence += 1
  draft.alerts.push({ ...alert, id: `ALT-${pad(draft.nextAlertSequence, 3)}` })
}

function noteZone(draft: RfState, zoneId: ZoneId, note: string): void {
  const zone = draft.zones.find((item) => item.id === zoneId)
  if (!zone) return
  if (!zone.notes.includes(note)) zone.notes.push(note)
}

function setZoneStatus(draft: RfState, zoneId: ZoneId, status: ZoneStatus): void {
  const zone = draft.zones.find((item) => item.id === zoneId)
  if (zone) zone.status = status
}

function gatewayChecks(type: ObservationType, node: SensorNode): GatewayCheck[] {
  if (type === 'communication_error') {
    return [
      { key: 'node', label: 'Node identity', result: 'pass', detail: `${node.id} present in the routing header.` },
      { key: 'zone', label: 'Zone configuration', result: 'pass', detail: `Zone ${node.zoneId} matches the deployed configuration.` },
      { key: 'timestamp', label: 'Timestamp', result: 'fail', detail: 'No timestamp field was included in the payload.' },
      { key: 'health', label: 'Node health', result: 'warning', detail: 'Node reported degraded status before the link dropped.' },
      { key: 'signal', label: 'Signal quality', result: 'fail', detail: 'No signal-quality value was received.' },
      { key: 'duplicate', label: 'Duplicate check', result: 'pass', detail: 'No duplicate message detected.' },
    ]
  }
  const qualityCheck: GatewayCheck =
    node.signalQuality === 'fair'
      ? { key: 'signal', label: 'Signal quality', result: 'warning', detail: 'Link quality reported as fair; observation retained with a caveat.' }
      : { key: 'signal', label: 'Signal quality', result: 'pass', detail: 'Signal-quality value present and within the expected band.' }
  return [
    { key: 'node', label: 'Node identity', result: 'pass', detail: `${node.id} present in the routing header.` },
    { key: 'zone', label: 'Zone configuration', result: 'pass', detail: `Zone ${node.zoneId} matches the deployed configuration.` },
    { key: 'timestamp', label: 'Timestamp', result: 'pass', detail: 'Timestamp present and ordered against the collection window.' },
    { key: 'health', label: 'Node health', result: 'pass', detail: `Node health reported as ${node.health}.` },
    qualityCheck,
    { key: 'duplicate', label: 'Duplicate check', result: 'pass', detail: 'No duplicate message detected.' },
  ]
}

function createObservation(draft: RfState, node: SensorNode, now: number): SensorObservation {
  const outcome = PRE_PROGRAMMED[node.zoneId]
  const accepted = outcome.type !== 'communication_error'
  draft.nextObservationSequence += 1
  const observation: SensorObservation = {
    id: `OBS-${pad(draft.nextObservationSequence, 3)}`,
    sensorId: node.id,
    zoneId: node.zoneId,
    timestamp: now,
    observationType: outcome.type,
    observationDescription: outcome.description,
    signalQuality: outcome.quality,
    sensorHealth: outcome.type === 'communication_error' ? 'degraded' : 'nominal',
    connectionStatus: outcome.type === 'communication_error' ? 'intermittent' : 'connected',
    batteryStatus: null,
    illustrative: true,
    accepted,
    gatewayChecks: gatewayChecks(outcome.type, node),
  }
  draft.observations.push(observation)
  draft.gateway.messagesReceived += 1
  draft.gateway.lastMessageAt = now
  if (accepted) {
    draft.gateway.lastMessage = `${node.id} · ${outcome.type} observation accepted for Zone ${node.zoneId}.`
    const zone = draft.zones.find((item) => item.id === node.zoneId)
    if (zone) {
      zone.lastObservationAt = now
      if (outcome.type === 'possible_survivor') zone.status = 'possible_survivor'
      if (outcome.type === 'needs_verification') zone.status = 'needs_verification'
      if (outcome.type === 'no_candidate' && (zone.status === 'not_checked' || zone.status === 'checked')) {
        zone.status = 'checked'
      }
    }
    node.lastSeenAt = now
    node.signalQuality = outcome.quality
    if (node.zoneId === 'B') {
      node.health = 'degraded'
      node.connection = 'connected'
    }
    if (outcome.type === 'possible_survivor') {
      noteZone(
        draft,
        node.zoneId,
        `Pre-programmed candidate observation received from ${node.id}. This is not a confirmed survivor; independent human verification is required.`,
      )
    } else if (outcome.type === 'needs_verification') {
      noteZone(
        draft,
        node.zoneId,
        `Ambiguous pattern received from ${node.id}. It does not identify a person and requires independent human verification.`,
      )
    } else {
      noteZone(draft, node.zoneId, `Rescan from ${node.id} found no additional candidate signal. Prior observations remain on record.`)
    }
  } else {
    draft.gateway.droppedMessages += 1
    draft.gateway.lastMessage = `${node.id} · payload rejected: no measurement data.`
    node.health = 'degraded'
    node.connection = 'intermittent'
    node.signalQuality = 'poor'
    node.lastSeenAt = now
    setZoneStatus(draft, node.zoneId, 'unverified')
    noteZone(
      draft,
      node.zoneId,
      `${node.id} returned no measurement payload. The zone is Unverified; this is not evidence that the area is empty.`,
    )
  }
  return observation
}

function pendingScanNodes(draft: RfState): SensorNode[] {
  const startedAt = draft.scanning.startedAt
  if (startedAt === null) return []
  return draft.nodes
    .filter((node) => node.health !== 'offline')
    .filter(
      (node) =>
        !draft.observations.some(
          (observation) => observation.sensorId === node.id && observation.timestamp >= startedAt,
        ),
    )
    .sort((a, b) => a.sequence - b.sequence)
}

function completeScan(draft: RfState, now: number): void {
  draft.scanning.completedAt = now
  draft.scanning.activeNodeId = null
  const startedAt = draft.scanning.startedAt ?? 0
  const scanObservations = draft.observations.filter((observation) => observation.timestamp >= startedAt)
  const accepted = scanObservations.filter((observation) => observation.accepted).length
  const errors = scanObservations.filter((observation) => !observation.accepted).length
  const unverified = draft.zones.filter((zone) => zone.status === 'unverified').length
  addEvent(draft, {
    at: now,
    type: 'observation',
    title: 'Initial scan complete',
    detail: `${accepted} accepted observation${accepted === 1 ? '' : 's'} · ${errors} communication error${errors === 1 ? '' : 's'} · ${unverified} zone${unverified === 1 ? '' : 's'} unverified. A failed sensor is never treated as an empty zone.`,
    tone: errors > 0 ? 'warning' : 'success',
  })
}

function buildNode(config: SensorConfig, sequence: number, now: number): SensorNode | null {
  const area = SAFE_AREA_BY_ID[config.safeAreaId]
  if (!area || area.state !== 'safe' || area.zoneId !== config.zoneId) return null
  const offset = ((sequence - 1) % 3) * 0.34
  return {
    id: `RF-${pad(sequence)}`,
    sequence,
    sensorType: config.sensorType,
    zoneId: area.zoneId,
    safeAreaId: area.id,
    position: [area.position[0] + offset, 0.55, area.position[2] + offset * 0.6],
    health: 'nominal',
    connection: 'connecting',
    signalQuality: 'unknown',
    batteryStatus: null,
    registeredAt: now,
    lastSeenAt: null,
    failureAt: null,
  }
}

export function createInitialState(now = 0): RfState {
  return {
    incident: {
      id: INCIDENT_ID,
      name: INCIDENT_NAME,
      address: INCIDENT_ADDRESS,
      structure: 'Five-storey reinforced concrete residential building',
      floors: 5,
      startedAt: now,
      earthquakeAt: null,
      collapseAt: null,
      collapseCompleteAt: null,
      rescueArrivalAt: null,
    },
    safety: {
      startedAt: null,
      completedAt: null,
      markedAt: null,
      checks: initialSafetyChecks(),
      areas: Object.values(SAFE_AREA_BY_ID).map((area) => ({ ...area })),
    },
    zones: ZONES.map((zone) => ({ ...zone, notes: [...zone.notes], safeAreaIds: [...zone.safeAreaIds] })),
    zonesConfirmedAt: null,
    sensorConfigs: DEFAULT_SENSOR_CONFIGS.map((config) => ({ ...config })),
    nodes: [],
    deploymentAt: null,
    gateway: {
      online: false,
      checkedAt: null,
      lastMessageAt: null,
      lastMessage: 'Gateway offline. No messages received.',
      messagesReceived: 0,
      droppedMessages: 0,
      zoneConfigReceivedAt: null,
    },
    scanning: {
      startedAt: null,
      completedAt: null,
      activeNodeId: null,
      rescanCount: 0,
    },
    observations: [],
    events: [
      {
        id: 'EVT-001',
        at: now,
        type: 'system',
        title: 'Illustrative simulation initialised',
        detail:
          'All sensor events and readings in this application are pre-programmed examples. They do not demonstrate real radar penetration, validated survivor detection, measured accuracy, or trained machine-learning performance.',
        tone: 'info',
      },
    ],
    alerts: [],
    reassessments: [],
    verifications: [],
    extraction: null,
    failureNodes: [],
    nextNodeSequence: 1,
    nextEventSequence: 1,
    nextObservationSequence: 0,
    nextAlertSequence: 0,
    reportGeneratedAt: null,
  }
}

export function reduce(state: RfState, action: RfAction): RfState {
  switch (action.type) {
    case 'EARTHQUAKE': {
      if (state.incident.earthquakeAt !== null) return state
      const draft = cloneState(state)
      draft.incident.earthquakeAt = action.now
      addEvent(draft, {
        at: action.now,
        type: 'incident',
        title: 'Earthquake registered',
        detail: 'A simulated seismic event is applied to the Riverside Residential Block. This is a staged scenario, not measured seismicity.',
        tone: 'warning',
      })
      return draft
    }
    case 'COLLAPSE_START': {
      if (state.incident.earthquakeAt === null || state.incident.collapseAt !== null) return state
      const draft = cloneState(state)
      draft.incident.collapseAt = action.now
      addEvent(draft, {
        at: action.now,
        type: 'collapse',
        title: 'Progressive collapse initiated',
        detail: 'The east wing and rear corridor are shown losing structural support. Animation is illustrative and not a structural engineering model.',
        tone: 'danger',
      })
      return draft
    }
    case 'COLLAPSE_COMPLETE': {
      if (state.incident.collapseAt === null || state.incident.collapseCompleteAt !== null) return state
      const draft = cloneState(state)
      draft.incident.collapseCompleteAt = action.now
      addEvent(draft, {
        at: action.now,
        type: 'collapse',
        title: 'Collapse sequence complete',
        detail: 'Rubble fields and voids are now present in the simulated scene. Casualty status is unknown.',
        tone: 'danger',
      })
      return draft
    }
    case 'RESCUE_START': {
      if (state.incident.collapseCompleteAt === null || state.incident.rescueArrivalAt !== null) return state
      const draft = cloneState(state)
      draft.incident.rescueArrivalAt = action.now
      addEvent(draft, {
        at: action.now,
        type: 'rescue',
        title: 'Rescue team arrival',
        detail: 'Rescue personnel and vehicles arrive at the perimeter. Operations cannot begin until the safety assessment is complete.',
        tone: 'info',
      })
      return draft
    }
    case 'SAFETY_COMPLETE': {
      if (state.incident.rescueArrivalAt === null || state.safety.completedAt !== null) return state
      const draft = cloneState(state)
      draft.safety.startedAt = action.now
      draft.safety.completedAt = action.now
      draft.safety.checks = completedSafetyChecks()
      addEvent(draft, {
        at: action.now,
        type: 'assessment',
        title: 'Safety assessment complete',
        detail: 'Structural, fire, electrical, access and deployment hazards have been reviewed. Approved safe areas must still be marked on the site.',
        tone: 'success',
      })
      return draft
    }
    case 'SAFE_AREA_MARK': {
      if (state.safety.completedAt === null || state.safety.markedAt !== null) return state
      const draft = cloneState(state)
      draft.safety.markedAt = action.now
      const approved = draft.safety.areas.filter((area) => area.state === 'safe').map((area) => area.id)
      const rejected = draft.safety.areas.filter((area) => area.state === 'rejected').length
      addEvent(draft, {
        at: action.now,
        type: 'assessment',
        title: 'Safe deployment areas marked',
        detail: `${approved.join(', ')} approved for controlled access. ${rejected} candidate position${rejected === 1 ? '' : 's'} rejected for instability or blocked access.`,
        tone: 'success',
      })
      return draft
    }
    case 'ZONES_CONFIRM': {
      if (state.safety.markedAt === null || state.zonesConfirmedAt !== null) return state
      const draft = cloneState(state)
      draft.zonesConfirmedAt = action.now
      for (const zone of draft.zones) {
        noteZone(draft, zone.id, 'Search grid confirmed by the rescue team. No measurements have been taken yet.')
      }
      addEvent(draft, {
        at: action.now,
        type: 'zone',
        title: 'Search zones confirmed',
        detail: 'Three example search zones are defined. All zones start as Not Checked until a valid scan is received.',
        tone: 'info',
      })
      return draft
    }
    case 'SET_CONFIG': {
      if (state.deploymentAt !== null) return state
      const draft = cloneState(state)
      draft.sensorConfigs = action.configs.map((config) => ({ ...config }))
      return draft
    }
    case 'DEPLOY': {
      if (state.zonesConfirmedAt === null || state.deploymentAt !== null) return state
      const nodes: SensorNode[] = []
      let sequence = 0
      for (const config of action.configs) {
        sequence += 1
        const node = buildNode(config, sequence, action.now)
        if (node) nodes.push(node)
      }
      if (nodes.length === 0) return state
      const draft = cloneState(state)
      draft.sensorConfigs = action.configs.map((config) => ({ ...config }))
      draft.nodes = nodes
      draft.deploymentAt = action.now
      draft.nextNodeSequence = nodes.length + 1
      addEvent(draft, {
        at: action.now,
        type: 'sensor',
        title: 'Sensor nodes deployed',
        detail: `${nodes.length} illustrative nodes placed at approved safe areas. Battery telemetry is not provided, so battery status is N/A. Nodes are not yet connected to the gateway.`,
        tone: 'success',
      })
      return draft
    }
    case 'GATEWAY_CONNECTED': {
      if (state.deploymentAt === null || state.gateway.online) return state
      const draft = cloneState(state)
      draft.gateway.online = true
      draft.gateway.checkedAt = action.now
      draft.gateway.zoneConfigReceivedAt = action.now
      draft.gateway.lastMessageAt = action.now
      draft.gateway.lastMessage = 'Gateway check passed. Node and zone configuration received.'
      draft.nodes = draft.nodes.map((node) => ({
        ...node,
        connection: 'connected',
        signalQuality: node.sequence === 3 ? 'fair' : 'good',
        lastSeenAt: action.now,
      }))
      addEvent(draft, {
        at: action.now,
        type: 'gateway',
        title: 'Central gateway connected',
        detail: `Node registration, zone configuration, timestamps and duplicate checks passed for ${draft.nodes.length} nodes. This simulates a local communication path only.`,
        tone: 'success',
      })
      return draft
    }
    case 'SCAN_START': {
      if (!state.gateway.online || state.scanning.startedAt !== null) return state
      const draft = cloneState(state)
      draft.scanning.startedAt = action.now
      const pending = pendingScanNodes(draft)
      draft.scanning.activeNodeId = pending[0]?.id ?? null
      if (pending.length === 0) {
        completeScan(draft, action.now)
        return draft
      }
      addEvent(draft, {
        at: action.now,
        type: 'observation',
        title: 'Initial scan started',
        detail: 'The gateway is collecting pre-programmed illustrative observations from every connected node. Each message is validated before it can affect a zone status.',
        tone: 'info',
      })
      return draft
    }
    case 'SCAN_STEP': {
      if (state.scanning.startedAt === null || state.scanning.completedAt !== null) return state
      const draft = cloneState(state)
      const pending = pendingScanNodes(draft)
      const node = pending[0]
      if (!node) {
        completeScan(draft, action.now)
        return draft
      }
      const observation = createObservation(draft, node, action.now)
      addEvent(draft, {
        at: action.now,
        type: 'observation',
        title: observation.accepted
          ? `${node.id} observation accepted`
          : `${node.id} communication error`,
        detail: observation.observationDescription,
        tone: observation.accepted ? 'info' : 'warning',
        zoneId: node.zoneId,
        nodeId: node.id,
        observationId: observation.id,
      })
      if (!observation.accepted) {
        addAlert(draft, {
          at: action.now,
          severity: 'warning',
          title: `Communication error · ${node.id}`,
          message: `Zone ${node.zoneId} received no measurement payload. The zone is Unverified, not empty.`,
          zoneId: node.zoneId,
          nodeId: node.id,
        })
      }
      const remaining = pendingScanNodes(draft)
      if (remaining.length === 0) {
        completeScan(draft, action.now)
      } else {
        draft.scanning.activeNodeId = remaining[0].id
      }
      return draft
    }
    case 'SCAN_COMPLETE': {
      if (state.scanning.startedAt === null || state.scanning.completedAt !== null) return state
      const draft = cloneState(state)
      completeScan(draft, action.now)
      return draft
    }
    case 'SENSOR_FAILURE': {
      if (state.scanning.completedAt === null || state.failureNodes.length > 0) return state
      const target =
        state.nodes.find((node) => node.sequence === 3) ??
        state.nodes.find((node) => node.zoneId === 'C') ??
        state.nodes[state.nodes.length - 1]
      if (!target) return state
      const draft = cloneState(state)
      const node = draft.nodes.find((item) => item.id === target.id)
      if (!node) return state
      node.health = 'offline'
      node.connection = 'disconnected'
      node.signalQuality = 'unknown'
      node.batteryStatus = null
      node.failureAt = action.now
      node.lastSeenAt = action.now
      draft.failureNodes.push(node.id)
      draft.gateway.lastMessageAt = action.now
      draft.gateway.lastMessage = `${node.id} stopped responding. Last known link state: disconnected.`
      setZoneStatus(draft, node.zoneId, 'unverified')
      noteZone(
        draft,
        node.zoneId,
        `${node.id} failed after the initial scan. Coverage is lost and the zone remains Unverified. This is not evidence that the area is empty.`,
      )
      addEvent(draft, {
        at: action.now,
        type: 'failure',
        title: `Sensor failure · ${node.id}`,
        detail: `The node assigned to Zone ${node.zoneId} is offline. Zone ${node.zoneId} cannot be reassessed from this node's data, and the failure is not treated as an empty result.`,
        tone: 'danger',
        zoneId: node.zoneId,
        nodeId: node.id,
      })
      addAlert(draft, {
        at: action.now,
        severity: 'danger',
        title: `Node ${node.id} offline · Zone ${node.zoneId} unverified`,
        message: `The node has stopped reporting. Zone ${node.zoneId} remains Unverified. A failed sensor is not evidence that the area is empty.`,
        zoneId: node.zoneId,
        nodeId: node.id,
      })
      return draft
    }
    case 'REASSESSMENT_COMPLETE': {
      if (state.failureNodes.length === 0 || state.reassessments.length > 0) return state
      const failedNode =
        state.nodes.find((node) => node.id === state.failureNodes[0]) ??
        state.nodes.find((node) => node.sequence === 3)
      if (!failedNode) return state
      const draft = cloneState(state)
      const reassessment: Reassessment = {
        id: `REA-${pad(draft.reassessments.length + 1)}`,
        zoneId: failedNode.zoneId,
        nodeId: failedNode.id,
        at: action.now,
        outcome:
          'Replacement hardware is available, but every alternative measurement position for this zone was rejected. No safe path exists to restore coverage.',
        alternatives: REASSESSMENT_ALTERNATIVES.map((alternative) => ({ ...alternative })),
        replacementAvailable: true,
        coverageRestored: false,
      }
      draft.reassessments.push(reassessment)
      noteZone(
        draft,
        failedNode.zoneId,
        'Reassessment found no safe alternative measurement position. Replacement hardware cannot be deployed, so coverage is not restored.',
      )
      addEvent(draft, {
        at: action.now,
        type: 'reassessment',
        title: `Reassessment · Zone ${failedNode.zoneId}`,
        detail: `C2 and C3 were rejected during the safety assessment. Replacement node RF-04 exists in stores, but no approved measurement path is available. Zone ${failedNode.zoneId} remains Unverified.`,
        tone: 'warning',
        zoneId: failedNode.zoneId,
        nodeId: failedNode.id,
      })
      return draft
    }
    case 'RESCAN_COMPLETE': {
      if (state.scanning.completedAt === null || state.failureNodes.length === 0) return state
      const node = state.nodes.find(
        (item) => item.zoneId === action.zoneId && item.connection !== 'disconnected' && item.health !== 'offline',
      )
      if (!node) return state
      const draft = cloneState(state)
      const liveNode = draft.nodes.find((item) => item.id === node.id)
      if (!liveNode) return state
      const target = draft.zones.find((zone) => zone.id === action.zoneId)
      if (!target) return state
      const previousStatus = target.status
      draft.nextObservationSequence += 1
      const observation: SensorObservation = {
        id: `OBS-${pad(draft.nextObservationSequence, 3)}`,
        sensorId: liveNode.id,
        zoneId: liveNode.zoneId,
        timestamp: action.now,
        observationType: 'no_candidate',
        observationDescription:
          'Rescan completed with no additional candidate signal. Pre-programmed illustrative result. This does not prove the area is empty and does not erase earlier observations.',
        signalQuality: liveNode.signalQuality === 'unknown' ? 'fair' : liveNode.signalQuality,
        sensorHealth: liveNode.health,
        connectionStatus: liveNode.connection,
        batteryStatus: null,
        illustrative: true,
        accepted: true,
        gatewayChecks: gatewayChecks('no_candidate', liveNode),
      }
      draft.observations.push(observation)
      draft.scanning.rescanCount += 1
      draft.gateway.messagesReceived += 1
      draft.gateway.lastMessageAt = action.now
      draft.gateway.lastMessage = `${liveNode.id} · rescan result accepted for Zone ${liveNode.zoneId}.`
      if (previousStatus === 'not_checked' || previousStatus === 'checked') target.status = 'checked'
      target.lastObservationAt = action.now
      liveNode.lastSeenAt = action.now
      noteZone(
        draft,
        liveNode.zoneId,
        `Rescan from ${liveNode.id} found no additional candidate signal. Prior observations remain on record and the zone status is unchanged.`,
      )
      addEvent(draft, {
        at: action.now,
        type: 'observation',
        title: `Rescan complete · Zone ${liveNode.zoneId}`,
        detail: observation.observationDescription,
        tone: 'info',
        zoneId: liveNode.zoneId,
        nodeId: liveNode.id,
        observationId: observation.id,
      })
      return draft
    }
    case 'VERIFY_SURVIVOR': {
      const zone = state.zones.find((item) => item.id === action.zoneId)
      if (!zone) return state
      if (zone.status !== 'possible_survivor' && zone.status !== 'needs_verification') return state
      if (!action.confirmedBy.trim()) return state
      const draft = cloneState(state)
      const candidate = [...draft.observations]
        .reverse()
        .find(
          (observation) =>
            observation.zoneId === action.zoneId &&
            observation.accepted &&
            (observation.observationType === 'possible_survivor' ||
              observation.observationType === 'needs_verification'),
        )
      if (!candidate) return state
      const target = draft.zones.find((item) => item.id === action.zoneId)
      if (!target) return state
      target.status = 'human_verified'
      draft.verifications.push({
        id: `VER-${pad(draft.verifications.length + 1)}`,
        zoneId: action.zoneId,
        observationId: candidate.id,
        method: action.method,
        confirmedBy: action.confirmedBy.trim(),
        confirmedAt: action.now,
        independent: true,
      })
      noteZone(
        draft,
        action.zoneId,
        `Independent human verification recorded by ${action.confirmedBy.trim()} using ${action.method}. This confirmation came from personnel, not from the sensor network.`,
      )
      addEvent(draft, {
        at: action.now,
        type: 'verification',
        title: `Human verification · Zone ${action.zoneId}`,
        detail: `${action.confirmedBy.trim()} independently confirmed the candidate using ${action.method}. The status reflects human confirmation, not a sensor-only conclusion.`,
        tone: 'success',
        zoneId: action.zoneId,
        observationId: candidate.id,
      })
      return draft
    }
    case 'EXTRACTION_COMPLETE': {
      if (state.verifications.length === 0 || state.extraction !== null) return state
      const verification = state.verifications[state.verifications.length - 1]
      const draft = cloneState(state)
      draft.extraction = {
        id: `EXT-${pad(1)}`,
        zoneId: verification.zoneId,
        completedAt: action.now,
        medicalSupport: 'Casualty collection point notified. Medical handover recorded for simulation purposes.',
        transportStatus: 'Transport logged as dispatched. No medical outcome is claimed by this simulation.',
        status: 'completed',
      }
      noteZone(
        draft,
        verification.zoneId,
        'Extraction sequence completed in the simulation. Medical and transport details are illustrative and do not represent real clinical outcomes.',
      )
      addEvent(draft, {
        at: action.now,
        type: 'extraction',
        title: `Extraction complete · Zone ${verification.zoneId}`,
        detail: 'The demonstrated rescue sequence is complete for the verified zone. This is a simulated workflow record, not evidence of a real rescue.',
        tone: 'success',
        zoneId: verification.zoneId,
      })
      addEvent(draft, {
        at: action.now,
        type: 'system',
        title: 'Search operation still in progress',
        detail: 'The demonstrated rescue is complete, but at least one zone remains unresolved. The overall search operation is not marked complete.',
        tone: 'warning',
      })
      return draft
    }
    case 'REPORT_GENERATED': {
      if (state.extraction === null || state.reportGeneratedAt !== null) return state
      const draft = cloneState(state)
      draft.reportGeneratedAt = action.now
      addEvent(draft, {
        at: action.now,
        type: 'report',
        title: 'Final search report generated',
        detail: 'All report figures are derived from the simulation ledger. Unresolved zones remain visible in the report.',
        tone: 'info',
      })
      return draft
    }
    case 'RESTART': {
      return createInitialState(action.now)
    }
    default:
      return state
  }
}

export function deriveScene(state: RfState): RfSceneId {
  if (state.incident.earthquakeAt === null) return 1
  if (state.incident.collapseCompleteAt === null || state.incident.rescueArrivalAt === null) return 2
  if (state.safety.markedAt === null) return 3
  if (state.zonesConfirmedAt === null) return 4
  if (state.deploymentAt === null) return 5
  if (!state.gateway.online || state.scanning.startedAt === null) return 6
  if (state.scanning.completedAt === null) return 7
  if (state.failureNodes.length === 0) return 8
  if (state.reassessments.length === 0) return 9
  if (state.verifications.length === 0) return 10
  if (state.extraction === null) return 11
  return 12
}

export function sceneMeta(scene: RfSceneId) {
  return SCENES[scene - 1]
}

export function derivePhase(state: RfState): string {
  switch (deriveScene(state)) {
    case 1:
      return 'Normal operations'
    case 2:
      return 'Collapse response'
    case 3:
      return 'Safety assessment'
    case 4:
      return 'Search planning'
    case 5:
      return 'Sensor deployment'
    case 6:
      return 'Gateway checks'
    case 7:
      return 'Scanning'
    case 8:
      return 'Initial assessment'
    case 9:
      return 'Sensor failure'
    case 10:
      return 'Verification'
    case 11:
      return 'Extraction'
    default:
      return 'Reporting'
  }
}

export function sceneProgress(scene: RfSceneId): number {
  return Math.round(((scene - 1) / 11) * 100)
}

export function activeFailureNode(state: RfState): SensorNode | null {
  const id = state.failureNodes[0]
  if (!id) return null
  return state.nodes.find((node) => node.id === id) ?? null
}

export function connectedNodeForZone(state: RfState, zoneId: ZoneId): SensorNode | null {
  return (
    state.nodes.find(
      (node) => node.zoneId === zoneId && node.connection !== 'disconnected' && node.health !== 'offline',
    ) ?? null
  )
}

export function latestObservationForZone(state: RfState, zoneId: ZoneId): SensorObservation | null {
  const observations = state.observations.filter((observation) => observation.zoneId === zoneId)
  return observations.length > 0 ? observations[observations.length - 1] : null
}

/**
 * Returns the most recent accepted candidate observation for a zone.
 * A rescan that produced "no additional candidate" must never be presented
 * as the candidate a human verified; the earlier candidate stays on record.
 */
export function latestCandidateObservationForZone(
  state: RfState,
  zoneId: ZoneId,
): SensorObservation | null {
  const candidates = state.observations.filter(
    (observation) =>
      observation.zoneId === zoneId &&
      observation.accepted &&
      (observation.observationType === 'possible_survivor' ||
        observation.observationType === 'needs_verification'),
  )
  return candidates.length > 0 ? candidates[candidates.length - 1] : null
}


export function unresolvedZones(state: RfState) {
  return state.zones.filter((zone) =>
    ['not_checked', 'possible_survivor', 'needs_verification', 'unverified'].includes(zone.status),
  )
}

export function getReport(state: RfState): RfReport {
  const accepted = state.observations.filter((observation) => observation.accepted)
  const candidateObservations = accepted.filter(
    (observation) =>
      observation.observationType === 'possible_survivor' ||
      observation.observationType === 'needs_verification',
  )
  const candidateZones = new Set(candidateObservations.map((observation) => observation.zoneId))
  const validZoneSet = new Set(accepted.map((observation) => observation.zoneId))
  const unresolved = unresolvedZones(state)
  const offline = state.nodes.filter((node) => node.health === 'offline').length
  const disconnected = state.nodes.filter((node) => node.connection === 'disconnected').length
  const latestObservation = state.observations.reduce<number | null>(
    (latest, observation) =>
      latest === null || observation.timestamp > latest ? observation.timestamp : latest,
    null,
  )
  const operationStatus: RfReport['operationStatus'] =
    state.extraction !== null && unresolved.length === 0 ? 'Completed' : 'In Progress'
  const demonstratedRescueStatus: RfReport['demonstratedRescueStatus'] =
    state.extraction !== null ? 'Completed' : state.verifications.length > 0 ? 'In Progress' : 'Not started'

  return {
    totalZones: state.zones.length,
    validScanZones: validZoneSet.size,
    candidateSignalZones: candidateZones.size,
    candidateObservationCount: candidateObservations.length,
    unverifiedZones: state.zones.filter((zone) => zone.status === 'unverified').length,
    sensorFailures: offline,
    humanVerifiedSurvivors: state.verifications.length,
    extractionCompleted: state.extraction !== null,
    operationStatus,
    demonstratedRescueStatus,
    unresolvedZones: unresolved,
    activeNodes: state.nodes.filter((node) => node.health !== 'offline').length,
    disconnectedNodes: disconnected,
    latestObservationAt: latestObservation,
    latestGatewayContactAt: state.gateway.lastMessageAt,
  }
}

export function zoneStatusDetail(status: ZoneStatus): string {
  switch (status) {
    case 'not_checked':
      return 'No valid scan completed.'
    case 'checked':
      return 'Scanned; no candidate signal. Not proof the area is empty.'
    case 'possible_survivor':
      return 'Candidate only; independent human verification required.'
    case 'needs_verification':
      return 'Ambiguous evidence; independent human verification required.'
    case 'unverified':
      return 'No reliable coverage; the area is not confirmed empty.'
    case 'human_verified':
      return 'Independently confirmed by rescue personnel.'
    default:
      return ''
  }
}

export function zonePrimarySensor(state: RfState, zoneId: ZoneId): SensorNode | null {
  return state.nodes.find((node) => node.zoneId === zoneId) ?? null
}

export function safeAreaSummary(): string {
  return Object.values(SAFE_AREA_BY_ID)
    .filter((area) => area.state === 'safe')
    .map((area) => area.id)
    .join(' · ')
}

export function recommendedSafeArea(zoneId: ZoneId): string {
  return safeAreaForZone(zoneId)?.id ?? '—'
}

export function sensorLabel(type: SensorConfig['sensorType']): string {
  return sensorMeta(type).label
}

export function zoneLabel(zoneId: ZoneId): string {
  return zoneById(zoneId).label
}
