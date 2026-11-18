import type {
  HistorySample,
  MissionLocation,
  NotificationItem,
  Scenario,
  SensorKind,
  SimulationState,
  StageId,
} from '../types'
import { INITIAL_SNAPSHOT_PROGRESS, STAGES, stageForProgress } from '../data/scenarios'

export const MISSION_SECONDS_AT_100 = 334
const MAX_HISTORY = 84

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)

function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((value) => String(value).padStart(2, '0')).join(':')
}

export function missionClock(state: SimulationState): number {
  return Math.round(state.progress * (MISSION_SECONDS_AT_100 / 100))
}

export function stageWindow(stage: StageId): { start: number; end: number } {
  const definition = STAGES[stage - 1]
  return { start: definition.start, end: definition.end }
}

export function stageProgress(progress: number, stage: StageId): number {
  const { start, end } = stageWindow(stage)
  return clamp((progress - start) / (end - start), 0, 1)
}

export function initialNotifications(): NotificationItem[] {
  return [
    {
      id: 'mission-synced',
      title: 'Mission synced',
      body: 'OP-2025-0417 loaded from command uplink. Autonomous engine standing by.',
      time: '2m ago',
      tone: 'info',
      read: false,
    },
    {
      id: 'mesh-online',
      title: 'Sensor mesh online',
      body: 'Seven telemetry channels reporting nominal signal integrity.',
      time: '4m ago',
      tone: 'success',
      read: false,
    },
    {
      id: 'micro-motion',
      title: 'Micro-motion detected',
      body: 'Radar array R-03 flagged periodic activity inside Z-03.',
      time: '6m ago',
      tone: 'warning',
      read: false,
    },
  ]
}

function makeHistory(
  progress: number,
  evidence: number,
  channels: Record<SensorKind, boolean>,
  seed: number,
): HistorySample[] {
  const samples: HistorySample[] = []
  const count = 64
  const endT = Math.round(progress * (MISSION_SECONDS_AT_100 / 100))
  for (let index = 0; index < count; index += 1) {
    const t = Math.round((endT * index) / Math.max(1, count - 1))
    const wobble = Math.sin(index * 0.22 + seed) * 0.03 + (noise(index + seed) - 0.5) * 0.035
    samples.push({
      t,
      radar: clamp(0.86 + wobble, 0, 1),
      acoustic: channels.acoustic ? clamp(0.63 + wobble * 1.2, 0, 1) : 0.08,
      vibration: channels.vibration ? clamp(0.56 + wobble * 1.4, 0, 1) : 0.07,
      confidence: clamp(evidence / 100 + wobble * 0.4, 0, 1),
    })
  }
  return samples
}

export function createInitialState(scenario: Scenario): SimulationState {
  const channels = { radar: true, acoustic: true, vibration: true }
  return {
    scenarioId: scenario.id,
    mode: 'ambient',
    status: 'running',
    speed: 1,
    progress: INITIAL_SNAPSHOT_PROGRESS,
    stage: stageForProgress(INITIAL_SNAPSHOT_PROGRESS),
    evidence: 92,
    uncertainty: 0.9,
    location: { x: 12.4, y: 6.8, z: 3.2, uncertainty: 0.9 },
    channels,
    sensorHealth: { radar: 0.98, acoustic: 0.94, vibration: 0.91 },
    history: makeHistory(INITIAL_SNAPSHOT_PROGRESS, 92, channels, scenario.seed),
    tick: 0,
    startedAt: null,
    completedAt: null,
    notifications: initialNotifications(),
  }
}

