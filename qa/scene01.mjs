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
await page.waitForTimeout(2500)

const scene = await page.evaluate(() => {
  const text = document.body.innerText
  return (text.match(/Scene\s+(\d+)\s*\/\s*12/) || [])[1] ?? null
})

await page.screenshot({ path: 'qa/evidence/scene-01-normal.png' })
console.log(JSON.stringify({ scene, errors }))
await browser.close()
