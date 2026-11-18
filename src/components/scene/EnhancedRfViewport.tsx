import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { Radio, ScanLine, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useRfFense } from '../../rf/RfFenseContext'
import { SCENES } from '../../rf/data'
import { SiteScene } from './SiteScene'
import { ViewportLegend } from './ViewportLegend'
import { SelectionInfo } from './SelectionInfo'
import { useReducedMotion } from './hooks'
import * as THREE from 'three'
import { ACESFilmicToneMapping } from 'three'

export function EnhancedRfViewport() {
  const { state, scene, selectedZone, selectedNode, report } = useRfFense()
  const reduced = useReducedMotion()
  const meta = SCENES[scene - 1]
  const scanning = state.scanning.startedAt !== null && state.scanning.completedAt === null
  const activeZone = state.zones.find((z) => z.id === selectedZone) ?? null
  const activeNode = state.nodes.find((n) => n.id === selectedNode) ?? null
  const latest = activeZone ? [...state.observations].reverse().find((o) => o.zoneId === activeZone.id) : null

  const handleZoneClick = (zoneId: string) => window.dispatchEvent(new CustomEvent('rf:zone-select', { detail: { zoneId } }))
  const handleNodeClick = (nodeId: string) => window.dispatchEvent(new CustomEvent('rf:node-select', { detail: { nodeId } }))

  return (
    <section className="rf-viewport panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '14px', boxShadow: 'var(--shadow-lg), var(--shadow-inner)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Enhanced 3D Site View</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500 }}>{meta.label}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-emerald-bright)' }}><Radio size={13} aria-hidden="true" />{report.activeNodes} active node{report.activeNodes === 1 ? '' : 's'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: state.gateway.online ? 'var(--color-emerald-bright)' : 'var(--color-text-dim)' }}><ShieldCheck size={13} aria-hidden="true" />Gateway {state.gateway.online ? 'online' : 'offline'}</span>
          {scanning && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-cyan-bright)', animation: 'pulse 2s ease-in-out infinite' }}><ScanLine size={13} aria-hidden="true" />Scanning</span>}
          {state.alerts.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-red-bright)' }}><AlertTriangle size={13} aria-hidden="true" />{state.alerts.length} alert{state.alerts.length === 1 ? '' : 's'}</span>}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Canvas shadows dpr={[1, 1.75]} camera={{ position: [14.5, 10.5, 17], fov: 44, near: 0.1, far: 120 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.95; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.shadowMap.autoUpdate = true }}>
          <Suspense fallback={null}>
            <EffectComposer>
              <SSAO radius={16} samples={32} intensity={0.8} />
              <Bloom intensity={0.35} mipmapBlur={true} luminanceThreshold={0.85} luminanceSmoothing={0.025} />
              <ToneMapping mode={ACESFilmicToneMapping} />
              <Vignette darkness={0.15} offset={0.4} />
              <SiteScene reduced={reduced} zones={state.zones} nodes={state.nodes} state={state} scene={scene} selectedZone={selectedZone} selectedNode={selectedNode} onZoneClick={handleZoneClick} onNodeClick={handleNodeClick} />
            </EffectComposer>
          </Suspense>
        </Canvas>
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', padding: '8px 12px', background: 'rgba(11, 29, 21, 0.9)', border: '1px solid var(--color-border)', borderRadius: '10px', backdropFilter: 'blur(12px)', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald-bright)' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s ease-in-out infinite' }} /> Simulated Scene</span>
          <span style={{ color: 'var(--color-text-dim)' }}>Pre-programmed geometry &bull; PBR Materials &bull; Post-Processing</span>
        </div>
      </div>

      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)' }}>
        <ViewportLegend />
        <SelectionInfo activeZone={activeZone} activeNode={activeNode} latest={latest} />
      </div>
    </section>
  )
}