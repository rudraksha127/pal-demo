import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--force-device-scale-factor=1', '--enable-webgl', '--ignore-gpu-blocklist'],
})

const page = await browser.newPage({ viewport: { width: 1672, height: 944 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

const info = await page.evaluate(() => {
  const banner = document.querySelector('.rf-disclaimer')
  const p = document.querySelector('.rf-disclaimer p')
  const rect = (el) => {
    if (!el) return null
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return {
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      scrollW: el.scrollWidth, scrollH: el.scrollHeight,
      whiteSpace: s.whiteSpace, overflow: s.overflow, display: s.display,
      fontSize: s.fontSize, lineHeight: s.lineHeight,
    }
  }
  return { banner: rect(banner), p: rect(p), text: p?.textContent?.length }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
