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
import { tacticalAudio } from '../utils/audio'
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
  isAutoRunning: boolean
  runAutonomousSimulation: () => void
  stopAutonomousSimulation: () => void
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

  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const autoRunningRef = useRef(false)
  const autoRunTimersRef = useRef<number[]>([])

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
      autoRunningRef.current = false
      autoRunTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      autoRunTimersRef.current = []
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
    tacticalAudio.playEarthquakeRumble()
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
    tacticalAudio.playRadarPing()
    dispatch({ type: 'SCAN_START', now: now() })
    pushToast('Initial scan started', 'Pre-programmed illustrative observations are being collected node by node.', 'info')
  }, [now, pushToast])

  useEffect(() => {
    if (scene !== 7 || state.scanning.completedAt !== null) return
    const timer = window.setTimeout(() => {
      tacticalAudio.playRadarPing()
      dispatch({ type: 'SCAN_STEP', now: now() })
    }, 1150)
    return () => window.clearTimeout(timer)
  }, [scene, state.scanning.activeNodeId, state.scanning.completedAt, state.scanning.startedAt, now])

  const simulateSensorFailure = useCallback(() => {
    tacticalAudio.playAlarmWarning()
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
      tacticalAudio.playStageChime()
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
    tacticalAudio.playRescueConfirmed()
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
    tacticalAudio.playStageChime()
    dispatch({ type: 'REPORT_GENERATED', now: now() })
    setTabState('report')
    pushToast('Final search report ready', 'All figures are derived from the simulation ledger. Unresolved zones remain visible.', 'info')
  }, [now, pushToast, state.extraction])

  const restartSimulation = useCallback(() => {
    tacticalAudio.playClick()
    autoRunningRef.current = false
    setIsAutoRunning(false)
    autoRunTimersRef.current.forEach((t) => window.clearTimeout(t))
    autoRunTimersRef.current = []
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

  const stopAutonomousSimulation = useCallback(() => {
    autoRunningRef.current = false
    setIsAutoRunning(false)
    autoRunTimersRef.current.forEach((t) => window.clearTimeout(t))
    autoRunTimersRef.current = []
    pushToast('Autonomous run stopped', 'Manual control restored. You can continue from the current scene.', 'info')
  }, [pushToast])

  const runAutonomousSimulation = useCallback(() => {
    if (lockRef.current) return
    autoRunTimersRef.current.forEach((t) => window.clearTimeout(t))
    autoRunTimersRef.current = []

    autoRunningRef.current = true
    setIsAutoRunning(true)
    pushToast('Autonomous Mode Activated', 'Running end-to-end disaster-to-rescue simulation across all 12 scenes...', 'success')

    const scheduleStep = (fn: () => void, delay: number) => {
      const t = window.setTimeout(() => {
        if (!autoRunningRef.current) return
        fn()
      }, delay)
      autoRunTimersRef.current.push(t)
    }

    // Step 1: Earthquake
    triggerEarthquake()

    // Step 2: Safety Assessment (~4800ms)
    scheduleStep(() => {
      runSafetyAssessment()
    }, 4800)

    // Step 3: Mark Safe Areas (~7200ms)
    scheduleStep(() => {
      markSafeAreas()
    }, 7200)

    // Step 4: Confirm Search Zones (~8700ms)
    scheduleStep(() => {
      confirmZones()
    }, 8700)

    // Step 5: Deploy Sensor Nodes (~10000ms)
    scheduleStep(() => {
      deploySensors()
    }, 10000)

    // Step 6: Connect Central Gateway (~12100ms)
    scheduleStep(() => {
      connectGateway()
    }, 12100)

    // Step 7: Start Initial Scan (~14300ms)
    scheduleStep(() => {
      startScan()
    }, 14300)

    // Step 8: Simulate Sensor Failure (~19500ms)
    scheduleStep(() => {
      simulateSensorFailure()
    }, 19500)

    // Step 9: Reassess Coverage Options (~21200ms)
    scheduleStep(() => {
      reassessCoverage()
    }, 21200)

    // Step 10: Rescan Zone A (~23100ms)
    scheduleStep(() => {
      rescanZone('A')
    }, 23100)

    // Step 11: Human Verification with explicit commander signature (~25200ms)
    scheduleStep(() => {
      confirmVerification('Visual and Acoustic Search Team', 'Captain M. Okafor (Rescue Commander)')
    }, 25200)

    // Step 12: Complete Extraction & Medical Handover (~27200ms)
    scheduleStep(() => {
      completeExtraction()
    }, 27200)

    // Step 13: Generate Final Search Report (~29500ms)
    scheduleStep(() => {
      generateReport()
      autoRunningRef.current = false
      setIsAutoRunning(false)
      pushToast('Autonomous Simulation Complete', 'All 12 disaster-to-rescue scenes successfully executed. Final report generated.', 'success')
    }, 29500)
  }, [
    triggerEarthquake,
    runSafetyAssessment,
    markSafeAreas,
    confirmZones,
    deploySensors,
    connectGateway,
    startScan,
    simulateSensorFailure,
    reassessCoverage,
    rescanZone,
    confirmVerification,
    completeExtraction,
    generateReport,
    pushToast,
  ])

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
      isAutoRunning,
      runAutonomousSimulation,
      stopAutonomousSimulation,
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
      isAutoRunning,
      runAutonomousSimulation,
      stopAutonomousSimulation,
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
