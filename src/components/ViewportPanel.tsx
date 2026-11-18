import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  Box,
  ChevronDown,
  Crosshair,
  Hand,
  Layers,
  LoaderCircle,
  Maximize2,
  Minimize2,
  MousePointer2,
  Orbit,
  ScanLine,
  X,
} from 'lucide-react'
import { useSimulation } from '../state/SimulationContext'
import type { FloorFilter, SceneTool } from '../types'
import { CollapseScene } from './scene/CollapseScene'
import { FloorPlan } from './scene/FloorPlan'

const TOOL_ITEMS: Array<{ id: SceneTool; label: string; icon: typeof MousePointer2 }> = [
  { id: 'select', label: 'Select and inspect', icon: MousePointer2 },
  { id: 'pan', label: 'Pan camera', icon: Hand },
  { id: 'orbit', label: 'Orbit camera', icon: Orbit },
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
  } = useSimulation()
  const panelRef = useRef<HTMLElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === panelRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    setSceneReady(false)
    if (ui.viewMode === 'plan') return
    const timer = window.setTimeout(() => setSceneReady(true), 650)
    return () => window.clearTimeout(timer)
  }, [ui.viewMode, scenario.id])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void panelRef.current?.requestFullscreen()
    }
  }, [])

  const selectedZone = scenario.zones.find((zone) => zone.id === ui.selectedZone) ?? null

  const changeFloor = (value: string) => {
    setFloor(value === 'all' ? 'all' : (Number(value) as Exclude<FloorFilter, 'all'>))
  }

  return (
    <section className="viewport-panel panel" ref={panelRef} aria-label="Collapse site visualisation">
      {ui.viewMode === '3d' ? (
        <CollapseScene
          scenario={scenario}
          floor={ui.floor}
          tool={ui.tool}
          overlays={ui.overlays}
          selectedZone={ui.selectedZone}
          selectedSensor={ui.selectedSensor}
          onSelectZone={selectZone}
          onSelectSensor={selectSensor}
          victimVisible={state.evidence >= 60}
          sensorsActive={state.progress >= 25}
          resetSignal={resetSignal}
          onReady={() => setSceneReady(true)}
        />
      ) : (
        <div className="floor-plan">
          <span className="floor-plan__hint">Floor plan · click a zone to inspect</span>
          <FloorPlan
            scenario={scenario}
            floor={ui.floor}
            selectedZone={ui.selectedZone}
            onSelectZone={selectZone}
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
            Reconstructing collapse scene
          </span>
        </div>
      )}

      <div className="viewport-toolbar" role="toolbar" aria-label="Scene tools">
        {TOOL_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`viewport-tool ${ui.tool === item.id ? 'is-active' : ''}`}
              onClick={() => setTool(item.id)}
              aria-label={item.label}
              aria-pressed={ui.tool === item.id}
              title={item.label}
            >
              <Icon size={16} strokeWidth={1.9} />
            </button>
          )
        })}
        <span className="viewport-tool--divider" aria-hidden="true" />
        <button
          className={`viewport-tool ${ui.overlays ? 'is-active' : ''}`}
          onClick={toggleOverlays}
          aria-label="Toggle search overlays"
          aria-pressed={ui.overlays}
          title="Toggle search overlays"
        >
          <Layers size={16} strokeWidth={1.9} />
        </button>
        <button
          className={`viewport-tool ${ui.tool === 'bounds' ? 'is-active' : ''}`}
          onClick={() => setTool(ui.tool === 'bounds' ? 'select' : 'bounds')}
          aria-label="Toggle site bounds"
          aria-pressed={ui.tool === 'bounds'}
          title="Toggle site bounds"
        >
          <ScanLine size={16} strokeWidth={1.9} />
        </button>
        <button
          className="viewport-tool"
          onClick={() => {
            setTool('select')
            setResetSignal((value) => value + 1)
            setViewMode('3d')
          }}
          aria-label="Reset camera"
          title="Reset camera"
        >
          <Crosshair size={16} strokeWidth={1.9} />
        </button>
        <span className="viewport-tool--divider" aria-hidden="true" />
        <button
          className="viewport-tool"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} strokeWidth={1.9} /> : <Maximize2 size={16} strokeWidth={1.9} />}
        </button>
      </div>

      <div className="viewport-controls">
        <div className="segmented" role="group" aria-label="View mode">
          <button className={ui.viewMode === '3d' ? 'is-active' : ''} onClick={() => setViewMode('3d')} aria-pressed={ui.viewMode === '3d'}>
            <Box size={13} strokeWidth={1.9} style={{ display: 'inline', marginRight: 5, verticalAlign: '-2px' }} />
            3D View
          </button>
          <button
            className={ui.viewMode === 'plan' ? 'is-active' : ''}
            onClick={() => setViewMode('plan')}
            aria-pressed={ui.viewMode === 'plan'}
          >
            Floor Plan
          </button>
        </div>

        <label className="floor-select">
          <Layers size={13} />
          <span className="sr-only">Filter by floor</span>
          <select value={ui.floor === 'all' ? 'all' : String(ui.floor)} onChange={(event) => changeFloor(event.target.value)}>
            <option value="all">All floors</option>
            {Array.from({ length: scenario.floors }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                Floor {index + 1}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="select-chevron" />
        </label>
      </div>

      {selectedZone && (
        <div className="zone-chip" style={{ '--zone-color': selectedZone.color } as CSSProperties}>
          <span className="zone-chip__dot" />
          <strong>{selectedZone.id}</strong>
          <span>
            ({selectedZone.kind === 'primary' ? 'Primary' : selectedZone.kind === 'search' ? 'Search' : 'Collapse'}) · Floor{' '}
            {selectedZone.floor} · {selectedZone.confidence}% conf
          </span>
          <button onClick={() => selectZone(null)} aria-label="Clear zone selection">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="viewport-hud" aria-hidden="true">
        <span className="hud-live">
          <i /> {state.status === 'running' ? 'Live' : state.status === 'paused' ? 'Paused' : 'Complete'}
        </span>
        <span className="hud-sep" />
        <span>Scene 04 · Sector-17</span>
        <span className="hud-sep" />
        <span>LiDAR mesh 2.4M pts</span>
      </div>

      <div className="viewport-scale" aria-hidden="true">
        <span className="scale-bar" />
        10 m
      </div>
    </section>
  )
}
