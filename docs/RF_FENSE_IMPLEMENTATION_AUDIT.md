# RF FENSE — Implementation Audit

**Project:** Aftershock / RF FENSE disaster-to-rescue simulation
**Audit date:** 18 November 2026
**Application status:** Implemented, typechecked, built and exercised end-to-end in Chrome
**Scope of this document:** What was preserved, what was built, how state and honesty rules are enforced, and the real test evidence collected for this implementation.

---

## 1. Executive summary

The existing React 19 + Vite + TypeScript + react-three-fiber application was preserved and extended rather than replaced. The previous "Aftershock" source tree remains in place. The shipped entry point now renders a new 12-scene RF FENSE workflow implemented under `src/rf/`, with its own stylesheet at `src/styles/rf.css`.

The implementation provides:

- 12 explicit workflow scenes with gated transitions.
- 13 primary in-scene controls plus global navigation, restart, report generation, JSON export and print controls.
- A single simulation state tree and a chronological event ledger. Dashboard and report statistics are derived from that tree; no statistic is typed into the UI independently.
- A deterministic default path: Zone A possible survivor, Zone B needs verification, Zone C unverified because Node RF-03 returned a communication error and later fails.
- The required default-path outcome: **3 zones / 2 valid scans / 2 candidate signals / 1 unverified / 1 sensor failure / 1 human verified**.
- Explicit human-only verification: `Human Verified` cannot be set by sensor data or by a timer.
- Honest failure semantics: a failed sensor produces `Unverified`, never `Checked` and never “empty”.
- Battery status is always `N/A`; no battery percentages or invented confidence values are generated.
- A persistent exact disclaimer in the application shell, report, About view and JSON export.
- Responsive layouts at desktop, laptop, tablet and mobile widths, keyboard-focus containment in dialogs, and reduced-motion handling for CSS and the 3D scene.

No real radar, sensor, ML, survivor-detection or field-performance capability is claimed.

---

## 2. Existing project analysis

The repository at `C:\Users\lucky\OneDrive\Desktop\demo pal` was a working Vite/React demo named `aftershock-urban-rescue`.

Observed before modification:

- React 19.2, React DOM 19.2, TypeScript 5.9, Vite 7.2.
- `@react-three/fiber` 9.4, `@react-three/drei` 10.7, `three` 0.181.
- `lucide-react` icons, local `@fontsource` Inter and Space Grotesk fonts.
- A CSS design system split across `base.css`, `layout.css`, `overlays.css`, `views.css` and `responsive.css`.
- An older simulation under `src/simulation`, `src/state`, `src/data` and `src/components`, with its own context, viewport, workflow sidebar, scenario view, report view and toasts.
- Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck`. No lint script and no unit-test framework.
- The baseline application built and typechecked before changes.
- No git repository, no README and no `AGENTS.md` were present.

Decision: do not delete or rewrite the old simulation. Keep it compiling, mount the new implementation at `src/App.tsx`, and add the new CSS import at the end of the existing cascade. This preserves the previous work while making RF FENSE the active product.

The original stack, tokens, fonts and visual language were retained. No new UI framework, state library, router or charting package was added.

---

## 3. Architecture

### 3.1 Source layout

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Mounts `RfApp`. |
| `src/main.tsx` | Imports fonts and global CSS; wraps the app in `RfFenseProvider`. |
| `src/rf/types.ts` | Domain types: incident, safety, zones, nodes, observations, events, alerts, reassessments, verifications, extraction, report. |
| `src/rf/data.ts` | Scene metadata, zone definitions, sensor types, safe areas, safety checks, reassessment alternatives, default sensor configuration. |
| `src/rf/engine.ts` | Pure reducer, scene derivation, selectors, report derivation, formatting helpers. |
| `src/rf/RfFenseContext.tsx` | The single provider. Owns state, dispatch, timers, busy lock, navigation, modal state, toasts and restart. |
| `src/rf/RfApp.tsx` | Application shell: header, navigation, disclaimer, scene ribbon, views, footer, toasts and modals. |
| `src/rf/components/OperationView.tsx` | Scene workspace: 3D viewport, action panel, situation panel. |
| `src/rf/components/TopBar.tsx` | Brand, navigation, scene counter, mission clock and restart. |
| `src/rf/components/WorkflowRail.tsx` | The 12-scene progress rail and scene gating indicators. |
| `src/rf/components/ZoneMap.tsx` | SVG site map used by the dashboard (one of the two site views). |
| `src/rf/components/DashboardView.tsx` | KPIs, zone table, node table, gateway panel, alerts and event ledger. |
| `src/rf/components/ReportView.tsx` | Final report, metrics, outcome distinction, JSON export and print. |
| `src/rf/components/AboutView.tsx` | Scope, honest limitations and the 12-scene list. |
| `src/rf/components/RfScene3D.tsx` | Stylised three.js site scene, node/zone markers, gateway, extraction cue, reduced-motion handling. |
| `src/rf/components/ActionPanel.tsx` | Scene-gated controls, disabled reasons, progress and confirmation copy. |
| `src/rf/components/VerificationModal.tsx` | Human verification dialog and gating. |
| `src/rf/components/ObservationModal.tsx` | Gateway-check review dialog for an observation. |
| `src/rf/components/useDialogFocus.ts` | Dialog focus containment and focus restoration. |
| `src/styles/rf.css` | RF FENSE layout, components, responsive breakpoints, reduced motion and print styles. |
| `qa/workflow.mjs` | Browser-driven E2E workflow and assertions. |
| `qa/evidence/` | Screenshots produced by the E2E run. |

### 3.2 State flow

```
user control
   -> RfFenseContext action
      -> busy lock (duplicate-click protection)
         -> reducer action with mission timestamp
            -> single RfState tree + event ledger
               -> deriveScene(state) -> active scene
               -> getReport(state)  -> KPIs / report / export
                  -> Operation, Dashboard, Report, 3D view, modals
