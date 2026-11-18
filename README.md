# RF FENSE — Disaster-to-Rescue Search Simulation & 3D Building Inspection Lab

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-cyan.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.181-green.svg)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple.svg)](https://vitejs.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Passed-brightgreen.svg)](https://playwright.dev/)

> **RF FENSE — Beyond Detection, Towards Reliable Rescue Search.**

RF FENSE is an interactive disaster-to-rescue search simulation system designed to illustrate how a modular RF sensor network, edge telemetry, and central gateway can assist rescue teams during catastrophic urban building-collapse incidents.

---

## ⚠️ Important Simulation Disclaimer

> **This is an illustrative simulation of the proposed RF FENSE workflow.**  
> Sensor events and readings are pre-programmed examples unless connected to actual hardware. The simulation **does not demonstrate** real radar penetration through concrete or rubble, validated survivor detection, real breathing measurements, trained machine-learning performance, or measured accuracy. The rescue team remains responsible for all physical verification, extraction, and medical decisions.

---

## 🌟 Merged System Architecture

The project unifies two cohesive operational capabilities into a single seamless experience:

### 1. RF FENSE 12-Scene Mission Workflow (`src/rf/`)
A chronological, state-driven search-and-rescue operation with strict safety and human-in-the-loop invariants:
1. **Scene 01 — Normal Building:** 5-storey residential block with occupants and environment. Primary control: `Trigger Earthquake` (duplicate-click locked).
2. **Scene 02 — Earthquake & Collapse:** Ground-shaking dynamics, progressive structural fracture, dust plume, and rubble scatter.
3. **Scene 03 — Rescue Arrival & Safety Assessment:** Evaluates structural, fire/gas, electrical, and access hazards; marks approved safe deployment points (A1, B1, C1) and rejects hazardous areas (C2, C3).
4. **Scene 04 — Create Search Zones:** Defines search zones (A, B, C), each initialized to `Not Checked`.
5. **Scene 05 — Sensor Selection & Deployment:** Operator assigns modular sensors (FMCW Radar, Geophone, Contact Mic, Thermal Camera, Borescope). Deploys nodes with unique IDs and honest `N/A` battery status.
6. **Scene 06 — Central Gateway Communication:** Visualizes local central gateway (`RF FENSE — Central Gateway`) with animated RF comm rays.
7. **Scene 07 — Start Scanning & Illustrative Events:** Sequential scanning cycle:
   - *Zone A (RF-01):* Periodic micro-motion candidate $\rightarrow$ `Possible Survivor`.
   - *Zone B (RF-02):* Intermittent knocking vibration $\rightarrow$ `Needs Verification`.
   - *Zone C (RF-03):* Communication error frame $\rightarrow$ `Unverified`.
8. **Scene 08 — Rescue Dashboard:** Real-time KPI matrix, zone grid, node health, and chronological event ledger.
9. **Scene 09 — Sensor Failure Demonstration:** Node RF-03 goes offline. Zone C is marked `Unverified` (*"A failed sensor is never treated as evidence that an area is empty"*). Reassessment confirms alternative positions are blocked.
10. **Scene 10 — Rescan & Human Verification:** Rescan Zone A preserves candidate `OBS-001`. Zone C rescan is disabled with reason shown. `Verify Possible Survivor` opens human verification modal requiring responder name and confirmation checkbox.
11. **Scene 11 — Survivor Extraction & Medical Assistance:** Visualizes safe access clearing, controlled debris removal, medical assessment, and transport prep.
12. **Scene 12 — Final Search Report:** Derives report metrics dynamically from the event ledger: **3 Zones, 2 Valid Scans, 2 Candidate Signals, 1 Unverified Zone, 1 Sensor Failure, 1 Human Verified Survivor**. Correctly distinguishes *Demonstrated Rescue: Completed* from *Full Search Operation: In Progress*.

### 2. 3D Building Inspection Lab (`src/components/`)
An interactive WebGL Three.js building inspection interface accessible via the **3D Building Lab** tab in the navigation bar:
- **Interactive Collapse Viewport:** Multi-angle camera presets (Isometric, Top-Down, Street, Sensor-Lock), orbital controls, and post-processing bloom.
- **Floor Isolation:** Toggle between All Floors or isolate individual floors (Floors 1 to 5).
- **Volumetric Sensor Cones:** 3D radar sweep cones, laser triangulation lines, and survivor thermal signature pulses.
- **Signal Inspection Modal:** Live HTML5 Canvas FFT spectrogram analyzer, SNR readout, and frequency/gain tuning.
- **Victim Triage Dossier:** Survivor vital signs, acoustic knocking audio playback, and rescue extraction checklist.

### 3. Procedural Tactical Audio Engine (`src/utils/audio.ts`)
Zero-asset Web Audio API procedural synthesizer:
- **Seismic Rumble:** Low-frequency frequency-modulated sawtooth wave for earthquake shaking.
- **Radar Sweep Ping:** Bandpass-filtered doppler chirps during active sensor sweeps.
- **Micro-Motion Heartbeat:** Bi-phasic sub-bass pulse representing candidate survivor vital patterns.
- **Acoustic Knocking:** Triple-strike bandpass resonance simulation.
- **Failure Alarm:** Dual-tone frequency warning for node disconnection and communication errors.
- **Resolution Chimes:** Multi-tone harmonic telemetry chords for stage transitions and rescue completion.
- Accessible global mute toggle and volume control via TopBar and Settings dialog.

---

## 📁 Project Structure

```
├── docs/
│   └── RF_FENSE_IMPLEMENTATION_AUDIT.md  # Detailed technical audit and specifications
├── public/
│   └── favicon.svg                       # Vector shield brand icon
├── qa/
│   ├── evidence/                         # 19 automated E2E test verification screenshots
│   ├── measure.mjs                       # Layout measurement & typography regression test
│   ├── smoke.mjs                         # Browser smoke check
│   └── workflow.mjs                      # Comprehensive 78-check E2E workflow test runner
├── src/
│   ├── components/                       # 3D Building Lab, modals & UI primitives
│   │   ├── modals/                       # Sensor inspection, victim triage, settings, shortcuts
│   │   ├── scene/                        # Three.js building geometry, particles, rubble, towers
│   │   ├── ui/                           # Accessible Radix UI components (dialog, tabs, etc.)
│   │   └── SimulationDashboard.tsx       # 3D Building collapse dashboard
│   ├── rf/                               # RF FENSE 12-Scene Mission Workflow
│   │   ├── components/                   # Views (Operation, Dashboard, Report, About, 3D Scene)
│   │   ├── data.ts                       # Scene definitions, safety checks, sensor metadata
│   │   ├── engine.ts                     # Pure reducer, state selectors, report derivations
│   │   ├── RfApp.tsx                     # Unified application shell
│   │   ├── RfFenseContext.tsx            # Single source of truth state provider & audio wiring
│   │   └── types.ts                      # Domain TypeScript interfaces
│   ├── styles/                           # Design tokens, Hallmark styling & responsive breakpoints
│   ├── utils/
│   │   └── audio.ts                      # Procedural Web Audio API sound synthesizer
│   ├── App.tsx                           # Root component mounting RfApp
│   └── main.tsx                          # Application bootstrap and font loading
└── package.json                          # Scripts & dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Type Check
```bash
npm run typecheck
```

### Production Build
```bash
npm run build
```

### Run End-to-End Test Suite
Ensure the dev server is running on port 5173, then run:
```bash
node qa/workflow.mjs
```
*All 78 assertions pass with 0 console errors, capturing full visual evidence in `qa/evidence/`.*

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `?` | Open Keyboard Shortcuts Dialog |
| `M` | Toggle Tactical Audio Mute |
| `Space` | Advance or Trigger Active Workflow Action |
| `Esc` | Close Active Modal or Clear Selection |

---

## 📜 License
Private research demonstration.
