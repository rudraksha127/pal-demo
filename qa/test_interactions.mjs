import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const OUT = 'qa/evidence_test'
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--force-device-scale-factor=1', '--enable-webgl', '--ignore-gpu-blocklist'],
})

const page = await browser.newPage({ viewport: { width: 1672, height: 944 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(`PAGEERROR ${err.message}`))

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// 1. Initial screenshot
await page.screenshot({ path: `${OUT}/01-initial-simulation.png` })

// 2. Open Sensor Inspection Dialog by clicking the Radar sensor card
const radarCard = page.locator('.sensor-card').first()
await radarCard.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/02-sensor-dialog.png` })

// Close dialog
const closeBtn = page.locator('.shadcn-dialog-close').first()
if (await closeBtn.isVisible()) {
  await closeBtn.click()
  await page.waitForTimeout(500)
}

// 3. Open Survivor Triage Dossier Dialog by clicking the Potential Victim card
const victimCard = page.locator('.victim-card')
await victimCard.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/03-victim-dialog.png` })

// Close victim dialog
const closeVictimBtn = page.locator('.shadcn-dialog-close').first()
if (await closeVictimBtn.isVisible()) {
  await closeVictimBtn.click()
  await page.waitForTimeout(500)
}

// 4. Switch to Floor Plan view
const planTab = page.locator('.shadcn-tabs-trigger', { hasText: 'Floor Plan' })
if (await planTab.isVisible()) {
  await planTab.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${OUT}/04-floor-plan.png` })
}

// Switch back to 3D View
const view3dTab = page.locator('.shadcn-tabs-trigger', { hasText: '3D View' })
if (await view3dTab.isVisible()) {
  await view3dTab.click()
  await page.waitForTimeout(1000)
}

// 5. Test Analysis Tab
const analysisNav = page.locator('.nav-item', { hasText: 'Analysis' })
await analysisNav.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/05-analysis-tab.png` })

// 6. Test Report Tab
const reportNav = page.locator('.nav-item', { hasText: 'Report' })
await reportNav.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/06-report-tab.png` })

// 7. Test Scenarios Tab
const scenariosNav = page.locator('.nav-item', { hasText: 'Scenarios' })
await scenariosNav.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/07-scenarios-tab.png` })

// 8. Return to Simulation Tab
const simNav = page.locator('.nav-item', { hasText: 'Simulation' })
await simNav.click()
await page.waitForTimeout(1000)
await page.screenshot({ path: `${OUT}/08-back-to-simulation.png` })

console.log(JSON.stringify({ success: true, errorsCount: errors.length, errors }, null, 2))
await browser.close()
