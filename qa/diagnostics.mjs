import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1672, height: 944 } })
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const diagnostics = await page.evaluate(() => {
  const pick = (selector) => {
    const el = document.querySelector(selector)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    return {
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      transform: style.transform,
      position: style.position,
      top: style.top,
      zIndex: style.zIndex,
      display: style.display,
      opacity: style.opacity,
      outline: style.outline,
    }
  }
  return {
    skip: pick('.skip-link'),
    topbar: pick('.topbar'),
    main: pick('.app-main'),
    workflow: pick('.workflow'),
    rightRail: pick('.right-rail'),
    center: pick('.center-column'),
    viewport: pick('.viewport-panel'),
    sensorCards: pick('.sensor-cards'),
    activeElement: document.activeElement?.tagName,
    scrollHeight: document.documentElement.scrollHeight,
    bodyScrollHeight: document.body.scrollHeight,
  }
})
console.log(JSON.stringify(diagnostics, null, 2))
await browser.close()