```

There is one provider and one state object. Scene number and phase are **derived** from milestone timestamps and records; they are not separately stored and cannot diverge from the ledger.

Reducer actions are pure: `EARTHQUAKE`, `COLLAPSE_START`, `COLLAPSE_COMPLETE`, `RESCUE_START`, `SAFETY_COMPLETE`, `SAFE_AREA_MARK`, `ZONES_CONFIRM`, `SET_CONFIG`, `DEPLOY`, `GATEWAY_CONNECTED`, `SCAN_START`, `SCAN_STEP`, `SCAN_COMPLETE`, `SENSOR_FAILURE`, `REASSESSMENT_COMPLETE`, `RESCAN_COMPLETE`, `VERIFY_SURVIVOR`, `EXTRACTION_COMPLETE`, `REPORT_GENERATED`, `RESTART`.

Identifiers are sequential and stable: `EVT-###`, `OBS-###`, `ALT-###`, and node IDs `RF-01`, `RF-02`, `RF-03`. The pre-programmed failure targets node sequence 3 (Zone C), not a hard-coded node ID, so the failure remains correct if the default sensor configuration changes.

### 3.3 Timers and duplicate-click protection

Long-running actions use `runAsync`, which takes a synchronous `lockRef` lock **before** setting busy state. This is stronger than disabling a button in JSX: two clicks dispatched in the same event-loop turn cannot both start an action. Timers are tracked in a set, cleared on unmount and invalidated by a generation counter on restart. Restart also releases the lock and clears toasts, selections and open dialogs.

The E2E test deliberately calls `button.click()` twice synchronously and verifies both one busy indicator and exactly one `Earthquake registered` ledger event.

---

## 4. The 12 scenes

Scene selection is implemented in `deriveScene`:

| Scene | Title | Entry condition | Primary control(s) | Exit condition |
| --- | --- | --- | --- | --- |
| 1 | Normal Building | No earthquake timestamp | Trigger Earthquake | `earthquakeAt` set |
| 2 | Earthquake & Collapse | Earthquake set, collapse or rescue incomplete | Automatic; no manual action | `collapseCompleteAt` and `rescueArrivalAt` set (~4.3 s) |
| 3 | Rescue Arrival & Safety | Collapse and rescue complete, safe areas not marked | Complete Safety Assessment → Mark Approved Safe Areas | `safety.markedAt` set |
| 4 | Create Search Zones | Safety marked, zones unconfirmed | Confirm Search Zones | `zonesConfirmedAt` set |
| 5 | Sensor Deployment | Zones confirmed, no deployment | Assign sensor types → Deploy Sensor Nodes | `deploymentAt` set |
| 6 | Central Gateway | Deployment done, gateway offline or scan not started | Connect Central Gateway → Start Initial Scan | Gateway online and `scanning.startedAt` set |
| 7 | Scanning & Events | Scan started, not complete | Automatic node-by-node scan | `scanning.completedAt` set |
| 8 | Rescue Dashboard | Scan complete, no failure recorded | Review Rescue Dashboard (optional) → Simulate Sensor Failure | `failureNodes.length > 0` |
| 9 | Sensor Failure | Failure recorded, no reassessment | Reassess Coverage Options | `reassessments.length > 0` |
| 10 | Rescan & Verification | Reassessment recorded, no verification | Rescan A/B (optional), gated Rescan C, Record Human Verification | `verifications.length > 0` |
| 11 | Extraction & Medical | Verification recorded, no extraction | Complete Extraction & Medical Handover | `extraction` set |
| 12 | Final Search Report | Extraction complete | Generate/Open Final Report, restart | Terminal; global restart available |

All 12 scenes were exercised in one browser run, in order, with screenshots retained under `qa/evidence/` (`scene-01-normal.png`, `scene-02-collapse.png` … `scene-12-report-ready.png`).

---

## 5. Primary controls

The workflow contains **13 primary in-scene controls** (with the three sensor selectors and the three rescan buttons treated as one control family each):

| # | Control | Scene(s) | Behaviour and gating |
| --- | --- | --- | --- |
| 1 | Trigger Earthquake | 1 | Starts the staged collapse sequence. Duplicate-locked. |
| 2 | Complete Safety Assessment | 3 | Runs four illustrative hazard checks; 1.8 s busy state. |
| 3 | Mark Approved Safe Areas | 3 | Approves A1/B1/C1 and rejects C2/C3. |
| 4 | Confirm Search Zones | 4 | Creates three zones, all `Not Checked`. |
| 5 | Assign Sensor Types | 5 | Per-zone selects. Changes hardware label only; explicitly disclosed as outcome-neutral. |
| 6 | Deploy Sensor Nodes | 5 | Creates `RF-01`…`RF-03` at approved areas; battery is `N/A`. |
| 7 | Connect Central Gateway | 6 | Registers nodes and records gateway checks; local communication only. |
| 8 | Start Initial Scan | 6 | Starts the pre-programmed node-by-node scan. |
| 9 | Simulate Sensor Failure | 8 | Injects failure at node sequence 3 (Zone C); sets `Unverified` and raises a persistent alert. |
| 10 | Reassess Coverage Options | 9 | Records C2/C3 rejection and confirms coverage cannot be restored. |
| 11 | Rescan Zone A/B/C | 10 | A and B disabled after one rescan or when no connected node covers the zone; C is permanently gated with a visible reason. |
| 12 | Record Human Verification | 10 | Opens a dialog requiring a personnel name, a confirmation checkbox and a method; only then can Zone A become `Human Verified`. |
| 13 | Complete Extraction & Medical Handover | 11 | Records illustrative extraction and handover events, with no clinical claim. |

Global/report controls (not counted above): navigation, `Restart`, `Restart from this scene`, `Generate Final Search Report`, `Download JSON`, and `Print / PDF`. Report generation is available only after extraction; the report remains readable as a preliminary draft before that.

---

## 6. Default path and honesty rules

### 6.1 Pre-programmed observations

| Node | Zone | Pre-programmed result | Zone status |
| --- | --- | --- | --- |
| RF-01 | A · South-east rubble void | Low-amplitude periodic micro-motion candidate (illustrative) | `Possible Survivor` |
| RF-02 | B · West wing accessible void | Intermittent knocking-like pattern, ambiguous source | `Needs Verification` |
| RF-03 | C · Rear service corridor | Error frame with **no measurement payload** | `Unverified` |

The scan processes one node every ~1.15 s. RF-03's communication error creates a warning alert and a zone note stating that the zone is unverified, not empty.

The later `Simulate Sensor Failure` action sets RF-03 offline and disconnected, sets signal quality to `unknown`, battery to `null`, and preserves the zone as `Unverified`. The alert text states: *“A failed sensor is not evidence that the area is empty.”*

### 6.2 Enforced rules