export function createFreshRun(scenario: Scenario, speed: number, now: number): SimulationState {
  return {
    scenarioId: scenario.id,
    mode: 'autonomous',
    status: 'running',
    speed,
    progress: 0,
    stage: 1,
    evidence: 0,
    uncertainty: 4.8,
    location: { x: 16.8, y: 9.4, z: 5.1, uncertainty: 4.8 },
    channels: { radar: false, acoustic: false, vibration: false },
    sensorHealth: { radar: 0.36, acoustic: 0.33, vibration: 0.31 },
    history: [],
    tick: 0,
    startedAt: now,
    completedAt: null,
    notifications: [
      {
        id: `run-${now}`,
        title: 'Autonomous run started',
        body: 'Full mission workflow initiated. Sensor mesh deployment in progress.',
        time: 'just now',
        tone: 'info',
        read: false,
      },
    ],
  }
}

function notify(
  state: SimulationState,
  id: string,
  title: string,
  body: string,
  tone: NotificationItem['tone'],
): NotificationItem[] {
  if (state.notifications.some((item) => item.id === id)) return state.notifications
  return [
    { id, title, body, time: 'just now', tone, read: false },
    ...state.notifications,
  ].slice(0, 8)
}

function pushHistory(state: SimulationState, confidence: number): HistorySample[] {
  const t = Math.round(state.progress * (MISSION_SECONDS_AT_100 / 100))
  const seed = state.tick + 17
  const wobble = (noise(seed) - 0.5) * 0.09 + Math.sin(state.tick * 0.34) * 0.025
  const radarActive = state.progress > 44
  const acousticActive = state.channels.acoustic
  const vibrationActive = state.channels.vibration
  const sample: HistorySample = {
    t,
    radar: clamp((radarActive ? 0.18 + (state.progress / 100) * 0.76 : 0.06) + wobble, 0, 1),
    acoustic: acousticActive ? clamp(0.34 + (state.progress / 100) * 0.54 + wobble * 1.2, 0, 1) : 0.06 + noise(seed + 2) * 0.04,
    vibration: vibrationActive ? clamp(0.28 + (state.progress / 100) * 0.58 + wobble * 1.4, 0, 1) : 0.05 + noise(seed + 4) * 0.04,
    confidence: clamp(confidence + wobble * 0.3, 0, 1),
  }
  return [...state.history, sample].slice(-MAX_HISTORY)
}

function ambientTick(state: SimulationState): SimulationState {
  const tick = state.tick + 1
  const progress = Math.min(71.4, state.progress + 0.0025)
  const evidence = clamp(92 + Math.sin(tick * 0.11) * 0.65 + Math.cos(tick * 0.047) * 0.35, 90, 94)
  const uncertainty = 0.9 + Math.sin(tick * 0.08) * 0.02
  const location: MissionLocation = {
    x: 12.4 + Math.sin(tick * 0.06) * 0.025,
    y: 6.8 + Math.cos(tick * 0.05) * 0.02,
    z: 3.2 + Math.sin(tick * 0.04) * 0.02,
    uncertainty,
  }
  const channels = { radar: true, acoustic: true, vibration: true }
  const next: SimulationState = {
    ...state,
    tick,
    progress,
    stage: stageForProgress(progress),
    evidence,
    uncertainty,
    location,
    channels,
    sensorHealth: {
      radar: clamp(0.98 + Math.sin(tick * 0.05) * 0.005, 0.9, 1),
      acoustic: clamp(0.94 + Math.cos(tick * 0.06) * 0.006, 0.85, 1),
      vibration: clamp(0.91 + Math.sin(tick * 0.07) * 0.007, 0.82, 1),
    },
    history: pushHistory({ ...state, progress, channels, tick }, evidence / 100),
  }
  return next
}

