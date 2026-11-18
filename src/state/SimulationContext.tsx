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
  FloorFilter,
  NavTab,
  SavedMission,
  SceneTool,
  Scenario,
  SimulationState,
  Toast,
  Tone,
  ViewMode,
} from '../types'
import { getScenario } from '../data/scenarios'
import { createFreshRun, createInitialState, tick } from '../simulation/engine'

const STORAGE_KEY = 'aftershock.mission.v1'

type Action =
  | { type: 'TICK'; now: number }
  | { type: 'RUN_FULL'; now: number }
  | { type: 'RESET' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_SCENARIO'; scenarioId: string }
  | { type: 'RESTORE'; saved: SavedMission }
  | { type: 'MARK_READ' }

function reducer(state: SimulationState, action: Action): SimulationState {
  switch (action.type) {
    case 'TICK':
      return tick(state, getScenario(state.scenarioId), action.now)
    case 'RUN_FULL':
      return createFreshRun(getScenario(state.scenarioId), state.speed, action.now)
    case 'RESET':
      return createInitialState(getScenario(state.scenarioId))
    case 'TOGGLE_PAUSE': {
      if (state.status === 'complete') return state
      return { ...state, status: state.status === 'running' ? 'paused' : 'running' }
    }
    case 'SET_SPEED':
      return { ...state, speed: action.speed }
    case 'SET_SCENARIO':
      return createInitialState(getScenario(action.scenarioId))
    case 'RESTORE': {
      const scenario = getScenario(action.saved.scenarioId)
      return {
        ...action.saved.state,
        scenarioId: scenario.id,
        status: action.saved.state.status === 'complete' ? 'complete' : 'paused',
      }
    }
    case 'MARK_READ':
      return {
        ...state,
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      }
    default:
      return state
  }
}

interface UiState {
  tab: NavTab
  viewMode: ViewMode
  floor: FloorFilter
  tool: SceneTool
  overlays: boolean
  selectedZone: string | null
  selectedSensor: string | null
}

interface SimulationContextValue {
  state: SimulationState
  scenario: Scenario
  ui: UiState
  toasts: Toast[]
  unreadCount: number
  hasSavedMission: boolean
  setTab: (tab: NavTab) => void
  setViewMode: (mode: ViewMode) => void
  setFloor: (floor: FloorFilter) => void
  setTool: (tool: SceneTool) => void
  toggleOverlays: () => void
  selectZone: (id: string | null) => void
  selectSensor: (id: string | null) => void
  runFullSimulation: () => void
  resetSimulation: () => void
  togglePause: () => void
  setSpeed: (speed: number) => void
  selectScenario: (id: string) => void
  saveMission: () => void
  restoreMission: () => void
  markNotificationsRead: () => void
  addToast: (title: string, message?: string, tone?: Tone) => void
  dismissToast: (id: number) => void
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

const VALID_TABS: NavTab[] = ['simulation', 'analysis', 'report', 'scenarios']

function tabFromHash(): NavTab {
  const value = window.location.hash.replace('#', '') as NavTab
  return VALID_TABS.includes(value) ? value : 'simulation'
}

function readSavedMission(): SavedMission | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedMission
    if (!parsed?.state || !parsed?.scenarioId) return null
    return parsed
  } catch {
    return null
  }
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(getScenario('urban-collapse')))
  const [tab, setTabState] = useState<NavTab>(() => tabFromHash())
  const [viewMode, setViewMode] = useState<ViewMode>('3d')
  const [floor, setFloor] = useState<FloorFilter>('all')
  const [tool, setTool] = useState<SceneTool>('select')
  const [overlays, setOverlays] = useState(true)
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [hasSavedMission, setHasSavedMission] = useState(() => Boolean(readSavedMission()))
  const toastId = useRef(1)
  const timers = useRef<Map<number, number>>(new Map())

  const scenario = getScenario(state.scenarioId)

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (title: string, message?: string, tone: Tone = 'info') => {
      const id = toastId.current++
      setToasts((current) => [...current, { id, title, message, tone }].slice(-4))
      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
        timers.current.delete(id)
      }, 4200)
      timers.current.set(id, timer)
    },
    [],
  )

  useEffect(() => {
    if (state.status !== 'running') return
    const interval = window.setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() })
    }, 250)
    return () => window.clearInterval(interval)
  }, [state.status, state.speed])

  useEffect(() => {
    const onHashChange = () => setTabState(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.code === 'Space' && tab === 'simulation') {
        event.preventDefault()
        dispatch({ type: 'TOGGLE_PAUSE' })
      }
      if (event.key.toLowerCase() === 'r' && !event.metaKey && !event.ctrlKey) {
        dispatch({ type: 'RESET' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tab])

  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const setTab = useCallback((next: NavTab) => {
    setTabState(next)
    window.history.replaceState(null, '', `#${next}`)
  }, [])

  const runFullSimulation = useCallback(() => {
    dispatch({ type: 'RUN_FULL', now: Date.now() })
    setTab('simulation')
    addToast('Autonomous simulation started', 'The full eight-stage rescue workflow is now running.', 'success')
  }, [addToast, setTab])

  const resetSimulation = useCallback(() => {
    dispatch({ type: 'RESET' })
    addToast('Mission reset', 'Dashboard restored to the live scanning snapshot.', 'info')
  }, [addToast])

  const togglePause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PAUSE' })
  }, [])

  const setSpeed = useCallback((speed: number) => {
    dispatch({ type: 'SET_SPEED', speed })
  }, [])

  const selectScenario = useCallback(
    (id: string) => {
      const next = getScenario(id)
      dispatch({ type: 'SET_SCENARIO', scenarioId: id })
      setTab('simulation')
      setFloor('all')
      setSelectedZone(next.zones[2]?.id ?? next.zones[0]?.id ?? null)
      addToast(`${next.name} loaded`, 'Scenario prepared. Run the simulation when ready.', 'info')
    },
    [addToast, setTab],
  )

  const saveMission = useCallback(() => {
    try {
      const saved: SavedMission = { scenarioId: state.scenarioId, state, savedAt: Date.now() }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      setHasSavedMission(true)
      addToast('Mission saved', 'Snapshot stored locally on this device.', 'success')
    } catch {
      addToast('Save failed', 'Local storage is unavailable in this browser.', 'danger')
    }
  }, [addToast, state])

  const restoreMission = useCallback(() => {
    const saved = readSavedMission()
    if (!saved) {
      addToast('No saved mission', 'Run and save a mission before restoring.', 'warning')
      return
    }
    dispatch({ type: 'RESTORE', saved })
    setTab('simulation')
    addToast('Mission restored', 'Saved snapshot loaded and paused for review.', 'success')
  }, [addToast, setTab])

  const markNotificationsRead = useCallback(() => {
    dispatch({ type: 'MARK_READ' })
  }, [])

  const toggleOverlays = useCallback(() => setOverlays((value) => !value), [])

  const unreadCount = state.notifications.filter((item) => !item.read).length

  const value = useMemo<SimulationContextValue>(
    () => ({
      state,
      scenario,
      ui: {
        tab,
        viewMode,
        floor,
        tool,
        overlays,
        selectedZone,
        selectedSensor,
      },
      toasts,
      unreadCount,
      hasSavedMission,
      setTab,
      setViewMode,
      setFloor,
      setTool,
      toggleOverlays,
      selectZone: setSelectedZone,
      selectSensor: setSelectedSensor,
      runFullSimulation,
      resetSimulation,
      togglePause,
      setSpeed,
      selectScenario,
      saveMission,
      restoreMission,
      markNotificationsRead,
      addToast,
      dismissToast,
    }),
    [
      state,
      scenario,
      tab,
      viewMode,
      floor,
      tool,
      overlays,
      selectedZone,
      selectedSensor,
      toasts,
      unreadCount,
      hasSavedMission,
      setTab,
      toggleOverlays,
      runFullSimulation,
      resetSimulation,
      togglePause,
      setSpeed,
      selectScenario,
      saveMission,
      restoreMission,
      markNotificationsRead,
      addToast,
      dismissToast,
    ],
  )

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
}

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext)
  if (!context) throw new Error('useSimulation must be used inside SimulationProvider')
  return context
}