1. **No failed-sensor-as-empty inference.** `setZoneStatus` is never called with `checked` for a communication error or failure. RF-03's zone cannot be rescanned because no connected node covers it; the control is disabled with the reason shown and also has a guard in the context action.
2. **No automatic human verification.** `VERIFY_SURVIVOR` is only dispatched by the verification dialog after a non-empty name and the explicit confirmation checkbox. The reducer rejects verification unless the zone is currently `possible_survivor` or `needs_verification`.
3. **Retained candidate.** A rescan appends a `no_candidate` observation but does not overwrite the accepted candidate. The verification dialog shows `OBS-001` (the candidate under review), notes the later rescan, and the report row adds “Prior candidate OBS-001 retained”.
4. **Battery honesty.** Node battery telemetry is not simulated. The node table, scene 9 alert, dashboard and export all use `N/A` / `null`. No percentage is invented.
5. **No confidence fabrication.** Signal quality uses qualitative labels (`good`, `fair`, `unknown`) only. No accuracy, probability, precision or recall figures appear.
6. **No radar/ML claims.** The 3D scene is labelled “Stylised reconstruction · not a LIDAR, structural or radar model”. The About view lists real radar penetration, validated detection, measured accuracy and trained ML as not demonstrated.
7. **Operation status distinction.** The report separates “Demonstrated rescue · Completed” from “Full search operation · In Progress”, because Zones B and C remain unresolved. Completing one rescue does not close the search.
8. **Sensor choice is illustrative.** The deployment scene states that sensor selection changes the hardware label only and does not alter pre-programmed observations or outcomes.

### 6.3 Persistent disclaimer

The exact required text is defined once in `DisclaimerBanner.tsx` and reused by the report and JSON export:

> This is an illustrative simulation of the proposed RF FENSE workflow. Sensor events and readings are pre-programmed examples unless connected to actual hardware. The simulation does not demonstrate real radar penetration, validated survivor detection, measured accuracy, or trained machine-learning performance.

It appears in the persistent application banner, the final report, the JSON export and the About view. The final line is:

> **RF FENSE — Beyond Detection, Towards Reliable Rescue Search.**

---

## 7. Metrics and ledger

`getReport(state)` derives every headline figure from accepted observations and current records:

| Metric | Derivation | Default final value |
| --- | --- | --- |
| Zones | `state.zones.length` | 3 |
| Valid scans | Unique zones with at least one accepted observation | 2 (A, B) |
| Candidate signals | Accepted `possible_survivor` + `needs_verification` observations | 2 |
| Unverified | Zones whose current status is `unverified` | 1 (C) |
| Sensor failures | Nodes with `health === 'offline'` | 1 (RF-03) |
| Human verified | `state.verifications.length` | 1 (Zone A) |
| Operation status | `In Progress` unless extraction is complete and no unresolved zones remain | In Progress |
| Demonstrated rescue | Extraction present | Completed |
| Unresolved zones | Zones still `not_checked`, `possible_survivor`, `needs_verification` or `unverified` | Zone B, Zone C |

The JSON export includes the disclaimer, incident, summary, zones, nodes, observations, events, alerts, reassessments, verifications and extraction. The E2E test downloads and parses this file, verifying the summary values, `operationStatus`, `demonstratedRescueStatus` and that every node has `batteryStatus: null`.

The dashboard event ledger is rendered from `state.events` in order. No parallel “display-only” history exists.

---

## 8. Accessibility and responsive behaviour

Implemented:

- Semantic landmarks, headings and tables with scoped headers.
- Visible `aria-describedby` reasons for disabled controls.
- `aria-live` busy/progress messaging and toasts.
- Modals use `role="dialog"`, `aria-modal`, labelled/described headers, Escape close, focus containment and focus restoration (`useDialogFocus`).
- Keyboard-selectable zone labels/node markers in the 3D view via HTML overlay buttons rather than pointer-only 3D picks.
- Reduced motion:
  - CSS animations are disabled or shortened under `prefers-reduced-motion: reduce`.
  - Camera drift, shaking, pulse rings, scan pulses, failure pulse, gateway ring and extraction travel are gated. Static ring sizes remain visible so state is not lost.
