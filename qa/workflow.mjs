import { chromium } from 'playwright-core'
import { mkdir, readFile } from 'node:fs/promises'

const BASE = 'http://localhost:5173'
const OUT = 'qa/evidence'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--force-device-scale-factor=1', '--enable-webgl', '--ignore-gpu-blocklist'],
})

const page = await browser.newPage({ viewport: { width: 1672, height: 944 }, acceptDownloads: true })
const consoleErrors = []
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text())
})
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message))

const checks = []
function check(name, condition, detail = '') {
  checks.push({ name, pass: Boolean(condition), detail })
  if (!condition) console.log(`FAIL: ${name} ${detail}`)
}

const text = () => page.locator('body').innerText()

async function sceneNumber() {
  const t = await text()
  const m = t.match(/Scene\s+(\d+)\s*\/\s*12/)
  return m ? Number(m[1]) : null
}

async function waitScene(n, timeout = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if ((await sceneNumber()) === n) return true
    await page.waitForTimeout(150)
  }
  return false
}

async function clearToasts() {
  const closers = page.locator('.toast__close')
  for (let i = (await closers.count()) - 1; i >= 0; i -= 1) {
    await closers.nth(i).click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(250)
}

async function shot(name, clean = true) {
  if (clean) await clearToasts()
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

async function kpiValues() {
  return page.evaluate(() =>
    [...document.querySelectorAll('.rf-kpi')].map((el) => ({
      label: el.querySelector('.rf-kpi__label')?.textContent?.trim(),
      value: el.querySelector('.rf-kpi__value')?.textContent?.trim(),
    })),
  )
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)

// ================= Scene 1 =================
check('scene 1 initial', (await sceneNumber()) === 1)
check('disclaimer exact text present', (await text()).includes(
  'This is an illustrative simulation of the proposed RF FENSE workflow. Sensor events and readings are pre-programmed examples unless connected to actual hardware. The simulation does not demonstrate real radar penetration, validated survivor detection, measured accuracy, or trained machine-learning performance.',
))
check('restart visible in scene 1', await page.locator('[data-control="restart-simulation"]').isVisible())

// Rapid duplicate click: both DOM clicks fire before React re-renders.
await page.evaluate(() => {
  const button = document.querySelector('[data-control="trigger-earthquake"]')
  button.click()
  button.click()
})
await page.waitForTimeout(180)
const busyCount = await page.locator('.rf-busy-strip').count()
check('single busy indicator after rapid double click', busyCount === 1, `count=${busyCount}`)
check('scene 2 begins immediately after earthquake', (await sceneNumber()) === 2, `got ${await sceneNumber()}`)

await page.waitForTimeout(1200)
check('scene 2 during collapse animation', (await sceneNumber()) === 2, `got ${await sceneNumber()}`)
await page.waitForTimeout(2200)
await shot('scene-02-collapse')
check('scene 2 after structural collapse', (await sceneNumber()) === 2, `got ${await sceneNumber()}`)
const reached3 = await waitScene(3, 10000)
check('scene 3 after collapse + rescue arrival', reached3)
await shot('scene-03-safety')

// Verify duplicate click produced exactly one earthquake in the ledger.
await page.locator('[data-control="nav-dashboard"]').click()
await page.waitForTimeout(400)
const eqEvents = await page.evaluate(
  () => [...document.querySelectorAll('.rf-table--ledger tbody tr')].filter((tr) => tr.textContent.includes('Earthquake registered')).length,
)
check('rapid double click creates exactly one earthquake event', eqEvents === 1, `count=${eqEvents}`)
await page.locator('[data-control="nav-operation"]').click()
await page.waitForTimeout(400)

// ================= Scene 3 =================
check('safety button present', (await page.locator('[data-control="complete-safety-assessment"]').count()) === 1)
await page.locator('[data-control="complete-safety-assessment"]').click()
check('safety busy state shown', (await page.locator('.rf-busy-strip').count()) === 1)
await page.waitForSelector('[data-control="mark-safe-areas"]', { timeout: 8000 })
await page.locator('[data-control="mark-safe-areas"]').click()
check('scene 4 after marking safe areas', await waitScene(4, 8000))
await shot('scene-04-zones')

// ================= Scene 4 =================
await page.locator('[data-control="confirm-search-zones"]').click()
check('scene 5 after confirming zones', await waitScene(5, 8000))
await shot('scene-05-deployment')

// ================= Scene 5 =================
const zoneASelect = page.locator('[data-control="sensor-type-A"]')
check('sensor type select available', (await zoneASelect.count()) === 1)
await zoneASelect.selectOption('contact_microphone')
await page.locator('[data-control="deploy-sensor-nodes"]').click()
check('scene 6 after deployment', await waitScene(6, 8000))
await shot('scene-06-gateway')

// ================= Scene 6 =================
await page.locator('[data-control="connect-gateway"]').click()
await page.waitForSelector('[data-control="start-initial-scan"]', { timeout: 8000 })
await page.locator('[data-control="start-initial-scan"]').click()
check('scene 7 while scanning', await waitScene(7, 5000))
await page.waitForTimeout(500)
await shot('scene-07-scanning')
check('scene 8 after scan completes', await waitScene(8, 14000))
await page.waitForTimeout(300)
await shot('scene-08-dashboard')

// ================= Dashboard after initial scan =================
await page.locator('[data-control="nav-dashboard"]').click()
await page.waitForTimeout(500)
await shot('dashboard-after-scan')
const kpis = await kpiValues()
const kv = Object.fromEntries(kpis.map((k) => [k.label, k.value]))
check('dashboard zones = 3', kv['Search zones'] === '3', JSON.stringify(kv))
check('dashboard valid scans = 2', kv['Valid scans'] === '2', JSON.stringify(kv))
check('dashboard candidate signals = 2', kv['Candidate signals'] === '2', JSON.stringify(kv))
check('dashboard unverified = 1', kv['Unverified zones'] === '1', JSON.stringify(kv))
check('dashboard sensor failures = 0 before failure', kv['Sensor failures'] === '0', JSON.stringify(kv))
check('dashboard human verified = 0 before verification', kv['Human verified'] === '0', JSON.stringify(kv))
const batteryCells = await page.locator('.rf-table--nodes tbody tr td:nth-child(6)').allInnerTexts()
check('every node battery cell is N/A', batteryCells.length > 0 && batteryCells.every((cell) => cell.trim() === 'N/A'), batteryCells.join('|'))
check('zone C is Unverified after communication error', (await page.locator('.rf-table tbody').first().innerText()).includes('Unverified'))
await page.locator('[data-control="nav-operation"]').click()
await page.waitForTimeout(400)

// ================= Scene 8 -> 9 =================
const failureBtn = page.locator('[data-control="simulate-sensor-failure"]')
check('failure button labelled with target node', (await failureBtn.innerText()).includes('RF-03'), await failureBtn.innerText())
await failureBtn.click()
check('scene 9 after sensor failure', await waitScene(9, 8000))
await shot('scene-09-failure')
let body = await text()
check('failure alert visible', body.includes('RF-03 offline') && body.includes('remains Unverified'))
check('zone C not represented as checked', !body.includes('Zone C · Checked'))

// ================= Scene 9 -> 10 =================
const reassessBtn = page.locator('[data-control="reassess-coverage"]')
await reassessBtn.click()
check('scene 10 after reassessment', await waitScene(10, 8000))
await shot('scene-10-verification')

const rescanC = page.locator('[data-control="rescan-zone-C"]')
check('Zone C rescan disabled', await rescanC.isDisabled())
const rescanCReason = await page.locator('#rescan-zone-C-reason').innerText().catch(() => '')
check('Zone C rescan reason present', rescanCReason.includes('No connected node covers Zone C'), rescanCReason)
check('no human verified status before verification', !(await text()).includes('Zone A · Human Verified'))

// Rescan A; candidate must be preserved.
await page.locator('[data-control="rescan-zone-A"]').click()
await page.waitForTimeout(2200)
check('Zone A rescan disabled after completion', await page.locator('[data-control="rescan-zone-A"]').isDisabled())
const zoneARow = await page.locator('[data-control="select-zone-A"]').innerText()
check('Zone A keeps Possible Survivor after rescan', zoneARow.includes('Possible Survivor'), zoneARow)

// ================= Human verification gating =================
await page.locator('[data-control="open-human-verification"]').click()
await page.waitForTimeout(300)
const modal = page.locator('.rf-modal')
const modalText = await modal.innerText()
check('dialog shows retained candidate OBS-001', modalText.includes('OBS-001'), modalText.slice(0, 500))
check('dialog explains later rescan does not erase candidate', modalText.includes('does not erase the candidate'), '')
const submit = page.locator('[data-control="confirm-human-verification"]')
check('verification submit disabled initially', await submit.isDisabled())
await page.locator('[data-control="verification-name"]').fill('M. Okafor · Rescue Team 2')
check('verification submit still disabled without checkbox', await submit.isDisabled())
await page.locator('[data-control="verification-confirm-checkbox"]').check()
check('verification submit enabled after confirmation', !(await submit.isDisabled()))
await shot('verification-modal')
await submit.click()
check('scene 11 after human verification', await waitScene(11, 6000))
await shot('scene-11-extraction')

// ================= Scene 11 -> 12 =================
await page.locator('[data-control="complete-extraction"]').click()
check('scene 12 after extraction', await waitScene(12, 8000))
await shot('scene-12-report-ready')

// ================= Scene 12 report =================
await page.locator('[data-control="generate-final-report"]').click()
await page.waitForTimeout(800)
await shot('final-report')
const reportText = await text()
const reportMetrics = Object.fromEntries(
  await page.evaluate(() =>
    [...document.querySelectorAll('.rf-report-metric')].map((el) => [
      el.querySelector('span')?.textContent?.trim(),
      el.querySelector('strong')?.textContent?.trim(),
    ]),
  ),
)
check('report zones = 3', reportMetrics.Zones === '3', JSON.stringify(reportMetrics))
check('report valid scans = 2', reportMetrics['Valid scans'] === '2')
check('report candidate signals = 2', reportMetrics['Candidate signals'] === '2')
check('report unverified = 1', reportMetrics.Unverified === '1')
check('report sensor failures = 1', reportMetrics['Sensor failures'] === '1')
check('report human verified = 1', reportMetrics['Human verified'] === '1')
const outcome = await page.evaluate(() =>
  [...document.querySelectorAll('.rf-outcome-grid > div')].map((el) => ({
    label: el.querySelector('span')?.textContent?.trim(),
    value: el.querySelector('strong')?.textContent?.trim(),
    note: el.querySelector('p')?.textContent?.trim(),
  })),
)
check('demonstrated rescue Completed', outcome[0]?.value === 'Completed', JSON.stringify(outcome))
check('full search operation In Progress', outcome[1]?.value === 'In Progress', JSON.stringify(outcome))
check('unresolved zones = 2 (B and C)', outcome[2]?.value === '2' && outcome[2]?.note?.includes('Zone B') && outcome[2]?.note?.includes('Zone C'), JSON.stringify(outcome))
check('report shows prior candidate retained for Zone A', reportText.includes('Prior candidate OBS-001 retained'))
check('report shows Zone B needs verification', reportText.includes('Needs Verification'))
check('verification name recorded', reportText.includes('M. Okafor'))
check('reassessment says coverage not restored', reportText.includes('Coverage') && reportText.includes('restored: No'))
check('report disclaimer exact', reportText.includes('This is an illustrative simulation of the proposed RF FENSE workflow. Sensor events and readings are pre-programmed examples unless connected to actual hardware. The simulation does not demonstrate real radar penetration, validated survivor detection, measured accuracy, or trained machine-learning performance.'))
check('final message exact', reportText.includes('RF FENSE — Beyond Detection, Towards Reliable Rescue Search.'))
check('no invented battery percentage', !/\b\d{1,3}\s?%\s*(?:battery|charge)/i.test(reportText))

// JSON export
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 10000 }),
  page.locator('[data-control="download-report-json"]').click(),
])
const downloadPath = await download.path()
const exported = JSON.parse(await readFile(downloadPath, 'utf8'))
check('JSON export summary zones = 3', exported.summary.totalZones === 3, JSON.stringify(exported.summary))
check('JSON export valid scans = 2', exported.summary.validScanZones === 2)
check('JSON export candidate zones = 2', exported.summary.candidateSignalZones === 2)
check('JSON export candidate observations = 2', exported.summary.candidateObservationCount === 2)
check('JSON export unverified = 1', exported.summary.unverifiedZones === 1)
check('JSON export failures = 1', exported.summary.sensorFailures === 1)
check('JSON export verified = 1', exported.summary.humanVerifiedSurvivors === 1)
check('JSON export operation In Progress', exported.summary.operationStatus === 'In Progress')
check('JSON export carries disclaimer', exported.disclaimer.includes('pre-programmed examples'))
check('JSON export node battery null', exported.nodes.every((n) => n.batteryStatus === null))

