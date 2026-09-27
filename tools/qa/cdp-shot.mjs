// Captura del panel local en una pestaña propia: node cdp-shot.mjs <ruta> <archivo> [js a evaluar antes]
import { writeFileSync } from 'node:fs'
const [path, file, before = ''] = process.argv.slice(2)
const target = await (await fetch('http://127.0.0.1:9333/json/new?http://localhost:5173' + path, { method: 'PUT' })).json()
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let n = 0
const call = (method, params = {}) => new Promise((resolve) => {
  const id = ++n
  const on = (e) => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', on); resolve(m.result) } }
  ws.addEventListener('message', on); ws.send(JSON.stringify({ id, method, params }))
})
await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await call('Page.reload')
await new Promise((r) => setTimeout(r, 5000))
if (before) { await call('Runtime.evaluate', { expression: before, awaitPromise: true }); await new Promise((r) => setTimeout(r, 1200)) }
const { data } = await call('Page.captureScreenshot', { format: 'png' })
writeFileSync(file, Buffer.from(data, 'base64'))
ws.close(); await fetch('http://127.0.0.1:9333/json/close/' + target.id)
process.exit(0)
