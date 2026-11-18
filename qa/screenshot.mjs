import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const OUT = 'qa'
await mkdir(OUT, { recursive: true })

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
await page.waitForTimeout(5000)
await page.screenshot({ path: `${OUT}/dashboard.png` })

const info = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  const rect = canvas?.getBoundingClientRect()
  return {
    title: document.title,
    canvas: Boolean(canvas),
    canvasRect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
    webgl: canvas ? Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')) : false,
    scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    text: document.body.innerText.slice(0, 900),
  }
})

console.log(JSON.stringify({ errors, info }, null, 2))
await browser.close()