// ================= About =================
await page.locator('[data-control="nav-about"]').click()
await page.waitForTimeout(400)
await shot('about')
const aboutText = await text()
check('about states radar penetration is not demonstrated', aboutText.includes('Real radar penetration through concrete, soil or rubble.'))
check('about lists 12 scenes', (await page.locator('.rf-scene-list li').count()) === 12)

// ================= Restart =================
await page.locator('[data-control="restart-simulation"]').click()
await page.waitForTimeout(900)
check('restart returns to scene 1', (await sceneNumber()) === 1)
await page.locator('[data-control="nav-operation"]').click()
await page.waitForTimeout(400)
const restartStatuses = await page.evaluate(() =>
  [...document.querySelectorAll('.rf-zone-row .rf-status')].map((el) => el.textContent.trim()),
)
check('restart resets all zones to Not Checked', restartStatuses.length === 3 && restartStatuses.every((s) => s === 'Not Checked'), restartStatuses.join('|'))
check('restart clears alerts', (await text()).includes('0 alerts'))
const restartNodes = await page.locator('.rf-zone-row').allInnerTexts()
check('restart removes nodes from zone rows', restartNodes.every((row) => row.includes('No node')), restartNodes.join(' || '))
await shot('after-restart')

// ================= Responsive + reduced motion =================
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await mobile.goto(BASE, { waitUntil: 'networkidle' })
await mobile.waitForTimeout(1800)
const mobileInfo = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  scrollHeight: document.documentElement.scrollHeight,
  canvas: Boolean(document.querySelector('canvas')),
}))
check('mobile no horizontal overflow', mobileInfo.scrollWidth <= mobileInfo.innerWidth, JSON.stringify(mobileInfo))
await mobile.screenshot({ path: `${OUT}/mobile-scene-01.png` })

