import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  RfAction,
  RfReport,
  RfSceneId,
  RfState,
  RfTab,
  RfTone,
  SensorType,
  ZoneId,
} from './types'
import {
  connectedNodeForZone,
  createInitialState,
  derivePhase,
  deriveScene,
  getReport,
  missionTime,
  reduce,
} from './engine'

export interface RfToast {
  id: number
  title: string
  message?: string
  tone: RfTone
}

export interface BusyState {
  key: string
  label: string
}

interface RfFenseContextValue {
  state: RfState
  scene: RfSceneId
  phase: string
  report: RfReport
  tab: RfTab
  busy: BusyState | null
  selectedZone: ZoneId | null
  selectedNode: string | null
  reviewObservationId: string | null
  verifyZone: ZoneId | null
  toasts: RfToast[]
  elapsed: number
  setTab: (tab: RfTab) => void
  selectZone: (zoneId: ZoneId | null) => void
  selectNode: (nodeId: string | null) => void
  openObservation: (observationId: string | null) => void
  openVerification: (zoneId: ZoneId) => void
  closeVerification: () => void
  confirmVerification: (method: string, name: string) => void
  dismissToast: (id: number) => void
  triggerEarthquake: () => void
  runSafetyAssessment: () => void
  markSafeAreas: () => void
  confirmZones: () => void
  setSensorType: (configKey: string, sensorType: SensorType) => void
  deploySensors: () => void
  connectGateway: () => void
  startScan: () => void
  simulateSensorFailure: () => void
  reassessCoverage: () => void
  rescanZone: (zoneId: ZoneId) => void
  completeExtraction: () => void
  generateReport: () => void
  restartSimulation: () => void
  now: () => number
}

const RfFenseContext = createContext<RfFenseContextValue | null>(null)

