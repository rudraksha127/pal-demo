import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--force-device-scale-factor=1', '--enable-webgl', '--ignore-gpu-blocklist'],
})

const page = await browser.newPage({ viewport: { width: 1672, height: 944 }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', (error) => errors.push(`PAGEERROR ${error.message}`))

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(3500)
await page.screenshot({ path: 'qa/scene-01.png', fullPage: false })

const info = await page.evaluate(() => {
  const text = document.body.innerText
  return {
    title: document.title,
    canvas: Boolean(document.querySelector('canvas')),
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    hasDisclaimer: text.includes('This is an illustrative simulation of the proposed RF FENSE workflow.'),
    hasFinalLine: text.includes('Beyond Detection, Towards Reliable Rescue Search.'),
    scene: (text.match(/Scene\s+(\d+)\s*\/\s*12/) || [])[1] ?? null,
    buttons: [...document.querySelectorAll('button[data-control]')].map((b) => ({
      id: b.getAttribute('data-control'),
      disabled: b.disabled,
    })),
    text: text.slice(0, 1200),
  }
})

console.log(JSON.stringify({ errors, info }, null, 2))
await browser.close()