const tablet = await browser.newPage({ viewport: { width: 820, height: 1180 } })
await tablet.goto(BASE, { waitUntil: 'networkidle' })
await tablet.waitForTimeout(1800)
const tabletInfo = await tablet.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  canvas: Boolean(document.querySelector('canvas')),
}))
check('tablet no horizontal overflow', tabletInfo.scrollWidth <= tabletInfo.innerWidth, JSON.stringify(tabletInfo))
await tablet.screenshot({ path: `${OUT}/tablet-scene-01.png` })

const reduced = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
await reduced.goto(BASE, { waitUntil: 'networkidle' })
await reduced.waitForTimeout(1200)
const reducedInfo = await reduced.evaluate(() => ({
  matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}))
check('reduced motion respected without layout break', reducedInfo.matches && reducedInfo.scrollWidth <= reducedInfo.innerWidth, JSON.stringify(reducedInfo))
await reduced.screenshot({ path: `${OUT}/reduced-motion-scene-01.png` })

check('no console/page errors', consoleErrors.length === 0, consoleErrors.join(' | '))

const failed = checks.filter((c) => !c.pass)
console.log('\n=== E2E RESULT ===')
console.log(JSON.stringify({ kpis, reportMetrics, outcome, checks, consoleErrors }, null, 2))
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`)
if (failed.length) {
  console.log('FAILED:', failed.map((f) => f.name).join(' | '))
  process.exitCode = 1
}

await browser.close()