export function RfFenseProvider({ children }: { children: ReactNode }) {
  const startRef = useRef(Date.now())
  const now = useCallback(() => Date.now() - startRef.current, [])
  const [state, dispatch] = useReducer(reduce, 0, createInitialState)
  const [tab, setTabState] = useState<RfTab>('operation')
  const [busy, setBusy] = useState<BusyState | null>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [reviewObservationId, setReviewObservationId] = useState<string | null>(null)
  const [verifyZone, setVerifyZone] = useState<ZoneId | null>(null)
  const [toasts, setToasts] = useState<RfToast[]>([])
  const [elapsed, setElapsed] = useState(0)

  const timersRef = useRef<Set<number>>(new Set())
  const lockRef = useRef<string | null>(null)
  const generationRef = useRef(0)
  const toastIdRef = useRef(0)

  const scene = deriveScene(state)
  const phase = derivePhase(state)
  const report = useMemo(() => getReport(state), [state])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed(missionTime(state, now()))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [state, now])

  useEffect(() => {
    return () => {
      generationRef.current += 1
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (title: string, message: string | undefined, tone: RfTone) => {
      toastIdRef.current += 1
      const id = toastIdRef.current
      const generation = generationRef.current
      setToasts((current) => [...current.slice(-3), { id, title, message, tone }])
      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer)
        if (generation !== generationRef.current) return
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, 6500)
      timersRef.current.add(timer)
    },
    [],
  )

  const schedule = useCallback(
    (callback: () => void, delay: number) => {
      const generation = generationRef.current
      const timer = window.setTimeout(() => {
        timersRef.current.delete(timer)
        if (generation !== generationRef.current) return
        callback()
      }, delay)
      timersRef.current.add(timer)
    },
    [],
  )

  const runAsync = useCallback(
    (
      key: string,
      label: string,
      delay: number,
      action: () => RfAction,
      success?: { title: string; message: string; tone: RfTone },
    ) => {
      if (lockRef.current) return
      lockRef.current = key
      setBusy({ key, label })
      schedule(() => {
        dispatch(action())
        lockRef.current = null
        setBusy(null)
        if (success) pushToast(success.title, success.message, success.tone)
      }, delay)
    },
    [pushToast, schedule],
  )

  const setTab = useCallback((next: RfTab) => setTabState(next), [])

  const triggerEarthquake = useCallback(() => {
    if (lockRef.current) return
    lockRef.current = 'earthquake'
    setBusy({ key: 'earthquake', label: 'Running earthquake and collapse sequence' })
    dispatch({ type: 'EARTHQUAKE', now: now() })
    schedule(() => dispatch({ type: 'COLLAPSE_START', now: now() }), 1300)
    schedule(() => dispatch({ type: 'COLLAPSE_COMPLETE', now: now() }), 3000)
    schedule(() => {
      dispatch({ type: 'RESCUE_START', now: now() })
      lockRef.current = null
      setBusy(null)
      pushToast('Collapse sequence complete', 'Rescue team has arrived. Complete the safety assessment before deploying sensors.', 'warning')
    }, 4300)
  }, [now, pushToast, schedule])

  const runSafetyAssessment = useCallback(() => {
    runAsync(
      'safety',
      'Assessing structural, fire and access hazards',
      1800,
      () => ({ type: 'SAFETY_COMPLETE', now: now() }),
      {
        title: 'Safety assessment complete',
        message: 'Approved safe areas still need to be marked before zone creation.',
        tone: 'success',
      },
    )
  }, [now, runAsync])

  const markSafeAreas = useCallback(() => {
    runAsync('safe-areas', 'Marking approved and rejected deployment areas', 1000, () => ({
      type: 'SAFE_AREA_MARK',
      now: now(),
    }), {
      title: 'Safe areas marked',
      message: 'A1, B1 and C1 approved. C2 and C3 rejected for instability and blocked access.',
      tone: 'success',
    })
  }, [now, runAsync])

  const confirmZones = useCallback(() => {
    runAsync('zones', 'Confirming three search zones', 850, () => ({ type: 'ZONES_CONFIRM', now: now() }), {
      title: 'Search zones confirmed',
      message: 'Zone A, Zone B and Zone C are defined. No measurements have been taken yet.',
      tone: 'info',
    })
  }, [now, runAsync])

  const setSensorType = useCallback(
    (configKey: string, sensorType: SensorType) => {
      dispatch({
        type: 'SET_CONFIG',
        configs: state.sensorConfigs.map((config) =>
          config.key === configKey ? { ...config, sensorType } : config,
        ),
      })
    },
    [state.sensorConfigs],
  )

  const deploySensors = useCallback(() => {
    runAsync(
      'deploy',
      'Deploying nodes to approved safe areas',
      1600,
      () => ({ type: 'DEPLOY', configs: state.sensorConfigs, now: now() }),
      {
        title: 'Sensor nodes deployed',
        message: 'Three illustrative nodes registered at A1, B1 and C1. Battery telemetry is not provided (N/A).',
        tone: 'success',
      },
    )
  }, [now, runAsync, state.sensorConfigs])

  const connectGateway = useCallback(() => {
    runAsync(
      'gateway',
      'Checking gateway link, node registration and timestamps',
      1700,
      () => ({ type: 'GATEWAY_CONNECTED', now: now() }),
      {
        title: 'Central gateway connected',
        message: 'Local communication path established. This does not imply radar penetration or validated detection.',
        tone: 'success',
      },
    )
  }, [now, runAsync])

  const startScan = useCallback(() => {
    if (lockRef.current) return
    dispatch({ type: 'SCAN_START', now: now() })
    pushToast('Initial scan started', 'Pre-programmed illustrative observations are being collected node by node.', 'info')
  }, [now, pushToast])

  useEffect(() => {
    if (scene !== 7 || state.scanning.completedAt !== null) return
    const timer = window.setTimeout(() => {
      dispatch({ type: 'SCAN_STEP', now: now() })
    }, 1150)
    return () => window.clearTimeout(timer)
  }, [scene, state.scanning.activeNodeId, state.scanning.completedAt, state.scanning.startedAt, now])

  const simulateSensorFailure = useCallback(() => {
    runAsync(
      'failure',
      'Injecting node communication failure',
      1100,
      () => ({ type: 'SENSOR_FAILURE', now: now() }),
      {
        title: 'Sensor node offline',
        message: 'The affected zone remains Unverified. A failed sensor is never treated as evidence that the area is empty.',
        tone: 'danger',
      },
    )
  }, [now, runAsync])

  const reassessCoverage = useCallback(() => {
    runAsync(
      'reassess',
      'Reviewing alternative safe measurement positions',
      1400,
      () => ({ type: 'REASSESSMENT_COMPLETE', now: now() }),
      {
        title: 'Coverage not restored',
        message: 'C2 and C3 were rejected. Replacement hardware exists but no safe measurement path is available.',
        tone: 'warning',
      },
    )
  }, [now, runAsync])

  const rescanZone = useCallback(
    (zoneId: ZoneId) => {
      if (lockRef.current) return
      const node = connectedNodeForZone(state, zoneId)
      if (!node) {
        pushToast(
          `Rescan unavailable · Zone ${zoneId}`,
          'No connected node covers this zone. The zone remains Unverified and cannot be cleared by rescanning.',
          'warning',
        )
        return
      }
      runAsync(
        `rescan-${zoneId}`,
        `Rescanning Zone ${zoneId} with ${node.id}`,
        1200,
        () => ({ type: 'RESCAN_COMPLETE', zoneId, now: now() }),
        {
          title: `Rescan complete · Zone ${zoneId}`,
          message: 'No additional candidate signal. Prior candidate observations are retained for human verification.',
          tone: 'info',
        },
      )
    },
    [now, pushToast, runAsync, state],
  )

  const openVerification = useCallback((zoneId: ZoneId) => setVerifyZone(zoneId), [])
  const closeVerification = useCallback(() => setVerifyZone(null), [])

  const confirmVerification = useCallback(
    (method: string, name: string) => {
      if (!verifyZone) return
      if (!name.trim()) {
        pushToast('Name required', 'Record the person who independently confirmed the candidate.', 'warning')
        return
      }
      dispatch({ type: 'VERIFY_SURVIVOR', zoneId: verifyZone, method, confirmedBy: name, now: now() })
      pushToast(
        `Human verification recorded · Zone ${verifyZone}`,
        'The Human Verified status came from rescue personnel, not from a sensor-only conclusion.',
        'success',
      )
      setVerifyZone(null)
    },
    [now, pushToast, verifyZone],
  )

  const completeExtraction = useCallback(() => {
    runAsync(
      'extraction',
      'Recording extraction and medical handover',
      1500,
      () => ({ type: 'EXTRACTION_COMPLETE', now: now() }),
      {
        title: 'Extraction sequence completed',
        message: 'The demonstrated rescue is complete. Unresolved zones keep the overall search operation In Progress.',
        tone: 'success',
      },
    )
  }, [now, runAsync])

  const generateReport = useCallback(() => {
    if (state.extraction === null) return
    dispatch({ type: 'REPORT_GENERATED', now: now() })
    setTabState('report')
    pushToast('Final search report ready', 'All figures are derived from the simulation ledger. Unresolved zones remain visible.', 'info')
  }, [now, pushToast, state.extraction])

  const restartSimulation = useCallback(() => {
    generationRef.current += 1
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current.clear()
    lockRef.current = null
    setBusy(null)
    setSelectedZone(null)
    setSelectedNode(null)
    setReviewObservationId(null)
    setVerifyZone(null)
    setToasts([])
    setTabState('operation')
    dispatch({ type: 'RESTART', now: now() })
    pushToast('Simulation restarted', 'Scene 1 · Normal Building. All previous events and readings have been cleared.', 'info')
  }, [now, pushToast])

  const selectZone = useCallback((zoneId: ZoneId | null) => {
    setSelectedZone(zoneId)
  }, [])

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId)
  }, [])

  const openObservation = useCallback((observationId: string | null) => {
    setReviewObservationId(observationId)
  }, [])

  const value = useMemo<RfFenseContextValue>(
    () => ({
      state,
      scene,
      phase,
      report,
      tab,
      busy,
      selectedZone,
      selectedNode,
      reviewObservationId,
      verifyZone,
      toasts,
      elapsed,
      setTab,
      selectZone,
      selectNode,
      openObservation,
      openVerification,
      closeVerification,
      confirmVerification,
      dismissToast,
      triggerEarthquake,
      runSafetyAssessment,
      markSafeAreas,
      confirmZones,
      setSensorType,
      deploySensors,
      connectGateway,
      startScan,
      simulateSensorFailure,
      reassessCoverage,
      rescanZone,
      completeExtraction,
      generateReport,
      restartSimulation,
      now,
    }),
    [
      state,
      scene,
      phase,
      report,
      tab,
      busy,
      selectedZone,
      selectedNode,
      reviewObservationId,
      verifyZone,
      toasts,
      elapsed,
      setTab,
      selectZone,
      selectNode,
      openObservation,
      openVerification,
      closeVerification,
      confirmVerification,
      dismissToast,
      triggerEarthquake,
      runSafetyAssessment,
      markSafeAreas,
      confirmZones,
      setSensorType,
      deploySensors,
      connectGateway,
      startScan,
      simulateSensorFailure,
      reassessCoverage,
      rescanZone,
      completeExtraction,
      generateReport,
      restartSimulation,
      now,
    ],
  )

  return <RfFenseContext.Provider value={value}>{children}</RfFenseContext.Provider>
}

export function useRfFense(): RfFenseContextValue {
  const value = useContext(RfFenseContext)
  if (!value) throw new Error('useRfFense must be used inside RfFenseProvider')
  return value
}