- Responsive breakpoints at 1640, 1400, 1180, 1000, 860, 720 and 520 px.
- `overflow-x` checks passed at 1672, 820, 390 and 1280 px.
- Print stylesheet for the report.

Not claimed: a formal WCAG conformance audit or screen-reader testing. See limitations.

---

## 9. Verification evidence

### 9.1 Commands actually run

| Command | Result |
| --- | --- |
| `npm run typecheck` | **Pass** (`tsc -b --pretty`, no diagnostics) |
| `npm run build` | **Pass** (`tsc -b && vite build`, 1732 modules, built in 2.67 s) |
| `node qa/workflow.mjs` | **78/78 checks passed**, no console or page errors |
| Browser smoke test | App title, 3D canvas, disclaimer, scene 01, no errors |

Build output notes:

- `dist/assets/index-CD4ZLCGn.js` — 1,266.12 kB (354.80 kB gzip).
- `dist/assets/index-B23uXqNK.css` — 126.79 kB (22.32 kB gzip).
- Vite emits the standard “chunks larger than 500 kB” warning because three.js is bundled. This is a performance/maintenance limitation, not a build failure.

### 9.2 End-to-end coverage

The workflow script drives the real application in headless Chrome and asserts:

- Scene 1 defaults, exact disclaimer, restart availability.
- Rapid double click → one busy indicator and exactly one earthquake event.
- Scene 2 → Scene 3 automatic timing, including confirmation that the collapsed-structure state remains Scene 2 before rescue arrival.
- Safety assessment and safe-area steps, including busy state.
- Zone confirmation, sensor selection, deployment, gateway connection, initial scan, scanning progress.
- Dashboard KPIs after scan: 3 zones, 2 valid scans, 2 candidate signals, 1 unverified, 0 failures, 0 verified.
- All three node battery cells exactly `N/A`.
- Zone C `Unverified` after the communication error.
- Failure control targets `RF-03`; scene 9 alert; Zone C is not shown as checked.
- Reassessment; Zone C rescan disabled with the exact reason; no automatic verification.
- Zone A rescan preserves `Possible Survivor`; verification dialog shows retained `OBS-001` and explains the later rescan.
- Verification cannot submit without both name and checkbox; submission advances to Scene 11.
- Extraction advances to Scene 12.
- Report metrics exactly 3 / 2 / 2 / 1 / 1 / 1.
- Demonstrated rescue `Completed`; full search `In Progress`; 2 unresolved zones (B, C).
- Prior candidate retained for Zone A; Zone B needs verification; verification name recorded; reassessment says coverage not restored.
- Exact report disclaimer and exact final message.
- No invented battery percentage.
- JSON export values and null batteries.
- About lists 12 scenes and the radar limitation.
- Restart returns to Scene 1, all zones `Not Checked`, nodes removed, alerts cleared.
- Mobile (390 px) and tablet (820 px) have no horizontal overflow.
- Reduced-motion page (1280 px) matches `prefers-reduced-motion: reduce` and does not break layout.
- Zero console/page errors across the run.

### 9.3 Screenshots

`qa/evidence/` contains:

```
about.png
after-restart.png
dashboard-after-scan.png
final-report.png
mobile-scene-01.png
reduced-motion-scene-01.png
scene-01-normal.png
scene-02-collapse.png
scene-03-safety.png
scene-04-zones.png
scene-05-deployment.png
scene-06-gateway.png
scene-07-scanning.png
scene-08-dashboard.png
scene-09-failure.png
scene-10-verification.png
scene-11-extraction.png
scene-12-report-ready.png
tablet-scene-01.png
verification-modal.png
```

The final report screenshot shows the required 3 / 2 / 2 / 1 / 1 / 1 metrics, “Demonstrated rescue Completed”, “Full search operation In Progress”, and unresolved zones B and C.

### 9.4 Test harness caveat

Before the final run, one assertion failed because its selector also captured the “Last seen” column in the battery check. The selector was corrected to `td:nth-child(6)`. The application data was already correct (`N/A` for all batteries). The final run passes all 78 checks. This document reports the failure and the correction rather than hiding it.

---

## 10. Known limitations