function autonomousTick(state: SimulationState, scenario: Scenario, now: number): SimulationState {
  const tick = state.tick + 1
  const progress = Math.min(100, state.progress + 0.27 * state.speed)
  const stage = stageForProgress(progress)

  const evidence =
    progress < 44
      ? 0
      : progress < 62
        ? easeOutCubic((progress - 44) / 18) * 92
        : progress < 90
          ? 92 + ((progress - 62) / 28) * 5
          : 97 + ((progress - 90) / 10) * 1.2

  const uncertainty =
    progress < 44
      ? 4.8
      : progress < 62
        ? 4.8 - easeOutCubic((progress - 44) / 18) * 3.9
        : progress < 85
          ? 0.9 - ((progress - 62) / 23) * 0.45
          : Math.max(0.28, 0.45 - ((progress - 85) / 15) * 0.17)

  const channels: Record<SensorKind, boolean> = {
    radar: progress >= 48,
    acoustic: progress >= 60,
    vibration: progress >= 71,
  }

  const convergence = easeOutCubic((progress - 36) / 50)
  const location: MissionLocation = {
    x: lerp(16.8, 12.4, convergence) + Math.sin(tick * 0.09) * 0.09 * (1 - progress / 100),
    y: lerp(9.4, 6.8, convergence) + Math.cos(tick * 0.08) * 0.07 * (1 - progress / 100),
    z: lerp(5.1, 3.2, convergence) + Math.sin(tick * 0.07) * 0.06 * (1 - progress / 100),
    uncertainty,
  }

  let next: SimulationState = {
    ...state,
    tick,
    progress,
    stage,
    evidence,
    uncertainty,
    location,
    channels,
    sensorHealth: {
      radar: lerp(state.sensorHealth.radar, 0.99, 0.08),
      acoustic: lerp(state.sensorHealth.acoustic, 0.96, 0.08),
      vibration: lerp(state.sensorHealth.vibration, 0.93, 0.08),
    },
    history: pushHistory({ ...state, progress, channels, tick }, evidence / 100),
  }

  if (stage !== state.stage) {
    if (stage === 2) {
      next = {
        ...next,
        notifications: notify(
          next,
          'stage-2',
          'Floor plan reconstructed',
          'Five-level occupancy model generated from structural survey.',
          'info',
        ),
      }
    } else if (stage === 3) {
      next = {
        ...next,
        notifications: notify(
          next,
          'stage-3',
          'Search zones classified',
          'Three collapse voids prioritised: Z-01 primary, Z-02 search, Z-03 collapse.',
          'info',
        ),
      }
    } else if (stage === 4) {
      next = {
        ...next,
        notifications: notify(
          next,
          'stage-4',
          'Sensor mesh deployed',
          'Radar, acoustic and vibration arrays are now collecting.',
          'success',
        ),
      }
    } else if (stage === 6) {
      next = {
        ...next,
        notifications: notify(
          next,
          'stage-6',
          'Signal fusion running',
          'Cross-channel noise rejection engaged across seven telemetry feeds.',
          'info',
        ),
      }
    } else if (stage === 7) {
      next = {
        ...next,
        notifications: notify(
          next,
          'stage-7',
          'Survivor localised',
          `${scenario.victim.id} triangulated in ${scenario.victim.zoneId} at floor ${scenario.victim.floor}.`,
          'warning',
        ),
      }
    } else if (stage === 8) {
      next = {
        ...next,
        notifications: notify(
          next,
          'stage-8',
          'Rescue team dispatched',
          'Viable contact confirmed. Extraction route assigned to Rescue Team Alpha.',
          'success',
        ),
      }
    }
  }

  if (progress >= 100) {
    next = {
      ...next,
      status: 'complete',
      stage: 8,
      progress: 100,
      evidence: 98.6,
      uncertainty: 0.26,
      location: { x: 12.4, y: 6.8, z: 3.2, uncertainty: 0.26 },
      channels: { radar: true, acoustic: true, vibration: true },
      completedAt: now,
      notifications: notify(
        next,
        'rescue-confirmed',
        'Rescue confirmed',
        `${scenario.victim.id} located and handed off. Mission complete.`,
        'success',
      ),
    }
  }

  return next
}

export function tick(state: SimulationState, scenario: Scenario, now: number): SimulationState {
  if (state.status !== 'running') return state
  return state.mode === 'ambient' ? ambientTick(state) : autonomousTick(state, scenario, now)
}
