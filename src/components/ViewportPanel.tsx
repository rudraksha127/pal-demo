import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  Box,
  ChevronDown,
  Compass,
  Crosshair,
  Eye,
  Hand,
  Layers,
  LoaderCircle,
  Maximize2,
  Minimize2,
  MousePointer2,
  Orbit,
  RotateCcw,
  ScanLine,
  Settings,
  Target,
  User,
  X,
} from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import type { FloorFilter, SceneTool } from '../types'
import { CollapseScene, type CameraPreset } from './scene/CollapseScene'
import { FloorPlan } from './scene/FloorPlan'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { SensorInspectionDialog } from './modals/SensorInspectionDialog'
import { VictimTriageDialog } from './modals/VictimTriageDialog'
import { SettingsDialog } from './modals/SettingsDialog'
import { tacticalAudio } from '../utils/audio'

const TOOL_ITEMS: Array<{ id: SceneTool; label: string; shortcut: string; icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Select & Inspect', shortcut: 'S', icon: MousePointer2 },
  { id: 'pan', label: 'Pan Camera', shortcut: 'P', icon: Hand },
  { id: 'orbit', label: 'Orbit Camera', shortcut: 'O', icon: Orbit },
]

export function ViewportPanel() {
  const {
    ui,
    state,
    scenario,
    setViewMode,
    setFloor,
    setTool,
    toggleOverlays,
    selectZone,
    selectSensor,
    addToast,
  } = useSimulation()

  const panelRef = useRef<HTMLElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [sceneReady, setSceneReady] = useState(false)
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero')
  const [sensorDialogOpen, setSensorDialogOpen] = useState(false)
  const [inspectedSensorId, setInspectedSensorId] = useState<string | null>(null)
  const [victimDialogOpen, setVictimDialogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bloomEnabled, setBloomEnabled] = useState(true)
  const [particlesEnabled, setParticlesEnabled] = useState(true)

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === panelRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    setSceneReady(false)
    if (ui.viewMode === 'plan') return
    const timer = window.setTimeout(() => setSceneReady(true), 500)
    return () => window.clearTimeout(timer)
  }, [ui.viewMode, scenario.id])

  const toggleFullscreen = useCallback(() => {
    tacticalAudio.playClick()
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void panelRef.current?.requestFullscreen()
    }
  }, [])

  const selectedZone = scenario.zones.find((zone) => zone.id === ui.selectedZone) ?? null

  const handleSelectSensor = (sensorId: string | null) => {
    tacticalAudio.playClick()
    selectSensor(sensorId)
    if (sensorId) {
      setInspectedSensorId(sensorId)
      setSensorDialogOpen(true)
    }
  }

  const handleSelectVictim = () => {
    tacticalAudio.playClick()
    setVictimDialogOpen(true)
  }

  const handlePresetChange = (preset: CameraPreset, label: string) => {
    tacticalAudio.playClick()
    setCameraPreset(preset)
    addToast('Camera viewpoint updated', `${label} viewpoint active.`, 'info')
  }

  const changeFloor = (val: FloorFilter) => {
    tacticalAudio.playClick()
    setFloor(val)
    if (val === 2) {
      addToast('Floor 2 Isolated', 'Target collapse cavity and survivor zone isolated.', 'warning')
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <section className="viewport-panel panel" ref={panelRef} aria-label="Collapse site visualisation">
        {ui.viewMode === '3d' ? (
          <CollapseScene
            scenario={scenario}
            floor={ui.floor}
            tool={ui.tool}
            overlays={ui.overlays}
            selectedZone={ui.selectedZone}
            selectedSensor={ui.selectedSensor}
            onSelectZone={(zId) => {
              tacticalAudio.playClick()
              selectZone(zId)
            }}
            onSelectSensor={handleSelectSensor}
            onSelectVictim={handleSelectVictim}
            victimVisible={state.evidence >= 50}
            sensorsActive={state.progress >= 20}
            resetSignal={resetSignal}
            cameraPreset={cameraPreset}
            bloomEnabled={bloomEnabled}
            particlesEnabled={particlesEnabled}
            onReady={() => setSceneReady(true)}
          />
        ) : (
          <div className="floor-plan">
            <span className="floor-plan__hint">Floor plan · click a zone to inspect</span>
            <FloorPlan
              scenario={scenario}
              floor={ui.floor}
              selectedZone={ui.selectedZone}
              onSelectZone={(zId) => {
                tacticalAudio.playClick()
                selectZone(zId)
              }}
              evidence={state.evidence}
            />
            <div className="floor-plan__legend" aria-label="Zone legend">
              {scenario.zones.map((zone) => (
                <span key={zone.id} style={{ '--legend-color': zone.color } as CSSProperties}>
                  <i /> {zone.id} · {zone.kind}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="viewport-vignette" aria-hidden="true" />

        {!sceneReady && ui.viewMode === '3d' && (
          <div className="viewport-loading">
            <span>
              <LoaderCircle size={22} className="spin" />
              Reconstructing 3D collapse site
            </span>
          </div>
        )}

        {/* ── Left Floating Toolbar ── */}
        <div className="viewport-toolbar" role="toolbar" aria-label="Scene tools">
          {TOOL_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    className={`viewport-tool ${ui.tool === item.id ? 'is-active' : ''}`}
                    onClick={() => {
                      tacticalAudio.playClick()
                      setTool(item.id)
                    }}
                    aria-label={`${item.label} (${item.shortcut})`}
                    aria-pressed={ui.tool === item.id}
                  >
                    <Icon size={16} strokeWidth={1.9} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label} <kbd style={{ marginLeft: 4, opacity: 0.7 }}>[{item.shortcut}]</kbd>
                </TooltipContent>
              </Tooltip>
            )
          })}

          <span className="viewport-tool--divider" aria-hidden="true" />

          {/* Toggle Overlays */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`viewport-tool ${ui.overlays ? 'is-active' : ''}`}
                onClick={() => {
                  tacticalAudio.playClick()
                  toggleOverlays()
                }}
                aria-label="Toggle search overlays"
                aria-pressed={ui.overlays}
              >
                <Layers size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle Holographic Zones &amp; Radar Rings</TooltipContent>
          </Tooltip>

          {/* Site Bounds */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`viewport-tool ${ui.tool === 'bounds' ? 'is-active' : ''}`}
                onClick={() => {
                  tacticalAudio.playClick()
                  setTool(ui.tool === 'bounds' ? 'select' : 'bounds')
                }}
                aria-label="Toggle site bounds"
                aria-pressed={ui.tool === 'bounds'}
              >
                <ScanLine size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Toggle Perimeter Enclosure Bounds</TooltipContent>
          </Tooltip>

          <span className="viewport-tool--divider" aria-hidden="true" />

          {/* Camera Viewpoint: Hero Perspective */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`viewport-tool ${cameraPreset === 'hero' ? 'is-active' : ''}`}
                onClick={() => handlePresetChange('hero', 'Hero perspective')}
                aria-label="Hero ground perspective"
              >
                <Eye size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Hero Ground Perspective (Default)</TooltipContent>
          </Tooltip>

          {/* Camera Viewpoint: Drone Aerial */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`viewport-tool ${cameraPreset === 'drone' ? 'is-active' : ''}`}
                onClick={() => handlePresetChange('drone', 'Drone aerial view')}
                aria-label="Drone aerial view"
              >
                <Compass size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Drone Aerial Overview</TooltipContent>
          </Tooltip>

          {/* Camera Viewpoint: Target Zone 3 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`viewport-tool ${cameraPreset === 'victim' ? 'is-active' : ''}`}
                onClick={() => handlePresetChange('victim', 'Zone 3 victim cavity')}
                aria-label="Target Zone 3 Focus"
              >
                <Target size={16} strokeWidth={1.9} color={state.evidence >= 60 ? '#ff5f56' : undefined} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Focus Zone Z-03 Survivor Cavity</TooltipContent>
          </Tooltip>

          {/* Camera Viewpoint: Ortho Top-down */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`viewport-tool ${cameraPreset === 'ortho' ? 'is-active' : ''}`}
                onClick={() => handlePresetChange('ortho', 'Orthographic Top-Down')}
                aria-label="Orthographic Top-Down"
              >
                <Crosshair size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Orthographic Top-Down Plan</TooltipContent>
          </Tooltip>

          <span className="viewport-tool--divider" aria-hidden="true" />

          {/* Reset Camera */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="viewport-tool"
                onClick={() => {
                  tacticalAudio.playClick()
                  setTool('select')
                  setResetSignal((s) => s + 1)
                  setCameraPreset('hero')
                  setViewMode('3d')
                }}
                aria-label="Reset Camera"
              >
                <RotateCcw size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Reset Camera to Default</TooltipContent>
          </Tooltip>

          {/* Render FX Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="viewport-tool"
                onClick={() => {
                  tacticalAudio.playClick()
                  setSettingsOpen(true)
                }}
                aria-label="Rendering Preferences"
              >
                <Settings size={16} strokeWidth={1.9} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Rendering &amp; Particle Preferences</TooltipContent>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="viewport-tool"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={16} strokeWidth={1.9} /> : <Maximize2 size={16} strokeWidth={1.9} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}</TooltipContent>
          </Tooltip>
        </div>

        {/* ── Top-Right Controls Overlay (shadcn Tabs & Dropdown) ── */}
        <div className="viewport-controls">
          <Tabs value={ui.viewMode} onValueChange={(val) => setViewMode(val as '3d' | 'plan')}>
            <TabsList>
              <TabsTrigger value="3d">
                <Box size={13} strokeWidth={2} style={{ marginRight: 6 }} />
                3D View
              </TabsTrigger>
              <TabsTrigger value="plan">Floor Plan</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Floor Selection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="floor-select-btn" aria-label="Filter by floor">
                <Layers size={13} color="var(--color-emerald-bright)" />
                <span>{ui.floor === 'all' ? 'Floor : All Floors' : `Floor : Floor ${ui.floor}`}</span>
                <ChevronDown size={13} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Floor Cutaway</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => changeFloor('all')}>
                <span>All Floors (Full Structure)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeFloor(1)}>
                <span>Floor 01 · Ground Level Entry</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeFloor(2)} style={{ color: '#ff6b62', fontWeight: 600 }}>
                <span>Floor 02 · Zone Z-03 (Potential Victim)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeFloor(3)}>
                <span>Floor 03 · Zone Z-02 (Search Zone)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeFloor(4)}>
                <span>Floor 04 · Upper Concrete Wing</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeFloor(5)}>
                <span>Floor 05 · Rooftop Observation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Selected Zone Chip ── */}
        {selectedZone && (
          <div className="zone-chip" style={{ '--zone-color': selectedZone.color } as CSSProperties}>
            <span className="zone-chip__dot" />
            <strong>{selectedZone.id}</strong>
            <span>
              ({selectedZone.kind === 'primary' ? 'Primary' : selectedZone.kind === 'search' ? 'Search' : 'Collapse'}) · Floor{' '}
              {selectedZone.floor} · {selectedZone.confidence}% conf
            </span>
            <button
              onClick={() => {
                tacticalAudio.playClick()
                selectZone(null)
              }}
              aria-label="Clear zone selection"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ── Quick Victim Inspection Chip (when detected) ── */}
        {state.evidence >= 60 && (
          <div
            className="victim-hud-chip"
            onClick={handleSelectVictim}
            role="button"
            tabIndex={0}
            title="Click to view full survivor triage dossier"
          >
            <span className="victim-hud-chip__dot" />
            <User size={13} color="#ff5f56" />
            <strong>VICTIM T-01 DETECTED</strong>
            <span>Floor 2 · {Math.round(state.evidence)}% Confidence</span>
          </div>
        )}

        {/* ── Viewport HUD Bar at Bottom ── */}
        <div className="viewport-hud" aria-hidden="true">
          <span className="hud-live">
            <i /> {state.status === 'running' ? 'Live Scanning' : state.status === 'paused' ? 'Paused' : 'Complete'}
          </span>
          <span className="hud-sep" />
          <span>Scene 04 · Sector-17</span>
          <span className="hud-sep" />
          <span>LiDAR Mesh 2.4M pts</span>
          <span className="hud-sep" />
          <span style={{ color: 'var(--color-emerald-bright)' }}>Triangulation: ACTIVE</span>
        </div>

        <div className="viewport-scale" aria-hidden="true">
          <span className="scale-bar" />
          10 m
        </div>

        {/* Telemetry Inspection Dialog */}
        <SensorInspectionDialog
          sensorId={inspectedSensorId}
          open={sensorDialogOpen}
          onOpenChange={setSensorDialogOpen}
        />

        {/* Survivor Triage Dossier Dialog */}
        <VictimTriageDialog
          open={victimDialogOpen}
          onOpenChange={setVictimDialogOpen}
        />

        {/* Render FX Settings Dialog */}
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          bloomEnabled={bloomEnabled}
          onToggleBloom={setBloomEnabled}
          particlesEnabled={particlesEnabled}
          onToggleParticles={setParticlesEnabled}
        />
      </section>
    </TooltipProvider>
  )
}