1. **Illustrative data only.** Every sensor reading, event, timestamp and outcome is pre-programmed. No hardware, radar, acoustic sensor, gateway or field measurement is connected.
2. **No real detection or ML.** The application does not implement or benchmark radar penetration, survivor detection, accuracy, precision, recall, model training or inference.
3. **Single-browser evidence.** E2E coverage uses locally installed Google Chrome via `playwright-core`. Firefox, Safari/WebKit and real mobile devices were not tested.
4. **No automated unit tests or lint.** The repository has no unit-test framework and no lint script. Correctness evidence is the strict TypeScript build plus the browser workflow. A dedicated unit-test suite for the reducer would be a sensible next step.
5. **No persistence.** Reloading the page resets the simulation. There is no backend, database or saved session.
6. **Bundle size.** three.js makes the single JS chunk ~1.27 MB (355 kB gzip), triggering Vite's 500 kB warning. Route/component-level code splitting could reduce the initial payload.
7. **Accessibility is implemented but not certified.** Focus management, labels, live regions and reduced motion are present, but there was no formal WCAG audit, screen-reader test or expert accessibility review.
8. **Print/PDF not browser-verified.** Print CSS exists, but the print dialog/PDF output was not part of the automated evidence.
9. **3D scene is stylistic.** Geometry, dust, rubble and node placement are illustrative and explicitly not a structural, LIDAR or radar model.
10. **Timing is demonstrative.** The 0.85–4.3 s action timings and 1.15 s scan cadence are UI pacing choices, not performance claims.
11. **Legacy code retained.** The old Aftershock components and simulation remain in `src/` because the brief asked not to rebuild unnecessarily or delete working functionality. They are not mounted by the new entry point but still participate in TypeScript compilation.
12. **Sensor choice is deliberately outcome-neutral.** Changing a sensor type does not change the pre-programmed readings. This is disclosed in the UI but means the control is illustrative rather than a model of hardware trade-offs.
13. **Node battery and confidence are unavailable by design.** `N/A` and qualitative signal labels are honest gaps, not measurements.

---

## 11. File inventory

### Added — application

```
src/rf/types.ts
src/rf/data.ts
src/rf/engine.ts
src/rf/RfFenseContext.tsx
src/rf/RfApp.tsx
src/rf/components/AboutView.tsx
src/rf/components/ActionPanel.tsx
src/rf/components/DashboardView.tsx
src/rf/components/DisclaimerBanner.tsx
src/rf/components/MissionBanner.tsx
src/rf/components/ObservationModal.tsx
src/rf/components/OperationView.tsx
src/rf/components/ReportView.tsx
src/rf/components/RfScene3D.tsx
src/rf/components/RfToasts.tsx
src/rf/components/SituationPanel.tsx
src/rf/components/TopBar.tsx
src/rf/components/VerificationModal.tsx
src/rf/components/WorkflowRail.tsx
src/rf/components/ZoneMap.tsx
src/rf/components/common.tsx
src/rf/components/useDialogFocus.ts
src/styles/rf.css
```

### Added — verification

```
qa/workflow.mjs
qa/scene01.mjs
qa/smoke.mjs
qa/measure.mjs
qa/screenshot.mjs
qa/evidence/*.png
docs/RF_FENSE_IMPLEMENTATION_AUDIT.md
```

### Modified

```
src/App.tsx          -> mounts RfApp
src/main.tsx         -> wraps App in RfFenseProvider
src/styles/index.css -> imports rf.css after the existing cascade
index.html           -> RF FENSE title, description, theme colour
package.json         -> playwright-core dev dependency (browser verification)
```

### Preserved unchanged

```
src/components/*          (Aftershock UI)
src/data/*                (Aftershock data)
src/simulation/*          (Aftershock simulation)
src/state/*               (Aftershock state)
src/styles/base.css
src/styles/layout.css
src/styles/overlays.css
src/styles/responsive.css
src/styles/views.css
```

---

## 12. Final assessment

The implementation satisfies the functional workflow, the default-path figures, the human-verification gate, the failure semantics and the honesty constraints. Typecheck and production build pass. The browser workflow passes 78/78 assertions with no console errors, including JSON export and responsive/reduced-motion checks.

It remains an **illustrative workflow simulation**, not an operational rescue system. The most important open work is not cosmetic: add reducer unit tests, verify in additional browsers, consider code splitting for three.js, and commission an accessibility review before any public demonstration.

**RF FENSE — Beyond Detection, Towards Reliable Rescue Search.**
